---
name: release-plugin
description: 发布 Gitee Sync 插件新版本到 GitHub Release(社区市场和 BRAT 由此获取更新)。当用户要求"发布新版本"、"发 release"、"更新社区版本"、"bump 版本"时使用。
---

# 发布 Gitee Sync 插件新版本

发布的唯一正确方式是运行仓库里的发布脚本,不要手工执行各步骤:

```bash
scripts/release.sh <version> ["release notes"]
```

## 步骤

1. 确认所有功能改动已单独提交(脚本会拒绝在脏工作区上运行);
2. 决定新版本号:遵循 semver,`x.y.z` 格式、**不带 v 前缀**,必须大于 manifest.json 中的当前版本。bug 修复加 patch 位,新功能加 minor 位;
3. 用一句话概括本次改动作为 release notes(英文,面向插件用户而非开发者);
4. 运行 `scripts/release.sh <version> "<notes>"`;
5. 如需让本机 vault 立即生效:`cp main.js manifest.json <vault>/.obsidian/plugins/gitee-sync/`。

## 脚本做了什么(勿手工重复)

bump `manifest.json` 与 `versions.json` → `npm run build` → 提交推送 → `gh release create` 上传 `main.js` + `manifest.json` 附件。

## 注意事项

- Release 标签必须与 manifest.json 的 version **完全一致**,这是 Obsidian 定位安装包的方式;
- `versions.json` 记录每个版本要求的最低 Obsidian 版本(minAppVersion):老版本 App 的用户会被自动路由到其能兼容的最新版本——如果用户反馈"市场里看不到新版",先怀疑其 App 版本低于 manifest 的 minAppVersion;
- 如果改动用到了更新的 Obsidian API,记得在发布前把 manifest.json 的 `minAppVersion` 提高到对应版本,脚本会把它写进 versions.json;
- 插件已上架官方社区市场(id: `gitee-sync`),上架后的版本更新**只需要发 Release**,无需再走 community.obsidian.md 门户。
