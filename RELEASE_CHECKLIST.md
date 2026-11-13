# v1.0 发布检查清单（RELEASE_CHECKLIST）

> 逐项打勾后方可创建正式 Release。审核通过前不得发布。

## 1. 质量门

- [ ] `cd client && npm run build` 生产构建通过
- [ ] `npm test` 全部逻辑测试通过（7 个测试文件，50 项用例）
- [ ] 视觉回归：`npm run visual:compare` 全部一致（26 张基线，自动启停 Vite 并归零端口）
- [ ] Edge E2E 各批次场景回归通过
- [ ] 生产模式启动 → 强制清理 → electron/node 进程归零（netstat + tasklist 双确认）
- [ ] ⚠️ 优雅关闭（标题栏 ✕ / 菜单退出 / IPC 退出链路 → before-quit flush → 进程自然归零）**尚未验证**，
      列为打包完成后的真机强制验收项；在此之前任何文档不得声称「优雅关闭验证通过」
- [ ] 启动参数纪律：无 `--no-sandbox`、无 `--remote-debugging-port`（仅 `--disable-gpu --disable-gpu-sandbox`）

## 2. 打包

- [ ] 打包前确认 `client/release/` 已清空（2026-09-03 的旧版本产物已整体隔离至 `client/release-old-*/`，不得计入验收）
- [ ] `npm run dist` 产出安装版（nsis）+ 便携版（portable）到 `client/release/`
- [ ] 新产物可用版本号（1.0.0）、生成时间与 SHA-256 明确追溯
- [ ] 安装版本机安装 → 启动 → 卸载验证通过
- [ ] 便携版本机解压启动验证通过
- [ ] 安装包不含 dev 依赖、不含 dist 之外的多余文件
- [ ] **真机强制验收（打包完成后）：标题栏 ✕ 关闭、设置页/游戏菜单「退出」、IPC 退出链路全部走通，
      且每次关闭后 electron 进程树自然归零（before-quit flushStorageData 生效）**

## 3. 校验与归档

- [ ] 生成安装包与便携版 SHA-256 校验值（`certutil -hashfile <file> SHA256`）
- [ ] 校验值写入 Release 说明
- [ ] 版本号三处一致：package.json / About 弹窗（APP_VERSION）/ Release tag（v1.0.0）

## 4. 仓库与文档

- [ ] README.md：中文为主 + 英文简介、项目定位、截图、功能边界、隐私说明、运行/构建方式、非隶属声明、SmartScreen 提示
- [ ] PRIVACY.md、LICENSE（MIT）就位
- [ ] `.gitignore` 排除：node_modules/、dist/、release/、临时验证目录、Steam 参考图片
- [ ] 仓库不含任何 Steam 商标 / 素材 / 参考图

## 5. CI

- [ ] GitHub Actions（windows-latest）双工作流全绿：`ci.yml`（push/PR：install → test → build，**不含打包**）与 `package.yml`（仅 workflow_dispatch 手动触发：install → test → build → package）

## 6. 发布（最终审核后）

- [ ] Release tag：`v1.0.0`
- [ ] 附件：安装版 + 便携版 + SHA-256 校验值
- [ ] Release 说明包含：功能简介、离线声明、隐私说明、SmartScreen 未签名提示、非隶属声明
- [ ] 不实现自动更新（规格既定）
