import { TFile, Vault } from "obsidian";
import { createBackend, RemoteEntry, StorageBackend } from "./backend";
import type CloudSyncPlugin from "./main";

export interface SyncSummary {
	pushed: number;
	pulled: number;
	deletedLocal: number;
	deletedRemote: number;
	conflicts: number;
}

interface LocalEntry {
	file: TFile;
	hash: string;
	mtime: number;
}

/**
 * Three-way sync: compares local vault, remote manifest and the state recorded
 * at the last successful sync, so it can distinguish "changed here" from
 * "changed there" and propagate deletions in both directions.
 * When both sides changed the same file, the newer mtime wins.
 */
export class SyncEngine {
	constructor(private plugin: CloudSyncPlugin) {}

	private get vault(): Vault {
		return this.plugin.app.vault;
	}

	private excludedPrefixes(): string[] {
		return this.plugin.settings.excludeFolders
			.split(",")
			.map((s) => s.trim().replace(/\/+$/, ""))
			.filter((s) => s.length > 0)
			.map((s) => s + "/");
	}

	private isExcluded(path: string): boolean {
		// Hidden files/dirs (.obsidian, .git, ...) are invisible to Obsidian's
		// index, so a remote copy would otherwise read as "new remote file"
		// and clobber local config on pull. Ignore them on both sides.
		if (path.split("/").some((seg) => seg.startsWith("."))) return true;
		return this.excludedPrefixes().some((p) => path.startsWith(p));
	}

	async run(): Promise<SyncSummary> {
		const backend = createBackend(this.plugin.settings);

		const [remoteList, local] = await Promise.all([
			backend.manifest(),
			this.buildLocalManifest(backend),
		]);
		const remote = new Map<string, RemoteEntry>(
			remoteList.filter((e) => !this.isExcluded(e.path)).map((e) => [e.path, e])
		);
		const base = this.plugin.syncState;

		const summary: SyncSummary = {
			pushed: 0,
			pulled: 0,
			deletedLocal: 0,
			deletedRemote: 0,
			conflicts: 0,
		};
		const nextState: Record<string, string> = {};

		const allPaths = new Set<string>([
			...local.keys(),
			...remote.keys(),
			...Object.keys(base).filter((p) => !this.isExcluded(p)),
		]);

		const push = async (path: string, loc: LocalEntry, rem: RemoteEntry | undefined) => {
			const data = await this.vault.readBinary(loc.file);
			await backend.upload(path, data, {
				hash: loc.hash,
				mtime: loc.mtime,
				remoteHash: rem?.hash,
			});
			nextState[path] = loc.hash;
			summary.pushed++;
		};
		const pull = async (path: string, rem: RemoteEntry) => {
			const { data, hash, mtime } = await backend.download(path);
			const localMtime = await this.writeLocal(path, data, mtime || rem.mtime);
			const finalHash = hash || rem.hash;
			nextState[path] = finalHash;
			this.plugin.hashCache[path] = {
				mtime: localMtime,
				size: data.byteLength,
				hash: finalHash,
				algo: backend.id,
			};
			summary.pulled++;
		};

		for (const path of allPaths) {
			const loc = local.get(path);
			const rem = remote.get(path);
			const baseHash = base[path];

			// Already identical on both sides.
			if (loc && rem && loc.hash === rem.hash) {
				nextState[path] = loc.hash;
				continue;
			}
			// Deleted on both sides (or never existed anymore).
			if (!loc && !rem) continue;

			const localChanged = loc?.hash !== baseHash;
			const remoteChanged = rem?.hash !== baseHash;

			if (localChanged && !remoteChanged) {
				if (loc) {
					await push(path, loc, rem);
				} else if (rem) {
					await backend.remove(path, rem.hash);
					summary.deletedRemote++;
				}
			} else if (remoteChanged && !localChanged) {
				if (rem) {
					await pull(path, rem);
				} else if (loc) {
					await this.vault.trash(loc.file, true);
					delete this.plugin.hashCache[path];
					summary.deletedLocal++;
				}
			} else {
				// Both sides changed since the last sync: newer mtime wins;
				// a modification beats a deletion.
				summary.conflicts++;
				if (loc && rem) {
					const remoteMtime = await this.remoteMtime(backend, path, rem);
					if (loc.mtime >= remoteMtime) await push(path, loc, rem);
					else await pull(path, rem);
				} else if (loc) {
					await push(path, loc, rem);
				} else if (rem) {
					await pull(path, rem);
				}
			}
		}

		this.plugin.syncState = nextState;
		await this.plugin.savePluginData();
		return summary;
	}

	private async remoteMtime(
		backend: StorageBackend,
		path: string,
		rem: RemoteEntry
	): Promise<number> {
		if (rem.mtime > 0 || !backend.statMtime) return rem.mtime;
		try {
			return await backend.statMtime(path);
		} catch {
			return 0;
		}
	}

	/** Builds { path -> hash } for the vault, reusing cached hashes when mtime+size are unchanged. */
	private async buildLocalManifest(backend: StorageBackend): Promise<Map<string, LocalEntry>> {
		const result = new Map<string, LocalEntry>();
		const cache = this.plugin.hashCache;
		const seen = new Set<string>();

		for (const file of this.vault.getFiles()) {
			if (this.isExcluded(file.path)) continue;
			seen.add(file.path);
			const cached = cache[file.path];
			let hash: string;
			if (
				cached &&
				cached.algo === backend.id &&
				cached.mtime === file.stat.mtime &&
				cached.size === file.stat.size
			) {
				hash = cached.hash;
			} else {
				hash = await backend.hashData(await this.vault.readBinary(file));
				cache[file.path] = {
					mtime: file.stat.mtime,
					size: file.stat.size,
					hash,
					algo: backend.id,
				};
			}
			result.set(file.path, { file, hash, mtime: file.stat.mtime });
		}

		for (const path of Object.keys(cache)) {
			if (!seen.has(path)) delete cache[path];
		}
		return result;
	}

	/** Writes the file and returns its resulting local mtime (for the hash cache). */
	private async writeLocal(path: string, data: ArrayBuffer, mtime: number): Promise<number> {
		const dir = path.split("/").slice(0, -1).join("/");
		if (dir) await this.ensureFolder(dir);
		const existing = this.vault.getAbstractFileByPath(path);
		const options = mtime > 0 ? { mtime } : undefined;
		if (existing instanceof TFile) {
			await this.vault.modifyBinary(existing, data, options);
		} else {
			await this.vault.createBinary(path, data, options);
		}
		const written = this.vault.getAbstractFileByPath(path);
		return written instanceof TFile ? written.stat.mtime : mtime;
	}

	private async ensureFolder(dir: string): Promise<void> {
		const parts = dir.split("/");
		let current = "";
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.vault.getAbstractFileByPath(current)) {
				try {
					await this.vault.createFolder(current);
				} catch {
					// Folder may have been created concurrently; ignore.
				}
			}
		}
	}
}
