/**
 * Obsidian vault sync backend on Cloudflare Workers + R2.
 *
 * API (all requests require `Authorization: Bearer <AUTH_TOKEN>`):
 *   GET    /manifest            -> { files: [{ path, hash, mtime, size }] }
 *   GET    /file?path=<path>    -> file body, X-Hash / X-Mtime headers
 *   PUT    /file?path=<path>    -> store body; X-Hash / X-Mtime headers are persisted
 *   DELETE /file?path=<path>    -> remove file
 */

export interface Env {
	VAULT: R2Bucket;
	AUTH_TOKEN: string;
}

interface ManifestEntry {
	path: string;
	hash: string;
	mtime: number;
	size: number;
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function isValidPath(path: string): boolean {
	if (!path || path.length > 1024) return false;
	if (path.startsWith("/") || path.endsWith("/")) return false;
	const segments = path.split("/");
	return segments.every((s) => s.length > 0 && s !== "." && s !== "..");
}

async function listManifest(env: Env): Promise<Response> {
	const files: ManifestEntry[] = [];
	let cursor: string | undefined;
	do {
		const page = await env.VAULT.list({ cursor, include: ["customMetadata"] });
		for (const obj of page.objects) {
			files.push({
				path: obj.key,
				hash: obj.customMetadata?.hash ?? "",
				mtime: Number(obj.customMetadata?.mtime ?? 0),
				size: obj.size,
			});
		}
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);
	return json({ files });
}

async function getFile(env: Env, path: string): Promise<Response> {
	const obj = await env.VAULT.get(path);
	if (!obj) return json({ error: "not found" }, 404);
	return new Response(obj.body, {
		headers: {
			"Content-Type": "application/octet-stream",
			"X-Hash": obj.customMetadata?.hash ?? "",
			"X-Mtime": obj.customMetadata?.mtime ?? "0",
		},
	});
}

async function putFile(env: Env, path: string, request: Request): Promise<Response> {
	const hash = request.headers.get("X-Hash") ?? "";
	const mtime = request.headers.get("X-Mtime") ?? "0";
	const body = await request.arrayBuffer();
	await env.VAULT.put(path, body, { customMetadata: { hash, mtime } });
	return json({ ok: true, path, size: body.byteLength });
}

async function deleteFile(env: Env, path: string): Promise<Response> {
	await env.VAULT.delete(path);
	return json({ ok: true, path });
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (!env.AUTH_TOKEN) {
			return json({ error: "server not configured: AUTH_TOKEN secret missing" }, 500);
		}
		const auth = request.headers.get("Authorization") ?? "";
		if (auth !== `Bearer ${env.AUTH_TOKEN}`) {
			return json({ error: "unauthorized" }, 401);
		}

		const url = new URL(request.url);
		try {
			if (url.pathname === "/manifest" && request.method === "GET") {
				return await listManifest(env);
			}
			if (url.pathname === "/file") {
				const path = url.searchParams.get("path") ?? "";
				if (!isValidPath(path)) return json({ error: "invalid path" }, 400);
				if (request.method === "GET") return await getFile(env, path);
				if (request.method === "PUT") return await putFile(env, path, request);
				if (request.method === "DELETE") return await deleteFile(env, path);
				return json({ error: "method not allowed" }, 405);
			}
			return json({ error: "not found" }, 404);
		} catch (e) {
			return json({ error: e instanceof Error ? e.message : String(e) }, 500);
		}
	},
} satisfies ExportedHandler<Env>;
