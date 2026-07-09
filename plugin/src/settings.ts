import { App, PluginSettingTab, Setting } from "obsidian";
import type CloudSyncPlugin from "./main";

export interface SyncSettings {
	endpoint: string;
	token: string;
	autoSyncMinutes: number;
	syncOnStart: boolean;
	excludeFolders: string;
}

export const DEFAULT_SETTINGS: SyncSettings = {
	endpoint: "",
	token: "",
	autoSyncMinutes: 0,
	syncOnStart: false,
	excludeFolders: "",
};

export class SyncSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: CloudSyncPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Worker 地址")
			.setDesc("Cloudflare Worker 的完整 URL,例如 https://cc-obsidian-sync.xxx.workers.dev")
			.addText((t) =>
				t
					.setPlaceholder("https://...workers.dev")
					.setValue(this.plugin.settings.endpoint)
					.onChange(async (v) => {
						this.plugin.settings.endpoint = v.trim();
						await this.plugin.savePluginData();
					})
			);

		new Setting(containerEl)
			.setName("访问 Token")
			.setDesc("与 Worker 端 AUTH_TOKEN secret 一致")
			.addText((t) => {
				t.inputEl.type = "password";
				t.setValue(this.plugin.settings.token).onChange(async (v) => {
					this.plugin.settings.token = v.trim();
					await this.plugin.savePluginData();
				});
			});

		new Setting(containerEl)
			.setName("自动同步间隔(分钟)")
			.setDesc("0 表示关闭自动同步")
			.addText((t) =>
				t.setValue(String(this.plugin.settings.autoSyncMinutes)).onChange(async (v) => {
					const n = Number(v);
					this.plugin.settings.autoSyncMinutes = Number.isFinite(n) && n > 0 ? n : 0;
					await this.plugin.savePluginData();
					this.plugin.setupAutoSync();
				})
			);

		new Setting(containerEl)
			.setName("启动时同步")
			.setDesc("Obsidian 打开后自动执行一次同步")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.syncOnStart).onChange(async (v) => {
					this.plugin.settings.syncOnStart = v;
					await this.plugin.savePluginData();
				})
			);

		new Setting(containerEl)
			.setName("排除目录")
			.setDesc("逗号分隔的目录前缀,这些目录不参与同步,例如:templates, attachments/cache")
			.addText((t) =>
				t.setValue(this.plugin.settings.excludeFolders).onChange(async (v) => {
					this.plugin.settings.excludeFolders = v;
					await this.plugin.savePluginData();
				})
			);
	}
}
