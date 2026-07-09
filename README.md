# cc-obsidian-syn

Obsidian vault 同步插件,把笔记以普通文件形式存进 **Gitee 或 GitHub 仓库**(私有仓库免费,自带完整历史版本),插件直连平台 OpenAPI,**无需任何服务端、无需安装 git**,桌面端与移动端(iOS/Android)均可用。

同步引擎:基于内容哈希(git blob SHA-1,与平台服务端天然一致)的**三方对比增量同步**(本地清单 / 远端清单 / 上次同步基线),支持双向同步、删除同步;两端同时改动时按修改时间"新者胜"。每次文件增删改对应仓库一次 commit,误删/误改可在仓库网页找回任意旧版本。

## 安装

### 1. 准备仓库和令牌

**Gitee**:新建私有仓库(空仓库即可,首次同步自动初始化);头像 → 设置 → 安全设置 → **私人令牌**,勾选 **projects** 权限。

**GitHub**:新建私有仓库;Settings → Developer settings → **Personal access tokens**,fine-grained 令牌授予目标仓库 **Contents 读写**权限(classic 令牌勾选 repo)。

### 2. 构建并安装插件

```bash
cd plugin
npm install
npm run build        # 产出 main.js

mkdir -p "<你的vault路径>/.obsidian/plugins/gitee-sync"
cp main.js manifest.json "<你的vault路径>/.obsidian/plugins/gitee-sync/"
```

Obsidian → 设置 → 第三方插件(关闭安全模式)→ 启用 **Gitee Sync**。

iOS 安装:vault 建在 iCloud,在 Mac 上把上述两个文件拷进
`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/<vault>/.obsidian/plugins/gitee-sync/`,等 iCloud 同步后在手机上启用。

### 3. 配置

| 设置项 | 说明 |
|---|---|
| 存储后端 | Gitee 仓库 / GitHub 仓库 |
| 用户名 | 仓库 URL 中的 owner |
| 仓库名 | 上面创建的私有仓库 |
| 分支 | Gitee 默认 master,GitHub 默认 main |
| 令牌 | 上面生成的 token |
| 自动同步间隔 | 分钟数,0 = 关闭 |
| 排除目录 | 逗号分隔目录前缀,不参与同步 |

触发方式:ribbon 刷新图标 / 命令面板"立即同步" / 定时 / 启动时同步。

## 多设备

每台设备装同一插件、填同一仓库配置即可。新设备首次同步 = 全量下载,之后增量。移动端切后台后定时器会被系统挂起,建议开"启动时同步"。

## 同步语义

- 只在本地改 → 上传;只在远端改 → 下载;
- 删除双向传播(本地删除进回收站,可找回;远端删除有 git 历史);
- 两端同时改同一文件 → 修改时间较新的一方胜出(修改优先于删除;远端修改时间取该文件最后一次 commit 时间,仅在真正冲突时查询);
- 隐藏路径(`.obsidian`、`.git` 等)在两侧都被忽略,不参与同步;
- 远端文件树被截断(超大仓库)时中止同步,防止误判为批量删除。

## 限制

- 首次同步大 vault 会逐文件产生 commit,受平台 API 限流影响会比较慢,跑完一次后都是增量;
- 免费私有仓库容量:Gitee 建议 500MB 内,GitHub 建议 1GB 内;单文件建议 < 50MB,超大附件放"排除目录";
- 令牌等于仓库全部权限,存放在 vault 的 `.obsidian/plugins/gitee-sync/data.json`(该目录不参与同步),用其他工具备份 vault 时注意排除;
- 若 vault 同时也是指向同一仓库的 git clone,插件接管后不要再手动 `git push`,本地 `.git` 会落后于远端(内容无害,留作备份)。
