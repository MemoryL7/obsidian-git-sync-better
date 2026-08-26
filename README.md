# Gitee Sync Better

[English](#english) | [中文](#中文)

基于 [MemoryL7/obsidian-git-sync](https://github.com/MemoryL7/obsidian-git-sync) 的增强版，新增 `.obsidian` 目录同步支持。

## 与原版的区别

| 特性 | 原版 Gitee Sync | Gitee Sync Better |
|---|---|---|
| .obsidian 目录同步 | ❌ 硬编码排除 | ✅ 可通过设置开关 |
| 其他隐藏目录 (.git 等) | 排除 | 排除（行为不变） |
| 其余功能 | — | 完全一致 |

新增 **「同步 .obsidian 目录」** 开关，开启后 `.obsidian` 文件夹（包括插件配置、快捷键设置等）会参与同步，方便在 PC 和手机之间共享 Obsidian 配置。其余隐藏目录（如 `.git`）仍然被排除。

> ⚠️ 仅在所有设备使用相同平台（均为桌面端或均为移动端）时开启此选项。不同平台的 Obsidian 配置可能不兼容。

---

## English

Gitee Sync Better stores an Obsidian vault as ordinary files in a private **Gitee or GitHub repository**. It connects directly to the platform API, requires no server or local Git installation, and works on desktop, iOS, and Android.

The sync engine uses Git blob hashes and a three-way comparison between the local vault, remote repository, and the last successful device-local baseline. It supports incremental two-way sync, deletion propagation, conflict resolution, dry-run previews, and diagnostic logs. When both sides modify the same file, the newer modification wins.

The plugin interface automatically follows Obsidian's language and currently supports English and Chinese.

### What's different from upstream

This fork adds a **Sync .obsidian folder** toggle in settings. When enabled, the `.obsidian` directory (plugin configs, hotkeys, etc.) is included in sync, so your Obsidian setup is shared across devices. Other hidden directories like `.git` remain excluded.

> ⚠️ Only enable this when all devices run on the same platform. Desktop and mobile Obsidian configs may not be compatible.

### Installation

**From Obsidian Community Plugins (recommended):**
1. Open **Settings → Community plugins → Browse**
2. Search for **Gitee Sync Better**
3. Install and enable

**Manual build:**
```bash
npm install
npm run build

mkdir -p "<vault>/.obsidian/plugins/gitee-sync-better"
cp main.js manifest.json "<vault>/.obsidian/plugins/gitee-sync-better/"
```

### Repository and token

**Gitee:** Create a private repository. In **Settings → Security Settings → Personal access tokens**, create a token with the **projects** permission.

**GitHub:** Create a private repository. A fine-grained personal access token needs **Contents: Read and write** access to the repository; a classic token needs the `repo` scope.

### Configuration

| Setting | Description |
|---|---|
| Storage backend | Gitee repository or GitHub repository |
| Owner | User or organization from the repository URL |
| Repository | Private repository used for the vault |
| Branch | Gitee defaults to `master`; GitHub defaults to `main` |
| Token | Personal access token for the selected platform |
| Automatic sync interval | Minutes between syncs; `0` disables automatic sync |
| Sync on startup | Runs one sync when Obsidian opens |
| Excluded folders | Comma-separated folder prefixes that are not synced |
| **Sync .obsidian folder** | **When enabled, .obsidian config files are synced across devices** |
| Diagnostic log | Writes the sync plan and result to `_gitee-sync-log.md` |

### Multiple devices

Install and configure the plugin on every device with the same repository. Each device keeps its own sync baseline. A new device downloads the remote vault on its first sync and uses incremental sync afterwards.

To share plugin settings across devices, enable **Sync .obsidian folder** on all devices.

Mobile operating systems suspend timers in the background, so enabling **Sync on startup** is recommended.

### Sync behavior

- Local-only changes are uploaded; remote-only changes are downloaded.
- Deletions propagate in both directions. Local deletions use Obsidian's trash, and remote history remains recoverable through Git.
- If both sides modify the same file, the newer modification wins. A modification wins over a deletion.
- Hidden paths such as `.git` are ignored on both sides. `.obsidian` is synced only when the setting is enabled.
- Empty files (0 bytes) are skipped: the Gitee/GitHub contents APIs cannot create them.
- Sync stops if the remote platform returns a truncated file tree, preventing accidental mass deletion.
- Every uploaded or deleted file creates a repository commit, so previous versions remain recoverable.

---

## 中文

基于 [MemoryL7/obsidian-git-sync](https://github.com/MemoryL7/obsidian-git-sync) 的增强版，新增 `.obsidian` 目录同步支持。

### 与原版的区别

原版硬编码排除了所有以 `.` 开头的目录（包括 `.obsidian`、`.git` 等），导致插件配置无法在设备间同步。

本版本在设置中新增了 **「同步 .obsidian 目录」** 开关：
- **关闭（默认）**：行为与原版完全一致，`.obsidian` 和其他隐藏目录均被排除
- **开启**：`.obsidian` 目录参与同步，插件配置、快捷键等可在多设备间共享。`.git` 等其他隐藏目录仍然排除

> ⚠️ 仅在所有设备使用相同平台（均为桌面端或均为移动端）时开启此选项。不同平台的 Obsidian 配置可能不兼容。

### 安装

**从 Obsidian 社区插件安装（推荐）：**
1. 打开 **设置 → 第三方插件 → 浏览**
2. 搜索 **Gitee Sync Better**
3. 安装并启用

**手动构建：**
```bash
npm install
npm run build

mkdir -p "<vault>/.obsidian/plugins/gitee-sync-better"
cp main.js manifest.json "<vault>/.obsidian/plugins/gitee-sync-better/"
```

### 仓库和令牌

**Gitee：** 创建私有仓库，然后在 **设置 → 安全设置 → 私人令牌** 中创建令牌，并勾选 **projects** 权限。

**GitHub：** 创建私有仓库。Fine-grained token 需要目标仓库的 **Contents: Read and write** 权限；classic token 需要勾选 `repo`。

### 配置

| 设置项 | 说明 |
|---|---|
| 存储后端 | Gitee 仓库或 GitHub 仓库 |
| 用户名 | 仓库 URL 中的用户或组织名 |
| 仓库名 | 用于保存 vault 的私有仓库 |
| 分支 | Gitee 默认 `master`，GitHub 默认 `main` |
| 令牌 | 对应平台的私人访问令牌 |
| 自动同步间隔 | 同步间隔分钟数，`0` 表示关闭 |
| 启动时同步 | Obsidian 打开后执行一次同步 |
| 排除目录 | 逗号分隔、不参与同步的目录前缀 |
| **同步 .obsidian 目录** | **开启后 `.obsidian` 配置文件会在设备间同步** |
| 调试日志 | 将同步计划和结果写入 `_gitee-sync-log.md` |

### 多设备

在每台设备安装插件并配置同一仓库。每台设备分别保存同步基线。新设备首次同步会下载远端 vault，之后只进行增量同步。

如需在设备间共享插件设置，请在所有设备上开启 **同步 .obsidian 目录**。

移动端进入后台后，系统可能暂停定时器，建议开启 **启动时同步**。

### 同步规则

- 只在本地修改的文件会上传，只在远端修改的文件会下载。
- 删除会双向传播。本地删除进入 Obsidian 回收站，远端文件仍可通过 Git 历史恢复。
- 两端同时修改同一文件时，保留修改时间较新的版本；修改优先于删除。
- `.git` 等隐藏路径在两端都会被忽略。`.obsidian` 仅在设置开启时参与同步。
- 空文件（0 字节）会被跳过：Gitee/GitHub 的 contents API 无法创建空文件。
- 远端平台返回被截断的文件树时会中止同步，避免误判为批量删除。
- 每次文件上传或删除都会生成仓库 commit，旧版本可随时恢复。