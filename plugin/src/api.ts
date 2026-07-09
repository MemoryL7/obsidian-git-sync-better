import { requestUrl } from "obsidian";

export interface RemoteEntry {
	path: string;
	hash: string;
	mtime: number;
	size: number;
}

/** HTTP client for the Cloudflare Worker backend. Uses requestUrl to bypass CORS. */
export class SyncClient {
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

	async upload(path: string, data: ArrayBuffer, hash: string, mtime: number): Promise<void> {
		await requestUrl({
			url: this.fileUrl(path),
			method: "PUT",
			body: data,
			contentType: "application/octet-stream",
			headers: this.headers({ "X-Hash": hash, "X-Mtime": String(mtime) }),
		});
	}

	async remove(path: string): Promise<void> {
		await requestUrl({
			url: this.fileUrl(path),
			method: "DELETE",
			headers: this.headers(),
		});
	}
}
