# cc-obsidian-syn

基于 **Cloudflare Workers + R2** 的 Obsidian vault 同步方案:

- `worker/` — 服务端:Cloudflare Worker,把 vault 文件存进 R2 bucket,提供带 Token 鉴权的 REST API。
- `plugin/` — 客户端:Obsidian 插件,做基于内容哈希的**三方对比增量同步**(本地清单 / 远端清单 / 上次同步基线),支持双向同步、删除同步;两端同时改动时按修改时间"新者胜"。

R2 免费额度(10 GB 存储、每月 100 万次写 + 1000 万次读)对个人笔记同步绰绰有余;Worker 免费版每天 10 万次请求也远超需求。

---

## 一、部署 Worker(约 5 分钟)

前置:安装 Node.js ≥ 18,注册 Cloudflare 账号并在 Dashboard 里开通 R2(免费,需绑一次支付方式但不会扣费)。

```bash
cd worker
npm install

# 1. 登录 Cloudflare(会打开浏览器授权)
npx wrangler login

# 2. 创建 R2 bucket(名字需与 wrangler.toml 中 bucket_name 一致)
npx wrangler r2 bucket create obsidian-vault

# 3. 设置访问 Token(自己生成一个足够长的随机串,插件端要填同一个值)
#    例如:openssl rand -hex 32
npx wrangler secret put AUTH_TOKEN

# 4. 部署
npm run deploy
```

部署成功后会输出 Worker 地址,形如 `https://cc-obsidian-sync.<你的子域>.workers.dev`,记下来。

验证一下(把 URL 和 token 换成你自己的):

```bash
curl https://cc-obsidian-sync.xxx.workers.dev/manifest \
  -H "Authorization: Bearer <你的token>"
# 应返回 {"files":[]}
```

本地开发调试:`echo 'AUTH_TOKEN=test-token-123' > .dev.vars && npm run dev`(本地会用模拟 R2,不动线上数据)。

## 二、构建并安装插件

```bash
cd plugin
npm install
npm run build        # 产出 main.js
```

把插件装进 vault:

```bash
mkdir -p "<你的vault路径>/.obsidian/plugins/cc-obsidian-sync"
cp main.js manifest.json "<你的vault路径>/.obsidian/plugins/cc-obsidian-sync/"
```

然后在 Obsidian 里:**设置 → 第三方插件**(需关闭安全模式)→ 启用 **CC Cloudflare Sync**。

## 三、配置与使用

在插件设置里填:

| 设置项 | 说明 |
|---|---|
| Worker 地址 | 第一步部署得到的 URL |
| 访问 Token | 与 `AUTH_TOKEN` secret 相同的值 |
| 自动同步间隔 | 分钟数,0 = 关闭 |
| 启动时同步 | 打开 Obsidian 后自动同步一次 |
| 排除目录 | 逗号分隔的目录前缀,不参与同步 |

触发同步的三种方式:左侧 ribbon 的刷新图标、命令面板"立即同步"、自动定时。状态栏会显示同步状态,完成后 Notice 提示上传/下载/删除的文件数。

## 四、多设备使用

每台设备装同一个插件、填同一个 Worker 地址和 Token 即可。**新设备第一次同步会把远端所有文件拉下来**(空 vault + 远端有文件 = 全量下载),之后都是增量。

同步语义:

- 只在本地改过 → 上传;只在远端改过 → 下载。
- 本地删除会同步删除远端,反之亦然(本地删除走系统回收站,可找回)。
- 两端都改了同一文件 → 修改时间较新的一方覆盖另一方(修改优先于删除)。
- `.obsidian` 配置目录不参与同步(Obsidian API 的文件列表天然不含它)。

## 五、注意事项

- Worker 请求体上限约 100 MB,单个超大附件(视频等)建议放进"排除目录"。
- Token 即全部权限,泄露等于笔记泄露;建议 64 位以上随机串,泄露后重新 `wrangler secret put AUTH_TOKEN` 并更新各设备。
- 传输走 HTTPS;R2 中为明文存储,如需端到端加密可在插件上传前加一层对称加密(未实现)。
- 插件通过 Obsidian 的 `requestUrl` 发请求,不受 CORS 限制,桌面端和移动端都可用。
