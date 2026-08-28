import { TFile, Vault } from "obsidian";
import { createBackend, RemoteEntry, StorageBackend } from "./backend";
import { formatDateTime, messages } from "./i18n";
import type CloudSyncPlugin from "./main";

/** Diagnostic log note; excluded from sync so it never travels between devices. */
export const LOG_FILE = "_gitee-sync-log.md";

export interface SyncSummary {
	pushed: number;
	pulled: number;
	deletedLocal: number;
	deletedRemote: number;
	conflicts: number;
	skippedEmpty: number;
}

interface LocalEntry {
	file: TFile;
	hash: string;
	mtime: number;
}

export interface SyncPlan {
	localCount: number;
	remoteCount: number;
	baseCount: number;
	unchanged: number;
	conflicts: number;
	pulls: { path: string; rem: RemoteEntry; reason: string }[];
	localDeletes: { path: string; loc: LocalEntry; reason: string }[];
	pushes: { path: string; loc: LocalEntry; rem?: RemoteEntry; reason: string }[];
	remoteDeletes: { path: string; rem: RemoteEntry; reason: string }[];
	/** Empty local files, excluded from sync: the contents APIs cannot create them. */
	skippedEmpty: string[];
	/** Baseline entries for paths already identical on both sides. */
	nextState: Record<string, string>;
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
		if (path === LOG_FILE) return true;
		const segments = path.split("/");
		for (const seg of segments) {
			if (seg === ".obsidian") {
				if (!this.plugin.settings.syncDotObsidian) return true;
				continue;
			}
			if (seg.startsWith(".")) return true;
		}
		// Volatile per-device state: written continuously by Obsidian and never
		// meaningfully mergeable, so it is excluded even when .obsidian syncs.
		if (
			path === ".obsidian/workspace.json" ||
			path === ".obsidian/workspace-mobile.json"
		) {
			return true;
		}
		return this.excludedPrefixes().some((p) => path.startsWith(p));
	}

	/** Dry run: build and describe the plan without transferring anything. */
	async preview(): Promise<{ plan: SyncPlan; report: string }> {
		const backend = createBackend(this.plugin.settings);
		const plan = await this.buildPlan(backend);
		return { plan, report: this.formatPlan(plan, messages().previewTitle) };
	}

	async run(): Promise<SyncSummary> {
		const l = messages();
		const backend = createBackend(this.plugin.settings);
		const plan = await this.buildPlan(backend);
		if (this.plugin.settings.debugLog) {
			await this.plugin.appendLog(this.formatPlan(plan, l.executionTitle));
		}

		const summary: SyncSummary = {
			pushed: 0,
			pulled: 0,
			deletedLocal: 0,
			deletedRemote: 0,
			conflicts: plan.conflicts,
			skippedEmpty: plan.skippedEmpty.length,
		};
		const nextState = { ...plan.nextState };
		const step = async (path: string, fn: () => Promise<void>) => {
			try {
				await fn();
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				throw new Error(l.pathFailed(path, msg));
			}
		};

		try {
			// Phase 1: bring remote changes in. An interrupted sync only ever
			// leaves local work undone — the remote stays intact.
			for (const { path, rem } of plan.pulls) {
				await step(path, async () => {
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
				});
			}
			for (const { path, loc } of plan.localDeletes) {
				await step(path, async () => {
					await this.deleteLocalFile(path, loc);
					delete this.plugin.hashCache[path];
					summary.deletedLocal++;
				});
			}

			// Phase 2: send local changes out (sha-guarded, so a concurrent remote
			// change surfaces as an API error instead of a silent overwrite).
			for (const { path, loc, rem } of plan.pushes) {
				await step(path, async () => {
					const data = await this.readEntryData(path, loc);
					await backend.upload(path, data, {
						hash: loc.hash,
						mtime: loc.mtime,
						remoteHash: rem?.hash,
					});
					nextState[path] = loc.hash;
					summary.pushed++;
				});
			}
			for (const { path, rem } of plan.remoteDeletes) {
				await step(path, async () => {
					await backend.remove(path, rem.hash);
					summary.deletedRemote++;
				});
			}
		} catch (e) {
			// Persist what already succeeded so a re-run doesn't redo it.
			this.plugin.syncState = nextState;
			await this.plugin.savePluginData();
			if (this.plugin.settings.debugLog) {
				await this.plugin.appendLog(
					l.resultFailed(e instanceof Error ? e.message : String(e)) +
						l.completedCounts(
							summary.pulled,
							summary.pushed,
							summary.deletedLocal,
							summary.deletedRemote
						)
				);
			}
			throw e;
		}

		this.plugin.syncState = nextState;
		await this.plugin.savePluginData();
		if (this.plugin.settings.debugLog) {
			await this.plugin.appendLog(
				l.resultSuccess(
					summary.pulled,
					summary.pushed,
					summary.deletedLocal,
					summary.deletedRemote,
					summary.conflicts
				)
			);
		}
		return summary;
	}

	private async buildPlan(backend: StorageBackend): Promise<SyncPlan> {
		const l = messages();
		const [remoteList, { entries: local, empty: emptyLocal }] = await Promise.all([
			backend.manifest(),
			this.buildLocalManifest(backend),
		]);
		const remote = new Map<string, RemoteEntry>(
			remoteList.filter((e) => !this.isExcluded(e.path)).map((e) => [e.path, e])
		);
		// Empty files never appear in the local manifest, so an existing remote
		// copy would otherwise be read as "deleted locally" and get wiped.
		for (const path of emptyLocal) remote.delete(path);
		const base = this.plugin.syncState;
		const basePaths = Object.keys(base).filter((p) => !this.isExcluded(p));

		const plan: SyncPlan = {
			localCount: local.size,
			remoteCount: remote.size,
			baseCount: basePaths.length,
			unchanged: 0,
			conflicts: 0,
			pulls: [],
			localDeletes: [],
			pushes: [],
			remoteDeletes: [],
			skippedEmpty: [...emptyLocal],
			nextState: {},
		};

		const allPaths = new Set<string>([...local.keys(), ...remote.keys(), ...basePaths]);

		for (const path of allPaths) {
			const loc = local.get(path);
			const rem = remote.get(path);
			const baseHash = base[path];

			// Already identical on both sides.
			if (loc && rem && loc.hash === rem.hash) {
				plan.nextState[path] = loc.hash;
				plan.unchanged++;
				continue;
			}
			// Deleted on both sides (or never existed anymore).
			if (!loc && !rem) continue;

			const localChanged = loc?.hash !== baseHash;
			const remoteChanged = rem?.hash !== baseHash;
			const isNew = baseHash === undefined;

			if (localChanged && !remoteChanged) {
				if (loc)
					plan.pushes.push({
						path,
						loc,
						rem,
						reason: isNew ? l.reasonLocalAdded : l.reasonLocalModified,
					});
				else if (rem) plan.remoteDeletes.push({ path, rem, reason: l.reasonLocalDeleted });
			} else if (remoteChanged && !localChanged) {
				if (rem)
					plan.pulls.push({
						path,
						rem,
						reason: isNew ? l.reasonRemoteAdded : l.reasonRemoteModified,
					});
				else if (loc) plan.localDeletes.push({ path, loc, reason: l.reasonRemoteDeleted });
			} else {
				// Both sides changed since the last sync: newer mtime wins;
				// a modification beats a deletion.
				plan.conflicts++;
				if (loc && rem) {
					const remoteMtime = await this.remoteMtime(backend, path, rem);
					if (loc.mtime >= remoteMtime) {
						plan.pushes.push({
							path,
							loc,
							rem,
							reason: l.reasonConflictLocalNewer(ts(loc.mtime), ts(remoteMtime)),
						});
					} else {
						plan.pulls.push({
							path,
							rem,
							reason: l.reasonConflictRemoteNewer(ts(remoteMtime), ts(loc.mtime)),
						});
					}
				} else if (loc) {
					plan.pushes.push({ path, loc, rem, reason: l.reasonConflictKeepLocal });
				} else if (rem) {
					plan.pulls.push({ path, rem, reason: l.reasonConflictKeepRemote });
				}
			}
		}
		return plan;
	}

	private formatPlan(plan: SyncPlan, title: string): string {
		const l = messages();
		const s = this.plugin.settings;
		const target =
			s.backend === "github"
				? `github ${s.githubOwner}/${s.githubRepo}@${s.githubBranch}`
				: `gitee ${s.giteeOwner}/${s.giteeRepo}@${s.giteeBranch}`;
		const lines: string[] = [];
		lines.push(`\n## ${title} ${formatDateTime()}`);
		lines.push(
			l.planBackend(target) +
				"\n" +
				l.planCounts(
					plan.localCount,
					plan.remoteCount,
					plan.baseCount,
					plan.unchanged,
					plan.conflicts
				)
		);
		const total =
			plan.pulls.length + plan.pushes.length + plan.localDeletes.length + plan.remoteDeletes.length;
		if (total === 0) {
			lines.push(l.planNoActions);
		} else {
			lines.push(
				l.planActions(
					plan.pulls.length,
					plan.pushes.length,
					plan.localDeletes.length,
					plan.remoteDeletes.length
				)
			);
			for (const a of plan.pulls)
				lines.push(`- ⬇️ ${l.actionDownload} \`${a.path}\` — ${a.reason}`);
			for (const a of plan.localDeletes)
				lines.push(`- 🗑️ ${l.actionDeleteLocal} \`${a.path}\` — ${a.reason}`);
			for (const a of plan.pushes)
				lines.push(`- ⬆️ ${l.actionUpload} \`${a.path}\` — ${a.reason}`);
			for (const a of plan.remoteDeletes)
				lines.push(`- ❌ ${l.actionDeleteRemote} \`${a.path}\` — ${a.reason}`);
		}
		for (const p of plan.skippedEmpty)
			lines.push(`- ⏭️ ${l.actionSkipEmpty} \`${p}\` — ${l.reasonEmptyFile}`);
		return lines.join("\n") + "\n";
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

	/** Builds { path -> hash } for the vault, reusing cached hashes when mtime+size are unchanged.
	 * Empty files are returned separately: the contents APIs reject them (Gitee:
	 * 400 "content is empty"), so they are kept out of the comparison instead
	 * of failing every sync. */
	private async buildLocalManifest(
		backend: StorageBackend
	): Promise<{ entries: Map<string, LocalEntry>; empty: Set<string> }> {
		const entries = new Map<string, LocalEntry>();
		const empty = new Set<string>();
		const cache = this.plugin.hashCache;
		const seen = new Set<string>();

		for (const file of this.vault.getFiles()) {
			if (this.isExcluded(file.path)) continue;
			seen.add(file.path);
			if (file.stat.size === 0) {
				empty.add(file.path);
				continue;
			}
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
			entries.set(file.path, { file, hash, mtime: file.stat.mtime });
		}

		// Obsidian's index never includes hidden directories, so .obsidian files
		// are invisible to getFiles(). Enumerate them via the adapter instead,
		// otherwise the toggle could never push config changes.
		if (this.plugin.settings.syncDotObsidian) {
			await this.collectHiddenEntries(".obsidian", backend, entries, empty, seen);
		}

		for (const path of Object.keys(cache)) {
			if (!seen.has(path)) delete cache[path];
		}
		return { entries, empty };
	}

	/** Recursively adds .obsidian files (invisible to vault.getFiles()) to the local manifest. */
	private async collectHiddenEntries(
		dir: string,
		backend: StorageBackend,
		entries: Map<string, LocalEntry>,
		empty: Set<string>,
		seen: Set<string>
	): Promise<void> {
		const adapter = this.vault.adapter;
		let listing;
		try {
			listing = await adapter.list(dir);
		} catch {
			return; // Directory does not exist on this device.
		}
		for (const path of listing.files) {
			if (this.isExcluded(path)) {
				continue;
			}
			seen.add(path);
			const stat = await adapter.stat(path);
			if (!stat || stat.size === 0) {
				empty.add(path);
				continue;
			}
			const mtime = stat.mtime;
			const cached = this.plugin.hashCache[path];
			let hash: string;
			if (
				cached &&
				cached.algo === backend.id &&
				cached.mtime === mtime &&
				cached.size === stat.size
			) {
				hash = cached.hash;
			} else {
				hash = await backend.hashData(await adapter.readBinary(path));
				this.plugin.hashCache[path] = { mtime, size: stat.size, hash, algo: backend.id };
			}
			// No TFile exists for hidden paths; entries carry a null file and all
			// reads/writes for them go through the adapter.
			entries.set(path, { file: null as unknown as TFile, hash, mtime });
		}
		for (const sub of listing.folders) {
			await this.collectHiddenEntries(sub, backend, entries, empty, seen);
		}
	}

	/** Reads any file, including hidden ones not present in the vault index. */
	private async readEntryData(path: string, loc: LocalEntry): Promise<ArrayBuffer> {
		if (loc.file instanceof TFile) return this.vault.readBinary(loc.file);
		return this.vault.adapter.readBinary(path);
	}

	/** Writes the file and returns its resulting local mtime (for the hash cache). */
	private async writeLocal(path: string, data: ArrayBuffer, mtime: number): Promise<number> {
		const dir = path.split("/").slice(0, -1).join("/");
		if (dir) await this.ensureFolder(dir);
		const hidden = path.split("/").some((seg) => seg.startsWith("."));
		if (hidden) {
			// Hidden paths have no TFile and must not use vault.createBinary,
			// which throws "file already exists" for unindexed files.
			await this.vault.adapter.writeBinary(path, data);
			const stat = await this.vault.adapter.stat(path);
			return stat?.mtime ?? mtime;
		}
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
			if (current.startsWith(".")) {
				// Hidden folders are invisible to getAbstractFileByPath on some
				// platforms; mkdir is idempotent, so just ensure it exists.
				try {
					await this.vault.adapter.mkdir(current);
				} catch {
					// Already exists.
				}
				continue;
			}
			if (!this.vault.getAbstractFileByPath(current)) {
				try {
					await this.vault.createFolder(current);
				} catch {
					// Folder may have been created concurrently; ignore.
				}
			}
		}
	}

	/** Deletes a local file: trash indexed files, adapter-remove hidden ones. */
	private async deleteLocalFile(path: string, loc: LocalEntry): Promise<void> {
		if (loc.file instanceof TFile) {
			await this.vault.trash(loc.file, true);
		} else {
			await this.vault.adapter.remove(path);
		}
	}
}

function ts(ms: number): string {
	return ms > 0 ? formatDateTime(new Date(ms)) : messages().unknown;
}
