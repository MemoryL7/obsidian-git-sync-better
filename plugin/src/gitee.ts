import { arrayBufferToBase64, base64ToArrayBuffer, requestUrl, RequestUrlResponse } from "obsidian";
import type { RemoteEntry, StorageBackend } from "./backend";

export interface GiteeConfig {
	owner: string;
	repo: string;
	branch: string;
	token: string;
}

const API = "https://gitee.com/api/v5";

/** Git object hash: sha1("blob <size>\0<content>") — matches the sha Gitee reports in trees. */
async function gitBlobSha1(data: ArrayBuffer): Promise<string> {
	const header = new TextEncoder().encode(`blob ${data.byteLength}\0`);
	const buf = new Uint8Array(header.byteLength + data.byteLength);
	buf.set(header, 0);
	buf.set(new Uint8Array(data), header.byteLength);
	const digest = await crypto.subtle.digest("SHA-1", buf);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function encodePath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

/**
 * Stores the vault as plain files in a Gitee repository via the v5 OpenAPI.
 * Every upload/delete is one commit; content hashes are git blob sha1, so the
 * manifest comes for free from the recursive tree endpoint.
 */
export class GiteeBackend implements StorageBackend {
	readonly id = "gitee-blob-sha1";

	constructor(private cfg: GiteeConfig) {}

	private get repoBase(): string {
		return `${API}/repos/${encodeURIComponent(this.cfg.owner)}/${encodeURIComponent(this.cfg.repo)}`;
	}

	private async request(
		method: string,
		url: string,
		body?: Record<string, unknown>
	): Promise<RequestUrlResponse> {
		const resp = await requestUrl({
			url,
			method,
			throw: false,
			contentType: body ? "application/json" : undefined,
			body: body ? JSON.stringify({ access_token: this.cfg.token, ...body }) : undefined,
		});
		if (resp.status >= 400) {
			let detail = "";
			try {
				detail = (resp.json as { message?: string }).message ?? "";
			} catch {
				detail = resp.text.slice(0, 200);
			}
			throw new GiteeError(resp.status, `Gitee API ${method} 失败 (${resp.status}): ${detail}`);
		}
		return resp;
	}

	async manifest(): Promise<RemoteEntry[]> {
		let resp: RequestUrlResponse;
		try {
			resp = await this.request(
				"GET",
				`${this.repoBase}/git/trees/${encodeURIComponent(this.cfg.branch)}` +
					`?access_token=${encodeURIComponent(this.cfg.token)}&recursive=1`
			);
		} catch (e) {
			// A brand-new repo has no branch yet — treat as empty, first push initializes it.
			if (e instanceof GiteeError && (e.status === 404 || e.status === 409)) return [];
			throw e;
		}
		const body = resp.json as {
			truncated?: boolean;
			tree: { path: string; type: string; sha: string; size?: number }[];
		};
		if (body.truncated) {
			// An incomplete manifest would be read as mass remote deletions — refuse to sync.
			throw new Error("Gitee 返回的文件树被截断(文件数过多),中止同步以防误删");
		}
		return body.tree
			.filter((t) => t.type === "blob")
			.map((t) => ({ path: t.path, hash: t.sha, mtime: 0, size: t.size ?? 0 }));
	}

	async download(path: string): Promise<{ data: ArrayBuffer; hash: string; mtime: number }> {
		const resp = await this.request(
			"GET",
			`${this.repoBase}/contents/${encodePath(path)}` +
				`?access_token=${encodeURIComponent(this.cfg.token)}&ref=${encodeURIComponent(this.cfg.branch)}`
		);
		const file = resp.json as { content?: string; sha: string; encoding?: string };
		let base64 = (file.content ?? "").replace(/\s/g, "");
		if (!base64 && file.sha) {
			// Contents API omits bodies for large files; fall back to the blobs endpoint.
			const blob = await this.request(
				"GET",
				`${this.repoBase}/git/blobs/${file.sha}?access_token=${encodeURIComponent(this.cfg.token)}`
			);
			base64 = ((blob.json as { content?: string }).content ?? "").replace(/\s/g, "");
		}
		return { data: base64ToArrayBuffer(base64), hash: file.sha, mtime: 0 };
	}

	async upload(
		path: string,
		data: ArrayBuffer,
		opts: { hash: string; mtime: number; remoteHash?: string }
	): Promise<void> {
		const body: Record<string, unknown> = {
			content: arrayBufferToBase64(data),
			message: `sync: update ${path}`,
			branch: this.cfg.branch,
		};
		if (opts.remoteHash) {
			await this.request("PUT", `${this.repoBase}/contents/${encodePath(path)}`, {
				...body,
				sha: opts.remoteHash,
			});
		} else {
			body.message = `sync: add ${path}`;
			await this.request("POST", `${this.repoBase}/contents/${encodePath(path)}`, body);
		}
	}

	async remove(path: string, remoteHash?: string): Promise<void> {
		if (!remoteHash) throw new Error(`删除 ${path} 需要远端 sha`);
		await this.request(
			"DELETE",
			`${this.repoBase}/contents/${encodePath(path)}` +
				`?access_token=${encodeURIComponent(this.cfg.token)}` +
				`&sha=${encodeURIComponent(remoteHash)}` +
				`&message=${encodeURIComponent(`sync: delete ${path}`)}` +
				`&branch=${encodeURIComponent(this.cfg.branch)}`
		);
	}

	hashData(data: ArrayBuffer): Promise<string> {
		return gitBlobSha1(data);
	}

	/** Last commit time touching the path — only queried on real conflicts. */
	async statMtime(path: string): Promise<number> {
		const resp = await this.request(
			"GET",
			`${this.repoBase}/commits?access_token=${encodeURIComponent(this.cfg.token)}` +
				`&sha=${encodeURIComponent(this.cfg.branch)}&path=${encodePath(path)}&page=1&per_page=1`
		);
		const commits = resp.json as { commit?: { committer?: { date?: string } } }[];
		const date = commits[0]?.commit?.committer?.date;
		return date ? Date.parse(date) : 0;
	}
}

class GiteeError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}
