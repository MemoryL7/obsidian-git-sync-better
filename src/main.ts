import { Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, SyncSettings, SyncSettingTab } from "./settings";
import { SyncEngine, SyncSummary } from "./sync";

interface HashCacheEntry {
	mtime: number;
	size: number;
	hash: string;
	/** Backend id the hash was computed for; stale entries are recomputed. */
	algo: string;
}

interface PluginData {
	settings: SyncSettings;
	/** path -> hash keyed by mtime+size, to avoid re-hashing unchanged files. */
	hashCache: Record<string, HashCacheEntry>;
}

// This must not live in data.json: the vault (and therefore data.json) may be
// synced by iCloud between devices, but the three-way merge base is device-local.
const LOCAL_SYNC_STATE_KEY = "gitee-sync-sync-state-v1";

export default class CloudSyncPlugin extends Plugin {
	settings: SyncSettings = { ...DEFAULT_SETTINGS };
	syncState: Record<string, string> = {};
	hashCache: Record<string, HashCacheEntry> = {};

	private statusBar!: HTMLElement;
	private syncing = false;
	private autoSyncTimer: number | null = null;

	async onload(): Promise<void> {
		await this.loadPluginData();

		this.addSettingTab(new SyncSettingTab(this.app, this));
		this.statusBar = this.addStatusBarItem();
		this.statusBar.addClass("mod-clickable");
		this.statusBar.setAttribute("aria-label", "点击同步到远端仓库");
		this.statusBar.addEventListener("click", () => void this.runSync());
		this.setStatus("同步:空闲");

		this.addRibbonIcon("refresh-cw", "同步到远端仓库", () => void this.runSync());
		this.addCommand({
			id: "sync-now",
			name: "立即同步",
			callback: () => void this.runSync(),
		});

		this.setupAutoSync();
		if (this.settings.syncOnStart) {
			this.app.workspace.onLayoutReady(() => void this.runSync(true));
		}
	}

	onunload(): void {
		this.clearAutoSync();
	}

	setupAutoSync(): void {
		this.clearAutoSync();
		const minutes = this.settings.autoSyncMinutes;
		if (minutes > 0) {
			this.autoSyncTimer = window.setInterval(
				() => void this.runSync(true),
				minutes * 60 * 1000
			);
			this.registerInterval(this.autoSyncTimer);
		}
	}

	private clearAutoSync(): void {
		if (this.autoSyncTimer !== null) {
			window.clearInterval(this.autoSyncTimer);
			this.autoSyncTimer = null;
		}
	}

	async runSync(silent = false): Promise<void> {
		if (this.syncing) {
			if (!silent) new Notice("同步正在进行中");
			return;
		}
		this.syncing = true;
		this.setStatus("同步:进行中…");
		try {
			const summary = await new SyncEngine(this).run();
			this.setStatus(`同步:${new Date().toLocaleTimeString()} 完成`);
			const changed =
				summary.pushed + summary.pulled + summary.deletedLocal + summary.deletedRemote;
			if (!silent || changed > 0) {
				new Notice(this.formatSummary(summary));
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.setStatus("同步:失败");
			new Notice(`同步失败:${msg}`, 8000);
			console.error("[gitee-sync]", e);
		} finally {
			this.syncing = false;
		}
	}

	private formatSummary(s: SyncSummary): string {
		const parts: string[] = [];
		if (s.pushed) parts.push(`上传 ${s.pushed}`);
		if (s.pulled) parts.push(`下载 ${s.pulled}`);
		if (s.deletedRemote) parts.push(`删除远端 ${s.deletedRemote}`);
		if (s.deletedLocal) parts.push(`删除本地 ${s.deletedLocal}`);
		if (s.conflicts) parts.push(`冲突(按较新版本处理)${s.conflicts}`);
		return parts.length ? `同步完成:${parts.join(",")}` : "同步完成:无变化";
	}

	private setStatus(text: string): void {
		this.statusBar.setText(text);
	}

	async loadPluginData(): Promise<void> {
		const data = (await this.loadData()) as Partial<PluginData> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...data?.settings };
		// Migrate configs that predate the removal of the Cloudflare Worker backend.
		if (this.settings.backend !== "gitee" && this.settings.backend !== "github") {
			this.settings.backend = "gitee";
		}
		this.syncState =
			(this.app.loadLocalStorage(LOCAL_SYNC_STATE_KEY) as Record<string, string> | null) ?? {};
		this.hashCache = data?.hashCache ?? {};
	}

	async savePluginData(): Promise<void> {
		this.app.saveLocalStorage(LOCAL_SYNC_STATE_KEY, this.syncState);
		const data: PluginData = { settings: this.settings, hashCache: this.hashCache };
		await this.saveData(data);
	}
}
