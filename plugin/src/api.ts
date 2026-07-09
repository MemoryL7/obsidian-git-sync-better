import { requestUrl } from "obsidian";
import type { RemoteEntry, StorageBackend } from "./backend";

/** Cloudflare Worker + R2 backend. Uses requestUrl to bypass CORS. */
export class WorkerBackend implements StorageBackend {
	readonly id = "worker-sha256";
	private endpoint: string;

	constructor(endpoint: string, private token: string) {
		this.endpoint = endpoint.replace(/\/+$/, "");
	}

	private headers(extra: Record<string, string> = {}): Record<string, string> {
		return { Authorization: `Bearer ${this.token}`, ...extra };
	}

	private fileUrl(path: string): string {
		return `${this.endpoint}/file?path=${encodeURIComponent(path)}`;
	}

	async manifest(): Promise<RemoteEntry[]> {
		const resp = await requestUrl({
			url: `${this.endpoint}/manifest`,
			headers: this.headers(),
		});
		return (resp.json as { files: RemoteEntry[] }).files;
	}

	async download(path: string): Promise<{ data: ArrayBuffer; hash: string; mtime: number }> {
		const resp = await requestUrl({
			url: this.fileUrl(path),
			headers: this.headers(),
		});
		return {
			data: resp.arrayBuffer,
			hash: resp.headers["x-hash"] ?? "",
			mtime: Number(resp.headers["x-mtime"] ?? 0),
		};
	}

	async upload(
		path: string,
		data: ArrayBuffer,
		opts: { hash: string; mtime: number; remoteHash?: string }
	): Promise<void> {
		await requestUrl({
			url: this.fileUrl(path),
			method: "PUT",
			body: data,
			contentType: "application/octet-stream",
			headers: this.headers({ "X-Hash": opts.hash, "X-Mtime": String(opts.mtime) }),
		});
	}

	async remove(path: string): Promise<void> {
		await requestUrl({
			url: this.fileUrl(path),
			method: "DELETE",
			headers: this.headers(),
		});
	}

	async hashData(data: ArrayBuffer): Promise<string> {
		const digest = await crypto.subtle.digest("SHA-256", data);
		return Array.from(new Uint8Array(digest))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}
}
