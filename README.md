# cc-obsidian-syn

Obsidian vault 同步插件,支持两种**免费**存储后端(设置里一键切换):

- **Gitee 私有仓库**(推荐,完全免费):插件直连 Gitee OpenAPI,每个文件的增删改对应仓库一次 commit,天然带全部历史版本。
- **Cloudflare Workers + R2**:自建 Worker 服务端,见 `worker/` 目录(R2 免费额度 10GB,但开通需绑支付方式)。

同步引擎与后端无关:基于内容哈希的**三方对比增量同步**(本地清单 / 远端清单 / 上次同步基线),支持双向同步、删除同步;两端同时改动时按修改时间"新者胜"。

## 目录

- `plugin/` — Obsidian 插件(客户端,含全部同步逻辑)
- `worker/` — Cloudflare Worker 服务端(仅 Worker 后端需要;用 Gitee 后端可完全忽略)

---

## 方式一:Gitee 后端(推荐)

### 1. 准备 Gitee 仓库和令牌

1. 在 https://gitee.com 新建一个**私有仓库**(如 `obsidian-vault`),不需要初始化 README(空仓库即可,首次同步会自动初始化);
2. 生成私人令牌:头像 → 设置 → 安全设置 → **私人令牌** → 生成新令牌,勾选 **projects** 权限,复制保存(只显示一次)。

### 2. 构建并安装插件

```bash
cd plugin
npm install
npm run build        # 产出 main.js

mkdir -p "<你的vault路径>/.obsidian/plugins/cc-obsidian-sync"
cp main.js manifest.json "<你的vault路径>/.obsidian/plugins/cc-obsidian-sync/"
```

Obsidian → 设置 → 第三方插件(关闭安全模式)→ 启用 **CC Cloudflare Sync**。

### 3. 配置

插件设置中选择存储后端为 **Gitee 仓库**,填:

| 设置项 | 说明 |
|---|---|
| Gitee 用户名 | 仓库 URL 中的 owner |
| 仓库名 | 上面创建的私有仓库名 |
| 分支 | 默认 master |
| 私人令牌 | 上面生成的 token |
| 自动同步间隔 | 分钟数,0 = 关闭 |
| 排除目录 | 逗号分隔目录前缀,不参与同步 |

触发方式:ribbon 刷新图标 / 命令面板"立即同步" / 定时 / 启动时同步。

### Gitee 后端的特性与限制

- 文件内容签名用 **git blob SHA-1**,与 Gitee 服务端一致,远端清单一次 `git trees` 请求拿全量,无需逐文件询问。
- 每次上传/删除 = 一次 commit,仓库自带完整历史,误删可从 Gitee 网页找回任意旧版本。
- 首次同步大 vault 会产生大量 commit(每文件一个),速度受 Gitee API 限流影响,耐心等一次即可,之后都是增量。
- 免费私有仓库容量建议 500MB 以内;单文件建议 < 50MB,超大附件放进"排除目录"。
- 令牌泄露等于笔记泄露;令牌存放在 vault 的 `.obsidian/plugins/cc-obsidian-sync/data.json` 中,该目录不参与同步,但用 git 等工具备份 vault 时注意排除。

## 方式二:Cloudflare Worker + R2 后端

```bash
cd worker
npm install
npx wrangler login
npx wrangler r2 bucket create obsidian-vault
npx wrangler secret put AUTH_TOKEN     # 填自己生成的随机串,如 openssl rand -hex 32
npm run deploy
```

插件设置中后端选 **Cloudflare Worker + R2**,填部署得到的 URL 和 token。API 说明见 `worker/src/index.ts` 头部注释。

## 多设备

每台设备装同一插件、填同一后端配置即可。新设备首次同步 = 全量下载,之后增量。

同步语义(两种后端一致):

- 只在本地改 → 上传;只在远端改 → 下载;
- 删除双向传播(本地删除走系统回收站,可找回);
- 两端同时改同一文件 → 修改时间较新的一方胜出(修改优先于删除;Gitee 端的远端修改时间取该文件最后一次 commit 时间,仅在真正冲突时才查询);
- 切换存储后端后,首次同步会因哈希算法不同做一次全量对账(按新者胜规则),数据不会丢,但建议切换前先在原后端同步一次。
