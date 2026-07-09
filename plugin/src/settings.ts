import { App, PluginSettingTab, Setting } from "obsidian";
import type CloudSyncPlugin from "./main";

export type BackendType = "gitee" | "worker";

export interface SyncSettings {
	backend: BackendType;
	/* Cloudflare Worker backend */
	endpoint: string;
	token: string;
	/* Gitee backend */
	giteeOwner: string;
	giteeRepo: string;
	giteeBranch: string;
	giteeToken: string;
	/* common */
	autoSyncMinutes: number;
	syncOnStart: boolean;
	excludeFolders: string;
}

export const DEFAULT_SETTINGS: SyncSettings = {
	backend: "gitee",
	endpoint: "",
	token: "",
	giteeOwner: "",
	giteeRepo: "",
	giteeBranch: "master",
	giteeToken: "",
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
		const s = this.plugin.settings;
		const save = () => this.plugin.savePluginData();

		new Setting(containerEl)
			.setName("存储后端")
			.setDesc("切换后端后,首次同步会对两边差异做一次全量对账(按修改时间较新一方为准)")
			.addDropdown((d) =>
				d
					.addOption("gitee", "Gitee 仓库")
					.addOption("worker", "Cloudflare Worker + R2")
					.setValue(s.backend)
					.onChange(async (v) => {
						s.backend = v as BackendType;
						await save();
						this.display();
					})
			);

		if (s.backend === "gitee") {
			new Setting(containerEl)
				.setName("Gitee 用户名")
				.setDesc("仓库所属的用户名或组织名(即仓库 URL 中的 owner)")
				.addText((t) =>
					t.setPlaceholder("your-name").setValue(s.giteeOwner).onChange(async (v) => {
						s.giteeOwner = v.trim();
						await save();
					})
				);

			new Setting(containerEl)
				.setName("仓库名")
				.setDesc("建议使用一个专门的私有仓库")
				.addText((t) =>
					t.setPlaceholder("obsidian-vault").setValue(s.giteeRepo).onChange(async (v) => {
						s.giteeRepo = v.trim();
						await save();
					})
				);

			new Setting(containerEl)
				.setName("分支")
				.addText((t) =>
					t.setPlaceholder("master").setValue(s.giteeBranch).onChange(async (v) => {
						s.giteeBranch = v.trim() || "master";
						await save();
					})
				);

			new Setting(containerEl)
				.setName("私人令牌")
				.setDesc("Gitee 设置 → 私人令牌,需勾选 projects 权限")
				.addText((t) => {
					t.inputEl.type = "password";
					t.setValue(s.giteeToken).onChange(async (v) => {
						s.giteeToken = v.trim();
						await save();
					});
				});
		} else {
			new Setting(containerEl)
				.setName("Worker 地址")
				.setDesc("Cloudflare Worker 的完整 URL,例如 https://cc-obsidian-sync.xxx.workers.dev")
				.addText((t) =>
					t.setPlaceholder("https://...workers.dev").setValue(s.endpoint).onChange(async (v) => {
						s.endpoint = v.trim();
						await save();
					})
				);

			new Setting(containerEl)
				.setName("访问 Token")
				.setDesc("与 Worker 端 AUTH_TOKEN secret 一致")
				.addText((t) => {
					t.inputEl.type = "password";
					t.setValue(s.token).onChange(async (v) => {
						s.token = v.trim();
						await save();
					});
				});
		}

		new Setting(containerEl)
			.setName("自动同步间隔(分钟)")
			.setDesc("0 表示关闭自动同步")
			.addText((t) =>
				t.setValue(String(s.autoSyncMinutes)).onChange(async (v) => {
					const n = Number(v);
					s.autoSyncMinutes = Number.isFinite(n) && n > 0 ? n : 0;
					await save();
					this.plugin.setupAutoSync();
				})
			);

		new Setting(containerEl)
			.setName("启动时同步")
			.setDesc("Obsidian 打开后自动执行一次同步")
			.addToggle((t) =>
				t.setValue(s.syncOnStart).onChange(async (v) => {
					s.syncOnStart = v;
					await save();
				})
			);

		new Setting(containerEl)
			.setName("排除目录")
			.setDesc("逗号分隔的目录前缀,这些目录不参与同步,例如:templates, attachments/cache")
			.addText((t) =>
				t.setValue(s.excludeFolders).onChange(async (v) => {
					s.excludeFolders = v;
					await save();
				})
			);
	}
}
