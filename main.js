"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CloudSyncPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// src/i18n.ts
var import_obsidian = require("obsidian");
var en = {
  clickToSync: "Click to sync with the remote repository",
  ribbonSync: "Sync with remote repository",
  commandSyncNow: "Sync now",
  commandPreview: "Preview sync plan (no changes; writes to diagnostic note)",
  statusIdle: "Sync: idle",
  statusRunning: "Sync: in progress\u2026",
  statusComplete: (time) => `Sync: ${time} complete`,
  statusFailed: "Sync: failed",
  syncInProgress: "Sync is already in progress",
  syncFailed: (message) => `Sync failed: ${message}`,
  previewWhileSyncing: "Sync is in progress. Try the preview again later.",
  previewComplete: (pulled, pushed, deletedLocal, deletedRemote, file) => `Preview complete: download ${pulled}, upload ${pushed}, delete local ${deletedLocal}, delete remote ${deletedRemote} (see ${file})`,
  previewFailed: (message) => `Preview failed: ${message}`,
  previewFailedLog: (time, message) => `
## Sync preview failed ${time}
${message}
`,
  diagnosticLogTitle: "# Gitee Sync diagnostic log\n",
  summaryUpload: (count) => `uploaded ${count}`,
  summaryDownload: (count) => `downloaded ${count}`,
  summaryDeleteRemote: (count) => `deleted remote ${count}`,
  summaryDeleteLocal: (count) => `deleted local ${count}`,
  summaryConflict: (count) => `conflicts (newer version won) ${count}`,
  summarySkippedEmpty: (count) => `skipped empty files ${count}`,
  summaryComplete: (parts) => `Sync complete: ${parts}`,
  summaryNoChanges: "Sync complete: no changes",
  missingGithubSettings: "Enter the GitHub owner, repository, and access token in settings first.",
  missingGiteeSettings: "Enter the Gitee owner, repository, and personal access token in settings first.",
  apiFailed: (host, method, status, detail) => `${host} API ${method} failed (${status}): ${detail}`,
  remoteTreeTruncated: "The remote file tree was truncated because it is too large. Sync was stopped to prevent accidental deletion.",
  deleteNeedsSha: (path) => `Deleting ${path} requires the remote SHA.`,
  commitAdd: (path) => `sync: add ${path}`,
  commitUpdate: (path) => `sync: update ${path}`,
  commitDelete: (path) => `sync: delete ${path}`,
  settingsBackend: "Storage backend",
  settingsBackendDesc: "After switching backends, the next sync performs a full reconciliation and keeps the newer modification.",
  optionGitee: "Gitee repository",
  optionGithub: "GitHub repository",
  settingsGiteeOwner: "Gitee owner",
  settingsGithubOwner: "GitHub owner",
  settingsOwnerDesc: "User or organization that owns the repository, as shown in its URL.",
  settingsRepo: "Repository name",
  settingsRepoDesc: "A dedicated private repository is recommended.",
  settingsBranch: "Branch",
  settingsGiteeToken: "Personal access token",
  settingsGiteeTokenDesc: "Gitee Settings \u2192 Security Settings \u2192 Personal access tokens; enable the projects permission.",
  settingsGithubToken: "Access token",
  settingsGithubTokenDesc: "GitHub Settings \u2192 Developer settings \u2192 Personal access tokens; fine-grained tokens need Contents read/write permission for the repository (classic tokens need repo).",
  settingsAutoSync: "Automatic sync interval (minutes)",
  settingsAutoSyncDesc: "Enter 0 to disable automatic sync.",
  settingsSyncOnStart: "Sync on startup",
  settingsSyncOnStartDesc: "Run one sync after Obsidian starts.",
  settingsExcludeFolders: "Excluded folders",
  settingsExcludeFoldersDesc: "Comma-separated folder prefixes that will not be synced, for example: templates, attachments/cache",
  settingsSyncDotObsidian: "Sync .obsidian folder",
  settingsSyncDotObsidianDesc: "Include the .obsidian folder in sync so plugin settings are shared across devices. Only enable when all devices use the same platform.",
  settingsDebugLog: "Diagnostic log",
  settingsDebugLogDesc: "Record each sync plan and result in _gitee-sync-log.md at the vault root. The log itself is excluded from sync.",
  previewTitle: "Sync preview (not executed)",
  executionTitle: "Sync execution",
  pathFailed: (path, message) => `Failed to process "${path}": ${message}`,
  resultFailed: (message) => `Result: **Failed** \u2014 ${message}
`,
  completedCounts: (pulled, pushed, deletedLocal, deletedRemote) => `(Completed: downloaded ${pulled}, uploaded ${pushed}, deleted local ${deletedLocal}, deleted remote ${deletedRemote})
`,
  resultSuccess: (pulled, pushed, deletedLocal, deletedRemote, conflicts) => `Result: success \u2014 downloaded ${pulled}, uploaded ${pushed}, deleted local ${deletedLocal}, deleted remote ${deletedRemote}, conflicts ${conflicts}
`,
  reasonLocalAdded: "Added locally",
  reasonLocalModified: "Modified locally",
  reasonLocalDeleted: "Deleted locally",
  reasonRemoteAdded: "Added remotely",
  reasonRemoteModified: "Modified remotely",
  reasonRemoteDeleted: "Deleted remotely",
  reasonConflictLocalNewer: (local, remote) => `Conflict: local is newer (local ${local} \u2265 remote ${remote})`,
  reasonConflictRemoteNewer: (remote, local) => `Conflict: remote is newer (remote ${remote} > local ${local})`,
  reasonConflictKeepLocal: "Conflict: remote was deleted but local was modified; keep local",
  reasonConflictKeepRemote: "Conflict: local was deleted but remote was modified; keep remote",
  planBackend: (target) => `Backend: ${target}`,
  planCounts: (local, remote, base, unchanged, conflicts) => `Local ${local} | Remote ${remote} | **Baseline ${base}** | Unchanged ${unchanged} | Conflicts ${conflicts}`,
  planNoActions: "Plan: both sides already match; no action needed",
  planActions: (pulled, pushed, deletedLocal, deletedRemote) => `Plan: download ${pulled}, upload ${pushed}, delete local ${deletedLocal}, delete remote ${deletedRemote}`,
  actionDownload: "Download",
  actionDeleteLocal: "Delete local",
  actionUpload: "Upload",
  actionDeleteRemote: "Delete remote",
  actionSkipEmpty: "Skip",
  reasonEmptyFile: "Empty file \u2014 the contents API cannot create it",
  unknown: "Unknown"
};
var zh = {
  clickToSync: "\u70B9\u51FB\u540C\u6B65\u5230\u8FDC\u7AEF\u4ED3\u5E93",
  ribbonSync: "\u540C\u6B65\u5230\u8FDC\u7AEF\u4ED3\u5E93",
  commandSyncNow: "\u7ACB\u5373\u540C\u6B65",
  commandPreview: "\u9884\u89C8\u540C\u6B65\u8BA1\u5212\uFF08\u4E0D\u6267\u884C\uFF0C\u7ED3\u679C\u5199\u5165\u65E5\u5FD7\u7B14\u8BB0\uFF09",
  statusIdle: "\u540C\u6B65\uFF1A\u7A7A\u95F2",
  statusRunning: "\u540C\u6B65\uFF1A\u8FDB\u884C\u4E2D\u2026",
  statusComplete: (time) => `\u540C\u6B65\uFF1A${time} \u5B8C\u6210`,
  statusFailed: "\u540C\u6B65\uFF1A\u5931\u8D25",
  syncInProgress: "\u540C\u6B65\u6B63\u5728\u8FDB\u884C\u4E2D",
  syncFailed: (message) => `\u540C\u6B65\u5931\u8D25\uFF1A${message}`,
  previewWhileSyncing: "\u540C\u6B65\u6B63\u5728\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u518D\u9884\u89C8",
  previewComplete: (pulled, pushed, deletedLocal, deletedRemote, file) => `\u9884\u6F14\u5B8C\u6210\uFF1A\u4E0B\u8F7D ${pulled}\uFF0C\u4E0A\u4F20 ${pushed}\uFF0C\u5220\u9664\u672C\u5730 ${deletedLocal}\uFF0C\u5220\u9664\u8FDC\u7AEF ${deletedRemote}\uFF08\u8BE6\u89C1 ${file}\uFF09`,
  previewFailed: (message) => `\u9884\u6F14\u5931\u8D25\uFF1A${message}`,
  previewFailedLog: (time, message) => `
## \u540C\u6B65\u9884\u6F14\u5931\u8D25 ${time}
${message}
`,
  diagnosticLogTitle: "# Gitee Sync \u8BCA\u65AD\u65E5\u5FD7\n",
  summaryUpload: (count) => `\u4E0A\u4F20 ${count}`,
  summaryDownload: (count) => `\u4E0B\u8F7D ${count}`,
  summaryDeleteRemote: (count) => `\u5220\u9664\u8FDC\u7AEF ${count}`,
  summaryDeleteLocal: (count) => `\u5220\u9664\u672C\u5730 ${count}`,
  summaryConflict: (count) => `\u51B2\u7A81\uFF08\u6309\u8F83\u65B0\u7248\u672C\u5904\u7406\uFF09${count}`,
  summarySkippedEmpty: (count) => `\u8DF3\u8FC7\u7A7A\u6587\u4EF6 ${count} \u4E2A`,
  summaryComplete: (parts) => `\u540C\u6B65\u5B8C\u6210\uFF1A${parts}`,
  summaryNoChanges: "\u540C\u6B65\u5B8C\u6210\uFF1A\u65E0\u53D8\u5316",
  missingGithubSettings: "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 GitHub \u7528\u6237\u540D\u3001\u4ED3\u5E93\u540D\u548C\u8BBF\u95EE\u4EE4\u724C\u3002",
  missingGiteeSettings: "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 Gitee \u7528\u6237\u540D\u3001\u4ED3\u5E93\u540D\u548C\u79C1\u4EBA\u4EE4\u724C\u3002",
  apiFailed: (host, method, status, detail) => `${host} API ${method} \u5931\u8D25\uFF08${status}\uFF09\uFF1A${detail}`,
  remoteTreeTruncated: "\u8FDC\u7AEF\u8FD4\u56DE\u7684\u6587\u4EF6\u6811\u88AB\u622A\u65AD\uFF08\u6587\u4EF6\u6570\u8FC7\u591A\uFF09\uFF0C\u5DF2\u4E2D\u6B62\u540C\u6B65\u4EE5\u9632\u8BEF\u5220\u3002",
  deleteNeedsSha: (path) => `\u5220\u9664 ${path} \u9700\u8981\u8FDC\u7AEF SHA\u3002`,
  commitAdd: (path) => `\u540C\u6B65\uFF1A\u65B0\u589E ${path}`,
  commitUpdate: (path) => `\u540C\u6B65\uFF1A\u66F4\u65B0 ${path}`,
  commitDelete: (path) => `\u540C\u6B65\uFF1A\u5220\u9664 ${path}`,
  settingsBackend: "\u5B58\u50A8\u540E\u7AEF",
  settingsBackendDesc: "\u5207\u6362\u540E\u7AEF\u540E\uFF0C\u9996\u6B21\u540C\u6B65\u4F1A\u5BF9\u4E24\u8FB9\u5DEE\u5F02\u505A\u4E00\u6B21\u5168\u91CF\u5BF9\u8D26\uFF0C\u5E76\u4FDD\u7559\u4FEE\u6539\u65F6\u95F4\u8F83\u65B0\u7684\u7248\u672C\u3002",
  optionGitee: "Gitee \u4ED3\u5E93",
  optionGithub: "GitHub \u4ED3\u5E93",
  settingsGiteeOwner: "Gitee \u7528\u6237\u540D",
  settingsGithubOwner: "GitHub \u7528\u6237\u540D",
  settingsOwnerDesc: "\u4ED3\u5E93\u6240\u5C5E\u7684\u7528\u6237\u540D\u6216\u7EC4\u7EC7\u540D\uFF08\u5373\u4ED3\u5E93 URL \u4E2D\u7684 owner\uFF09\u3002",
  settingsRepo: "\u4ED3\u5E93\u540D",
  settingsRepoDesc: "\u5EFA\u8BAE\u4F7F\u7528\u4E00\u4E2A\u4E13\u95E8\u7684\u79C1\u6709\u4ED3\u5E93\u3002",
  settingsBranch: "\u5206\u652F",
  settingsGiteeToken: "\u79C1\u4EBA\u4EE4\u724C",
  settingsGiteeTokenDesc: "Gitee \u8BBE\u7F6E \u2192 \u5B89\u5168\u8BBE\u7F6E \u2192 \u79C1\u4EBA\u4EE4\u724C\uFF0C\u9700\u52FE\u9009 projects \u6743\u9650\u3002",
  settingsGithubToken: "\u8BBF\u95EE\u4EE4\u724C",
  settingsGithubTokenDesc: "GitHub Settings \u2192 Developer settings \u2192 Personal access tokens\uFF1Bfine-grained \u4EE4\u724C\u9700\u6388\u4E88\u76EE\u6807\u4ED3\u5E93 Contents \u8BFB\u5199\u6743\u9650\uFF08classic \u4EE4\u724C\u52FE\u9009 repo\uFF09\u3002",
  settingsAutoSync: "\u81EA\u52A8\u540C\u6B65\u95F4\u9694\uFF08\u5206\u949F\uFF09",
  settingsAutoSyncDesc: "0 \u8868\u793A\u5173\u95ED\u81EA\u52A8\u540C\u6B65\u3002",
  settingsSyncOnStart: "\u542F\u52A8\u65F6\u540C\u6B65",
  settingsSyncOnStartDesc: "Obsidian \u6253\u5F00\u540E\u81EA\u52A8\u6267\u884C\u4E00\u6B21\u540C\u6B65\u3002",
  settingsExcludeFolders: "\u6392\u9664\u76EE\u5F55",
  settingsExcludeFoldersDesc: "\u9017\u53F7\u5206\u9694\u7684\u76EE\u5F55\u524D\u7F00\uFF0C\u8FD9\u4E9B\u76EE\u5F55\u4E0D\u53C2\u4E0E\u540C\u6B65\uFF0C\u4F8B\u5982\uFF1Atemplates, attachments/cache",
  settingsSyncDotObsidian: "\u540C\u6B65 .obsidian \u76EE\u5F55",
  settingsSyncDotObsidianDesc: "\u5C06 .obsidian \u76EE\u5F55\u7EB3\u5165\u540C\u6B65\uFF0C\u4F7F\u63D2\u4EF6\u8BBE\u7F6E\u5728\u8BBE\u5907\u95F4\u5171\u4EAB\u3002\u4EC5\u5728\u6240\u6709\u8BBE\u5907\u4F7F\u7528\u76F8\u540C\u5E73\u53F0\u65F6\u542F\u7528\u3002",
  settingsDebugLog: "\u8C03\u8BD5\u65E5\u5FD7",
  settingsDebugLogDesc: "\u628A\u6BCF\u6B21\u540C\u6B65\u7684\u5B8C\u6574\u8BA1\u5212\u548C\u7ED3\u679C\u8BB0\u5F55\u5230 vault \u6839\u76EE\u5F55\u7684 _gitee-sync-log.md\uFF08\u8BE5\u6587\u4EF6\u4E0D\u53C2\u4E0E\u540C\u6B65\uFF09\u3002",
  previewTitle: "\u540C\u6B65\u9884\u6F14\uFF08\u672A\u6267\u884C\uFF09",
  executionTitle: "\u540C\u6B65\u6267\u884C",
  pathFailed: (path, message) => `\u5904\u7406\u201C${path}\u201D\u5931\u8D25\uFF1A${message}`,
  resultFailed: (message) => `\u7ED3\u679C\uFF1A**\u5931\u8D25** \u2014 ${message}
`,
  completedCounts: (pulled, pushed, deletedLocal, deletedRemote) => `\uFF08\u5DF2\u5B8C\u6210\uFF1A\u4E0B\u8F7D ${pulled}\uFF0C\u4E0A\u4F20 ${pushed}\uFF0C\u5220\u9664\u672C\u5730 ${deletedLocal}\uFF0C\u5220\u9664\u8FDC\u7AEF ${deletedRemote}\uFF09
`,
  resultSuccess: (pulled, pushed, deletedLocal, deletedRemote, conflicts) => `\u7ED3\u679C\uFF1A\u6210\u529F \u2014 \u4E0B\u8F7D ${pulled}\uFF0C\u4E0A\u4F20 ${pushed}\uFF0C\u5220\u9664\u672C\u5730 ${deletedLocal}\uFF0C\u5220\u9664\u8FDC\u7AEF ${deletedRemote}\uFF0C\u51B2\u7A81 ${conflicts}
`,
  reasonLocalAdded: "\u672C\u5730\u65B0\u589E",
  reasonLocalModified: "\u672C\u5730\u4FEE\u6539",
  reasonLocalDeleted: "\u672C\u5730\u5DF2\u5220\u9664",
  reasonRemoteAdded: "\u8FDC\u7AEF\u65B0\u589E",
  reasonRemoteModified: "\u8FDC\u7AEF\u4FEE\u6539",
  reasonRemoteDeleted: "\u8FDC\u7AEF\u5DF2\u5220\u9664",
  reasonConflictLocalNewer: (local, remote) => `\u51B2\u7A81\uFF1A\u672C\u5730\u8F83\u65B0\uFF08\u672C\u5730 ${local} \u2265 \u8FDC\u7AEF ${remote}\uFF09`,
  reasonConflictRemoteNewer: (remote, local) => `\u51B2\u7A81\uFF1A\u8FDC\u7AEF\u8F83\u65B0\uFF08\u8FDC\u7AEF ${remote} > \u672C\u5730 ${local}\uFF09`,
  reasonConflictKeepLocal: "\u51B2\u7A81\uFF1A\u8FDC\u7AEF\u5DF2\u5220\u4F46\u672C\u5730\u6709\u4FEE\u6539\uFF0C\u4FDD\u7559\u672C\u5730",
  reasonConflictKeepRemote: "\u51B2\u7A81\uFF1A\u672C\u5730\u5DF2\u5220\u4F46\u8FDC\u7AEF\u6709\u4FEE\u6539\uFF0C\u4FDD\u7559\u8FDC\u7AEF",
  planBackend: (target) => `\u540E\u7AEF\uFF1A${target}`,
  planCounts: (local, remote, base, unchanged, conflicts) => `\u672C\u5730 ${local} | \u8FDC\u7AEF ${remote} | **\u57FA\u7EBF ${base}** | \u4E00\u81F4\u8DF3\u8FC7 ${unchanged} | \u51B2\u7A81 ${conflicts}`,
  planNoActions: "\u8BA1\u5212\uFF1A\u4E24\u7AEF\u5DF2\u4E00\u81F4\uFF0C\u65E0\u9700\u4EFB\u4F55\u52A8\u4F5C",
  planActions: (pulled, pushed, deletedLocal, deletedRemote) => `\u8BA1\u5212\uFF1A\u4E0B\u8F7D ${pulled}\uFF0C\u4E0A\u4F20 ${pushed}\uFF0C\u5220\u9664\u672C\u5730 ${deletedLocal}\uFF0C\u5220\u9664\u8FDC\u7AEF ${deletedRemote}`,
  actionDownload: "\u4E0B\u8F7D",
  actionDeleteLocal: "\u5220\u9664\u672C\u5730",
  actionUpload: "\u4E0A\u4F20",
  actionDeleteRemote: "\u5220\u9664\u8FDC\u7AEF",
  actionSkipEmpty: "\u8DF3\u8FC7",
  reasonEmptyFile: "\u7A7A\u6587\u4EF6\u2014\u2014contents API \u65E0\u6CD5\u521B\u5EFA",
  unknown: "\u672A\u77E5"
};
function messages(language = (0, import_obsidian.getLanguage)()) {
  return language.toLowerCase().startsWith("zh") ? zh : en;
}
function formatDateTime(date = /* @__PURE__ */ new Date()) {
  return date.toLocaleString((0, import_obsidian.getLanguage)().toLowerCase().startsWith("zh") ? "zh-CN" : "en-US");
}
function formatTime(date = /* @__PURE__ */ new Date()) {
  return date.toLocaleTimeString((0, import_obsidian.getLanguage)().toLowerCase().startsWith("zh") ? "zh-CN" : "en-US");
}

