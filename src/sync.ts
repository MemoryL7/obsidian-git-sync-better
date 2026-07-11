import { TFile, Vault } from "obsidian";
import { createBackend, RemoteEntry, StorageBackend } from "./backend";
import type CloudSyncPlugin from "./main";

/** Diagnostic log note; excluded from sync so it never travels between devices. */
export const LOG_FILE = "_gitee-sync-log.md";

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
		// Hidden files/dirs (.obsidian, .git, ...) are invisible to Obsidian's
		// index, so a remote copy would otherwise read as "new remote file"
		// and clobber local config on pull. Ignore them on both sides.
		if (path.split("/").some((seg) => seg.startsWith("."))) return true;
		return this.excludedPrefixes().some((p) => path.startsWith(p));
	}

	/** Dry run: build and describe the plan without transferring anything. */
	async preview(): Promise<{ plan: SyncPlan; report: string }> {
		const backend = createBackend(this.plugin.settings);
		const plan = await this.buildPlan(backend);
		return { plan, report: this.formatPlan(plan, "同步预演(未执行)") };
	}

	async run(): Promise<SyncSummary> {
		const backend = createBackend(this.plugin.settings);
		const plan = await this.buildPlan(backend);
		if (this.plugin.settings.debugLog) {
			await this.plugin.appendLog(this.formatPlan(plan, "同步执行"));
		}

		const summary: SyncSummary = {
			pushed: 0,
			pulled: 0,
			deletedLocal: 0,
			deletedRemote: 0,
			conflicts: plan.conflicts,
		};
		const nextState = { ...plan.nextState };
		const step = async (path: string, fn: () => Promise<void>) => {
			try {
				await fn();
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				throw new Error(`处理 "${path}" 失败:${msg}`);
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
					await this.vault.trash(loc.file, true);
					delete this.plugin.hashCache[path];
					summary.deletedLocal++;
				});
			}

			// Phase 2: send local changes out (sha-guarded, so a concurrent remote
			// change surfaces as an API error instead of a silent overwrite).
			for (const { path, loc, rem } of plan.pushes) {
				await step(path, async () => {
					const data = await this.vault.readBinary(loc.file);
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
					`结果:**失败** — ${e instanceof Error ? e.message : String(e)}\n` +
						`(已完成:下载 ${summary.pulled},上传 ${summary.pushed},删本地 ${summary.deletedLocal},删远端 ${summary.deletedRemote})\n`
				);
			}
			throw e;
		}

		this.plugin.syncState = nextState;
		await this.plugin.savePluginData();
		if (this.plugin.settings.debugLog) {
			await this.plugin.appendLog(
				`结果:成功 — 下载 ${summary.pulled},上传 ${summary.pushed},删本地 ${summary.deletedLocal},删远端 ${summary.deletedRemote},冲突 ${summary.conflicts}\n`
			);
		}
		return summary;
	}

	private async buildPlan(backend: StorageBackend): Promise<SyncPlan> {
		const [remoteList, local] = await Promise.all([
			backend.manifest(),
			this.buildLocalManifest(backend),
		]);
		const remote = new Map<string, RemoteEntry>(
			remoteList.filter((e) => !this.isExcluded(e.path)).map((e) => [e.path, e])
		);
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
				if (loc) plan.pushes.push({ path, loc, rem, reason: isNew ? "本地新增" : "本地修改" });
				else if (rem) plan.remoteDeletes.push({ path, rem, reason: "本地已删除" });
			} else if (remoteChanged && !localChanged) {
				if (rem) plan.pulls.push({ path, rem, reason: isNew ? "远端新增" : "远端修改" });
				else if (loc) plan.localDeletes.push({ path, loc, reason: "远端已删除" });
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
							reason: `冲突:本地较新(本地 ${ts(loc.mtime)} ≥ 远端 ${ts(remoteMtime)})`,
						});
					} else {
						plan.pulls.push({
							path,
							rem,
							reason: `冲突:远端较新(远端 ${ts(remoteMtime)} > 本地 ${ts(loc.mtime)})`,
						});
					}
				} else if (loc) {
					plan.pushes.push({ path, loc, rem, reason: "冲突:远端已删但本地有修改,保留本地" });
				} else if (rem) {
					plan.pulls.push({ path, rem, reason: "冲突:本地已删但远端有修改,保留远端" });
				}
			}
		}
		return plan;
	}

	private formatPlan(plan: SyncPlan, title: string): string {
		const s = this.plugin.settings;
		const target =
			s.backend === "github"
				? `github ${s.githubOwner}/${s.githubRepo}@${s.githubBranch}`
				: `gitee ${s.giteeOwner}/${s.giteeRepo}@${s.giteeBranch}`;
		const lines: string[] = [];
		lines.push(`\n## ${title} ${new Date().toLocaleString()}`);
		lines.push(
			`后端:${target}\n` +
				`本地 ${plan.localCount} | 远端 ${plan.remoteCount} | **基线 ${plan.baseCount}** | 一致跳过 ${plan.unchanged} | 冲突 ${plan.conflicts}`
		);
		const total =
			plan.pulls.length + plan.pushes.length + plan.localDeletes.length + plan.remoteDeletes.length;
		if (total === 0) {
			lines.push("计划:两端已一致,无需任何动作");
		} else {
			lines.push(
				`计划:下载 ${plan.pulls.length},上传 ${plan.pushes.length},删本地 ${plan.localDeletes.length},删远端 ${plan.remoteDeletes.length}`
			);
			for (const a of plan.pulls) lines.push(`- ⬇️ 下载 \`${a.path}\` — ${a.reason}`);
			for (const a of plan.localDeletes) lines.push(`- 🗑️ 删本地 \`${a.path}\` — ${a.reason}`);
			for (const a of plan.pushes) lines.push(`- ⬆️ 上传 \`${a.path}\` — ${a.reason}`);
			for (const a of plan.remoteDeletes) lines.push(`- ❌ 删远端 \`${a.path}\` — ${a.reason}`);
		}
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

function ts(ms: number): string {
	return ms > 0 ? new Date(ms).toLocaleString() : "未知";
}