// src/settings.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  backend: "gitee",
  giteeOwner: "",
  giteeRepo: "",
  giteeBranch: "master",
  giteeToken: "",
  githubOwner: "",
  githubRepo: "",
  githubBranch: "main",
  githubToken: "",
  autoSyncMinutes: 0,
  syncOnStart: false,
  excludeFolders: "",
  syncDotObsidian: false,
  debugLog: false
};
var SyncSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const l = messages();
    const s = this.plugin.settings;
    const save = () => this.plugin.savePluginData();
    new import_obsidian2.Setting(containerEl).setName(l.settingsBackend).setDesc(l.settingsBackendDesc).addDropdown(
      (d) => d.addOption("gitee", l.optionGitee).addOption("github", l.optionGithub).setValue(s.backend).onChange(async (v) => {
        s.backend = v;
        await save();
        this.display();
      })
    );
    if (s.backend === "gitee") {
      new import_obsidian2.Setting(containerEl).setName(l.settingsGiteeOwner).setDesc(l.settingsOwnerDesc).addText(
        (t) => t.setPlaceholder("your-name").setValue(s.giteeOwner).onChange(async (v) => {
          s.giteeOwner = v.trim();
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName(l.settingsRepo).setDesc(l.settingsRepoDesc).addText(
        (t) => t.setPlaceholder("obsidian-vault").setValue(s.giteeRepo).onChange(async (v) => {
          s.giteeRepo = v.trim();
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName(l.settingsBranch).addText(
        (t) => t.setPlaceholder("master").setValue(s.giteeBranch).onChange(async (v) => {
          s.giteeBranch = v.trim() || "master";
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName(l.settingsGiteeToken).setDesc(l.settingsGiteeTokenDesc).addText((t) => {
        t.inputEl.type = "password";
        t.setValue(s.giteeToken).onChange(async (v) => {
          s.giteeToken = v.trim();
          await save();
        });
      });
    } else {
      new import_obsidian2.Setting(containerEl).setName(l.settingsGithubOwner).setDesc(l.settingsOwnerDesc).addText(
        (t) => t.setPlaceholder("your-name").setValue(s.githubOwner).onChange(async (v) => {
          s.githubOwner = v.trim();
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName(l.settingsRepo).setDesc(l.settingsRepoDesc).addText(
        (t) => t.setPlaceholder("obsidian-vault").setValue(s.githubRepo).onChange(async (v) => {
          s.githubRepo = v.trim();
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName(l.settingsBranch).addText(
        (t) => t.setPlaceholder("main").setValue(s.githubBranch).onChange(async (v) => {
          s.githubBranch = v.trim() || "main";
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName(l.settingsGithubToken).setDesc(l.settingsGithubTokenDesc).addText((t) => {
        t.inputEl.type = "password";
        t.setValue(s.githubToken).onChange(async (v) => {
          s.githubToken = v.trim();
          await save();
        });
      });
    }
    new import_obsidian2.Setting(containerEl).setName(l.settingsAutoSync).setDesc(l.settingsAutoSyncDesc).addText(
      (t) => t.setValue(String(s.autoSyncMinutes)).onChange(async (v) => {
        const n = Number(v);
        s.autoSyncMinutes = Number.isFinite(n) && n > 0 ? n : 0;
        await save();
        this.plugin.setupAutoSync();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(l.settingsSyncOnStart).setDesc(l.settingsSyncOnStartDesc).addToggle(
      (t) => t.setValue(s.syncOnStart).onChange(async (v) => {
        s.syncOnStart = v;
        await save();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(l.settingsExcludeFolders).setDesc(l.settingsExcludeFoldersDesc).addText(
      (t) => t.setValue(s.excludeFolders).onChange(async (v) => {
        s.excludeFolders = v;
        await save();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(l.settingsSyncDotObsidian).setDesc(l.settingsSyncDotObsidianDesc).addToggle(
      (t) => t.setValue(s.syncDotObsidian).onChange(async (v) => {
        s.syncDotObsidian = v;
        await save();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(l.settingsDebugLog).setDesc(l.settingsDebugLogDesc).addToggle(
      (t) => t.setValue(s.debugLog).onChange(async (v) => {
        s.debugLog = v;
        await save();
      })
    );
  }
};

// src/sync.ts
var import_obsidian4 = require("obsidian");

// src/githost.ts
var import_obsidian3 = require("obsidian");
async function gitBlobSha1(data) {
  const header = new TextEncoder().encode(`blob ${data.byteLength}\0`);
  const buf = new Uint8Array(header.byteLength + data.byteLength);
  buf.set(header, 0);
  buf.set(new Uint8Array(data), header.byteLength);
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}
var GitHostBackend = class {
  constructor(cfg) {
    this.cfg = cfg;
  }
  id = "git-blob-sha1";
  get repoBase() {
    const owner = encodeURIComponent(this.cfg.owner);
    const repo = encodeURIComponent(this.cfg.repo);
    return this.cfg.host === "github" ? `https://api.github.com/repos/${owner}/${repo}` : `https://gitee.com/api/v5/repos/${owner}/${repo}`;
  }
  get isGithub() {
    return this.cfg.host === "github";
  }
  authHeaders() {
    return this.isGithub ? {
      Authorization: `Bearer ${this.cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    } : {};
  }
  withAuth(url) {
    if (this.isGithub) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}access_token=${encodeURIComponent(this.cfg.token)}`;
  }
  async request(method, url, body) {
    const payload = body && !this.isGithub ? { access_token: this.cfg.token, ...body } : body;
    const resp = await (0, import_obsidian3.requestUrl)({
      url: this.withAuth(url),
      method,
      throw: false,
      headers: this.authHeaders(),
      contentType: payload ? "application/json" : void 0,
      body: payload ? JSON.stringify(payload) : void 0
    });
    if (resp.status >= 400) {
      const l = messages();
      let detail = "";
      try {
        const body2 = resp.json;
        detail = [body2.message, ...body2.messages ?? []].filter(Boolean).join("; ");
      } catch {
      }
      if (!detail) detail = resp.text.slice(0, 200);
      throw new GitHostError(resp.status, l.apiFailed(this.cfg.host, method, resp.status, detail));
    }
    return resp;
  }
  async manifest() {
    let resp;
    try {
      resp = await this.request(
        "GET",
        `${this.repoBase}/git/trees/${encodeURIComponent(this.cfg.branch)}?recursive=1`
      );
    } catch (e) {
      if (e instanceof GitHostError && (e.status === 404 || e.status === 409)) return [];
      throw e;
    }
    const body = resp.json;
    if (body.truncated) {
      throw new Error(messages().remoteTreeTruncated);
    }
    return body.tree.filter((t) => t.type === "blob").map((t) => ({ path: t.path, hash: t.sha, mtime: 0, size: t.size ?? 0 }));
  }
  async download(path) {
    const resp = await this.request(
      "GET",
      `${this.repoBase}/contents/${encodePath(path)}?ref=${encodeURIComponent(this.cfg.branch)}`
    );
    const file = resp.json;
    let base64 = (file.content ?? "").replace(/\s/g, "");
    if (!base64 && file.sha) {
      const blob = await this.request("GET", `${this.repoBase}/git/blobs/${file.sha}`);
      base64 = (blob.json.content ?? "").replace(/\s/g, "");
    }
    return { data: (0, import_obsidian3.base64ToArrayBuffer)(base64), hash: file.sha, mtime: 0 };
  }
  async upload(path, data, opts) {
    const url = `${this.repoBase}/contents/${encodePath(path)}`;
    const body = {
      content: (0, import_obsidian3.arrayBufferToBase64)(data),
      message: opts.remoteHash ? messages().commitUpdate(path) : messages().commitAdd(path),
      branch: this.cfg.branch
    };
    if (opts.remoteHash) body.sha = opts.remoteHash;
    const method = this.isGithub || opts.remoteHash ? "PUT" : "POST";
    await this.request(method, url, body);
  }
  async remove(path, remoteHash) {
    if (!remoteHash) throw new Error(messages().deleteNeedsSha(path));
    const url = `${this.repoBase}/contents/${encodePath(path)}`;
    const message = messages().commitDelete(path);
    if (this.isGithub) {
      await this.request("DELETE", url, {
        message,
        sha: remoteHash,
        branch: this.cfg.branch
      });
    } else {
      await this.request(
        "DELETE",
        `${url}?sha=${encodeURIComponent(remoteHash)}&message=${encodeURIComponent(message)}&branch=${encodeURIComponent(this.cfg.branch)}`
      );
    }
  }
  hashData(data) {
    return gitBlobSha1(data);
  }
  /** Last commit time touching the path — only queried on real conflicts. */
  async statMtime(path) {
    const resp = await this.request(
      "GET",
      `${this.repoBase}/commits?sha=${encodeURIComponent(this.cfg.branch)}&path=${encodePath(path)}&page=1&per_page=1`
    );
    const commits = resp.json;
    const date = commits[0]?.commit?.committer?.date;
    return date ? Date.parse(date) : 0;
  }
};
var GitHostError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};

// src/backend.ts
function createBackend(s) {
  const injected = s.__testBackend;
  if (injected) return injected;
  if (s.backend === "github") {
    if (!s.githubOwner || !s.githubRepo || !s.githubToken) {
      throw new Error(messages().missingGithubSettings);
    }
    return new GitHostBackend({
      host: "github",
      owner: s.githubOwner,
      repo: s.githubRepo,
      branch: s.githubBranch || "main",
      token: s.githubToken
    });
  }
  if (!s.giteeOwner || !s.giteeRepo || !s.giteeToken) {
    throw new Error(messages().missingGiteeSettings);
  }
  return new GitHostBackend({
    host: "gitee",
    owner: s.giteeOwner,
    repo: s.giteeRepo,
    branch: s.giteeBranch || "master",
    token: s.giteeToken
  });
}

// src/sync.ts
var LOG_FILE = "_gitee-sync-log.md";
var SyncEngine = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  get vault() {
    return this.plugin.app.vault;
  }
  excludedPrefixes() {
    return this.plugin.settings.excludeFolders.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter((s) => s.length > 0).map((s) => s + "/");
  }
  isExcluded(path) {
    if (path === LOG_FILE) return true;
    const segments = path.split("/");
    for (const seg of segments) {
      if (seg === ".obsidian") {
        if (!this.plugin.settings.syncDotObsidian) return true;
        continue;
      }
      if (seg.startsWith(".")) return true;
    }
    if (path === ".obsidian/workspace.json" || path === ".obsidian/workspace-mobile.json") {
      return true;
    }
    return this.excludedPrefixes().some((p) => path.startsWith(p));
  }
  /** Dry run: build and describe the plan without transferring anything. */
  async preview() {
    const backend = createBackend(this.plugin.settings);
    const plan = await this.buildPlan(backend);
    return { plan, report: this.formatPlan(plan, messages().previewTitle) };
  }
  async run() {
    const l = messages();
    const backend = createBackend(this.plugin.settings);
    const plan = await this.buildPlan(backend);
    if (this.plugin.settings.debugLog) {
      await this.plugin.appendLog(this.formatPlan(plan, l.executionTitle));
    }
    const summary = {
      pushed: 0,
      pulled: 0,
      deletedLocal: 0,
      deletedRemote: 0,
      conflicts: plan.conflicts,
      skippedEmpty: plan.skippedEmpty.length
    };
    const nextState = { ...plan.nextState };
    const step = async (path, fn) => {
      try {
        await fn();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(l.pathFailed(path, msg));
      }
    };
    try {
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
            algo: backend.id
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
      for (const { path, loc, rem } of plan.pushes) {
        await step(path, async () => {
          const data = await this.readEntryData(path, loc);
          await backend.upload(path, data, {
            hash: loc.hash,
            mtime: loc.mtime,
            remoteHash: rem?.hash
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
      this.plugin.syncState = nextState;
      await this.plugin.savePluginData();
      if (this.plugin.settings.debugLog) {
        await this.plugin.appendLog(
          l.resultFailed(e instanceof Error ? e.message : String(e)) + l.completedCounts(
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
  async buildPlan(backend) {
    const l = messages();
    const [remoteList, { entries: local, empty: emptyLocal }] = await Promise.all([
      backend.manifest(),
      this.buildLocalManifest(backend)
    ]);
    const remote = new Map(
      remoteList.filter((e) => !this.isExcluded(e.path)).map((e) => [e.path, e])
    );
    for (const path of emptyLocal) remote.delete(path);
    const base = this.plugin.syncState;
    const basePaths = Object.keys(base).filter((p) => !this.isExcluded(p));
    const plan = {
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
      nextState: {}
    };
    const allPaths = /* @__PURE__ */ new Set([...local.keys(), ...remote.keys(), ...basePaths]);
    for (const path of allPaths) {
      const loc = local.get(path);
      const rem = remote.get(path);
      const baseHash = base[path];
      if (loc && rem && loc.hash === rem.hash) {
        plan.nextState[path] = loc.hash;
        plan.unchanged++;
        continue;
      }
      if (!loc && !rem) continue;
      const localChanged = loc?.hash !== baseHash;
      const remoteChanged = rem?.hash !== baseHash;
      const isNew = baseHash === void 0;
      if (localChanged && !remoteChanged) {
        if (loc)
          plan.pushes.push({
            path,
            loc,
            rem,
            reason: isNew ? l.reasonLocalAdded : l.reasonLocalModified
          });
        else if (rem) plan.remoteDeletes.push({ path, rem, reason: l.reasonLocalDeleted });
      } else if (remoteChanged && !localChanged) {
        if (rem)
          plan.pulls.push({
            path,
            rem,
            reason: isNew ? l.reasonRemoteAdded : l.reasonRemoteModified
          });
        else if (loc) plan.localDeletes.push({ path, loc, reason: l.reasonRemoteDeleted });
      } else {
        plan.conflicts++;
        if (loc && rem) {
          const remoteMtime = await this.remoteMtime(backend, path, rem);
          if (loc.mtime >= remoteMtime) {
            plan.pushes.push({
              path,
              loc,
              rem,
              reason: l.reasonConflictLocalNewer(ts(loc.mtime), ts(remoteMtime))
            });
          } else {
            plan.pulls.push({
              path,
              rem,
              reason: l.reasonConflictRemoteNewer(ts(remoteMtime), ts(loc.mtime))
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
  formatPlan(plan, title) {
    const l = messages();
    const s = this.plugin.settings;
    const target = s.backend === "github" ? `github ${s.githubOwner}/${s.githubRepo}@${s.githubBranch}` : `gitee ${s.giteeOwner}/${s.giteeRepo}@${s.giteeBranch}`;
    const lines = [];
    lines.push(`
## ${title} ${formatDateTime()}`);
    lines.push(
      l.planBackend(target) + "\n" + l.planCounts(
        plan.localCount,
        plan.remoteCount,
        plan.baseCount,
        plan.unchanged,
        plan.conflicts
      )
    );
    const total = plan.pulls.length + plan.pushes.length + plan.localDeletes.length + plan.remoteDeletes.length;
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
        lines.push(`- \u2B07\uFE0F ${l.actionDownload} \`${a.path}\` \u2014 ${a.reason}`);
      for (const a of plan.localDeletes)
        lines.push(`- \u{1F5D1}\uFE0F ${l.actionDeleteLocal} \`${a.path}\` \u2014 ${a.reason}`);
      for (const a of plan.pushes)
        lines.push(`- \u2B06\uFE0F ${l.actionUpload} \`${a.path}\` \u2014 ${a.reason}`);
      for (const a of plan.remoteDeletes)
        lines.push(`- \u274C ${l.actionDeleteRemote} \`${a.path}\` \u2014 ${a.reason}`);
    }
    for (const p of plan.skippedEmpty)
      lines.push(`- \u23ED\uFE0F ${l.actionSkipEmpty} \`${p}\` \u2014 ${l.reasonEmptyFile}`);
    return lines.join("\n") + "\n";
  }
  async remoteMtime(backend, path, rem) {
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
  async buildLocalManifest(backend) {
    const entries = /* @__PURE__ */ new Map();
    const empty = /* @__PURE__ */ new Set();
    const cache = this.plugin.hashCache;
    const seen = /* @__PURE__ */ new Set();
    for (const file of this.vault.getFiles()) {
      if (this.isExcluded(file.path)) continue;
      seen.add(file.path);
      if (file.stat.size === 0) {
        empty.add(file.path);
        continue;
      }
      const cached = cache[file.path];
      let hash;
      if (cached && cached.algo === backend.id && cached.mtime === file.stat.mtime && cached.size === file.stat.size) {
        hash = cached.hash;
      } else {
        hash = await backend.hashData(await this.vault.readBinary(file));
        cache[file.path] = {
          mtime: file.stat.mtime,
          size: file.stat.size,
          hash,
          algo: backend.id
        };
      }
      entries.set(file.path, { file, hash, mtime: file.stat.mtime });
    }
    if (this.plugin.settings.syncDotObsidian) {
      await this.collectHiddenEntries(".obsidian", backend, entries, empty, seen);
    }
    for (const path of Object.keys(cache)) {
      if (!seen.has(path)) delete cache[path];
    }
    return { entries, empty };
  }
  /** Recursively adds .obsidian files (invisible to vault.getFiles()) to the local manifest. */
  async collectHiddenEntries(dir, backend, entries, empty, seen) {
    const adapter = this.vault.adapter;
    let listing;
    try {
      listing = await adapter.list(dir);
    } catch {
      return;
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
      let hash;
      if (cached && cached.algo === backend.id && cached.mtime === mtime && cached.size === stat.size) {
        hash = cached.hash;
      } else {
        hash = await backend.hashData(await adapter.readBinary(path));
        this.plugin.hashCache[path] = { mtime, size: stat.size, hash, algo: backend.id };
      }
      entries.set(path, { file: null, hash, mtime });
    }
    for (const sub of listing.folders) {
      await this.collectHiddenEntries(sub, backend, entries, empty, seen);
    }
  }
  /** Reads any file, including hidden ones not present in the vault index. */
  async readEntryData(path, loc) {
    if (loc.file instanceof import_obsidian4.TFile) return this.vault.readBinary(loc.file);
    return this.vault.adapter.readBinary(path);
  }
  /** Writes the file and returns its resulting local mtime (for the hash cache). */
  async writeLocal(path, data, mtime) {
    const dir = path.split("/").slice(0, -1).join("/");
    if (dir) await this.ensureFolder(dir);
    const hidden = path.split("/").some((seg) => seg.startsWith("."));
    if (hidden) {
      await this.vault.adapter.writeBinary(path, data);
      const stat = await this.vault.adapter.stat(path);
      return stat?.mtime ?? mtime;
    }
    const existing = this.vault.getAbstractFileByPath(path);
    const options = mtime > 0 ? { mtime } : void 0;
    if (existing instanceof import_obsidian4.TFile) {
      await this.vault.modifyBinary(existing, data, options);
    } else {
      await this.vault.createBinary(path, data, options);
    }
    const written = this.vault.getAbstractFileByPath(path);
    return written instanceof import_obsidian4.TFile ? written.stat.mtime : mtime;
  }
  async ensureFolder(dir) {
    const parts = dir.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (current.startsWith(".")) {
        try {
          await this.vault.adapter.mkdir(current);
        } catch {
        }
        continue;
      }
      if (!this.vault.getAbstractFileByPath(current)) {
        try {
          await this.vault.createFolder(current);
        } catch {
        }
      }
    }
  }
  /** Deletes a local file: trash indexed files, adapter-remove hidden ones. */
  async deleteLocalFile(path, loc) {
    if (loc.file instanceof import_obsidian4.TFile) {
      await this.vault.trash(loc.file, true);
    } else {
      await this.vault.adapter.remove(path);
    }
  }
};
function ts(ms) {
  return ms > 0 ? formatDateTime(new Date(ms)) : messages().unknown;
}

// src/main.ts
var LOCAL_SYNC_STATE_KEY = "gitee-sync-sync-state-v1";
var CloudSyncPlugin = class extends import_obsidian5.Plugin {
  settings = { ...DEFAULT_SETTINGS };
  syncState = {};
  hashCache = {};
  statusBar;
  syncing = false;
  autoSyncTimer = null;
  async onload() {
    await this.loadPluginData();
    const l = messages();
    this.addSettingTab(new SyncSettingTab(this.app, this));
    this.statusBar = this.addStatusBarItem();
    this.statusBar.addClass("mod-clickable");
    this.statusBar.setAttribute("aria-label", l.clickToSync);
    this.statusBar.addEventListener("click", () => void this.runSync());
    this.setStatus(l.statusIdle);
    this.addRibbonIcon("refresh-cw", l.ribbonSync, () => void this.runSync());
    this.addCommand({
      id: "sync-now",
      name: l.commandSyncNow,
      callback: () => void this.runSync()
    });
    this.addCommand({
      id: "sync-preview",
      name: l.commandPreview,
      callback: () => void this.runPreview()
    });
    this.setupAutoSync();
    if (this.settings.syncOnStart) {
      this.app.workspace.onLayoutReady(() => void this.runSync(true));
    }
  }
  onunload() {
    this.clearAutoSync();
  }
  setupAutoSync() {
    this.clearAutoSync();
    const minutes = this.settings.autoSyncMinutes;
    if (minutes > 0) {
      this.autoSyncTimer = window.setInterval(
        () => void this.runSync(true),
        minutes * 60 * 1e3
      );
      this.registerInterval(this.autoSyncTimer);
    }
  }
  clearAutoSync() {
    if (this.autoSyncTimer !== null) {
      window.clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }
  async runSync(silent = false) {
    const l = messages();
    if (this.syncing) {
      if (!silent) new import_obsidian5.Notice(l.syncInProgress);
      return;
    }
    this.syncing = true;
    this.setStatus(l.statusRunning);
    try {
      const summary = await new SyncEngine(this).run();
      this.setStatus(l.statusComplete(formatTime()));
      const changed = summary.pushed + summary.pulled + summary.deletedLocal + summary.deletedRemote;
      if (!silent || changed > 0) {
        new import_obsidian5.Notice(this.formatSummary(summary));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.setStatus(l.statusFailed);
      new import_obsidian5.Notice(l.syncFailed(msg), 8e3);
      console.error("[gitee-sync]", e);
    } finally {
      this.syncing = false;
    }
  }
  async runPreview() {
    const l = messages();
    if (this.syncing) {
      new import_obsidian5.Notice(l.previewWhileSyncing);
      return;
    }
    try {
      const { plan, report } = await new SyncEngine(this).preview();
      await this.appendLog(report);
      new import_obsidian5.Notice(
        l.previewComplete(
          plan.pulls.length,
          plan.pushes.length,
          plan.localDeletes.length,
          plan.remoteDeletes.length,
          LOG_FILE
        )
      );
      await this.app.workspace.openLinkText(LOG_FILE, "", true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new import_obsidian5.Notice(l.previewFailed(msg), 8e3);
      await this.appendLog(l.previewFailedLog(formatDateTime(), msg));
    }
  }
  /** Appends to the diagnostic note (which is itself excluded from sync). */
  async appendLog(text) {
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(LOG_FILE)) {
      await adapter.write(LOG_FILE, messages().diagnosticLogTitle);
    }
    await adapter.append(LOG_FILE, text);
  }
  formatSummary(s) {
    const l = messages();
    const parts = [];
    if (s.pushed) parts.push(l.summaryUpload(s.pushed));
    if (s.pulled) parts.push(l.summaryDownload(s.pulled));
    if (s.deletedRemote) parts.push(l.summaryDeleteRemote(s.deletedRemote));
    if (s.deletedLocal) parts.push(l.summaryDeleteLocal(s.deletedLocal));
    if (s.conflicts) parts.push(l.summaryConflict(s.conflicts));
    if (s.skippedEmpty) parts.push(l.summarySkippedEmpty(s.skippedEmpty));
    return parts.length ? l.summaryComplete(parts.join(", ")) : l.summaryNoChanges;
  }
  setStatus(text) {
    this.statusBar.setText(text);
  }
  async loadPluginData() {
    const data = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...data?.settings };
    if (this.settings.backend !== "gitee" && this.settings.backend !== "github") {
      this.settings.backend = "gitee";
    }
    this.syncState = this.app.loadLocalStorage(LOCAL_SYNC_STATE_KEY) ?? {};
    this.hashCache = data?.hashCache ?? {};
  }
  async savePluginData() {
    this.app.saveLocalStorage(LOCAL_SYNC_STATE_KEY, this.syncState);
    const data = { settings: this.settings, hashCache: this.hashCache };
    await this.saveData(data);
  }
};
