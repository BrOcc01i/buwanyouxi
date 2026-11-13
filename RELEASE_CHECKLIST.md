# v1.0 发布检查清单（RELEASE_CHECKLIST）

> 逐项打勾后方可创建正式 Release。审核通过前不得发布。
> 状态标记：`[x]` 已实测通过 ｜ `[ ]` 未验证或未通过。勾选依据见文末「关卡 B 实测矩阵」。

## 1. 质量门

- [x] `cd client && npm run build` 生产构建通过（2026-11-13：`✓ built in 1.86s`）
- [x] `npm test` 全部逻辑测试通过（7 个测试文件，**50/50 PASS**，0 fail）
- [x] 视觉回归：`npm run visual:compare` 全部一致（**26/26 ✅**，真实退出码 0，端口 5173 归零）
- [ ] Edge E2E 各批次场景回归通过（本次发布门未复跑；开发期批次内已通过）
- [x] 生产模式启动 → 强制清理 → electron/node 进程归零（netstat + tasklist 双确认）
- [x] 优雅关闭（标题栏 ✕ / 菜单退出 / IPC 退出链路 → before-quit flush → 进程自然归零）
      —— **2026-11-13 打包版真机实测通过**：三条链路共用 `nw-window-control` IPC → `win.close()` →
      `window-all-closed` → `app.quit()`；WM_CLOSE 后 4 进程 → 0，耗时 ≤ 0.5s，
      且 `%APPDATA%\bu-wanyouxi-client\Local Storage\leveldb` 写入时间与关闭时刻一致（flush 生效）
- [x] 启动参数纪律：无 `--no-sandbox`、无 `--remote-debugging-port`
      （打包版不经 run.js，改由 `main.js` 代码级 `appendSwitch('disable-gpu' / 'disable-gpu-sandbox')` 保障）

## 2. 打包

- [x] 打包前确认 `client/release/` 已清空（2026-09-03 旧产物已隔离至 `client/release-old-*/`）
- [x] `npm run dist` 产出安装版（nsis）+ 便携版（portable）到 `client/release/`
- [x] 产物可用版本号（1.0.0）、生成时间（2026-09-19 14:26）与 SHA-256 追溯
- [x] 安装版本机安装 → 启动 → 卸载验证通过（静默安装 7.9s，启动 0.5s 出窗，卸载 3.6s 清空）
- [x] 便携版本机解压启动验证通过（2.5s 出窗，关闭后无解压残留）
- [ ] 安装包不含 dev 依赖、不含 dist 之外的多余文件（未做 asar 逐项审计，仅体积旁证：app.asar 4.70 MB）
- [x] **真机强制验收（打包完成后）：标题栏 ✕ 关闭、设置页/游戏菜单「退出」、IPC 退出链路全部走通**

## 3. 校验与归档

- [x] 生成安装包与便携版 SHA-256 校验值（`certutil -hashfile` 实测）
- [x] 校验值写入 Release 说明（README「下载与校验（v1.0.0）」）
- [x] 版本号三处一致：package.json（1.0.0）/ APP_VERSION（1.0.0）/ Git tag（v1.0.0）

## 4. 仓库与文档

- [x] README.md：中文为主 + 英文简介、项目定位、截图、功能边界、隐私说明、运行/构建方式、非隶属声明、SmartScreen 提示
- [x] PRIVACY.md、LICENSE（MIT）就位
- [x] `.gitignore` 排除：node_modules/、dist/、release/、临时验证目录、Steam 参考图片
- [ ] 仓库不含任何 Steam 商标 / 素材 / 参考图（文件名已改为「第三阶段_高保真商店UI实施规格.md」，但该文档正文仍多处提及 Steam，公开前需自查）

## 5. CI

- [ ] GitHub Actions（windows-latest）双工作流全绿：`ci.yml`（push/PR：install → test → build，**不含打包**）与 `package.yml`（仅 workflow_dispatch 手动触发：install → test → build → package）
      —— 未配置远端、从未在 GitHub 上运行过；本次仅本地验证两者配置正确（分支已由 master 改为 main，与 ci.yml 触发分支对齐）

## 6. 发布（最终审核后）

- [x] Release tag：`v1.0.0`（本地 annotated tag 已建，未推送）
- [ ] 附件：安装版 + 便携版 + SHA-256 校验值
- [ ] Release 说明包含：功能简介、离线声明、隐私说明、SmartScreen 未签名提示、非隶属声明
- [x] 不实现自动更新（规格既定）

---

## 关卡 B 实测矩阵（2026-11-13）

**基线**：分支 `main` ｜ 提交 `4901112` ｜ tag `v1.0.0` ｜ 198 文件 / 15,556 行插入 ｜ 工作区干净

| 用例 | 方法 | 实测结果 | 判定 |
|---|---|---|---|
| 生产构建 | `npm run build` | `✓ built in 1.86s`，入口 js 99.03 kB（gzip 33.54） | PASS |
| 逻辑测试 | `npm test` | tests 50 / pass 50 / fail 0 / skipped 0 | PASS |
| 视觉回归 | `npm run visual:compare` | 26/26 ✅，`compare: 全部一致`，EXIT=0，端口归零（TIME_WAIT=26 内核自然消退） | PASS |
| 打包版启动 | `release/win-unpacked/不玩游戏.exe` | 4 进程，主窗口标题「不玩游戏」，0.5s 出窗 | PASS |
| 优雅关闭 | `CloseMainWindow()` → WM_CLOSE | 进程 4 → 0，耗时 ≤0.5s | PASS |
| 状态落盘 | leveldb 检查 | `%APPDATA%\bu-wanyouxi-client\Local Storage\leveldb`，42 文件，`nw_client_state_v1` 命中 | PASS |
| 安装版安装 | `Setup 1.0.0.exe /S` | 退出码 0，7.9s，落位 `%LOCALAPPDATA%\Programs\bu-wanyouxi-client` | PASS |
| 安装版启动/关闭 | 安装目录 exe | 0.5s 出窗，4 进程 → 0 | PASS |
| 安装版卸载 | `Uninstall 不玩游戏.exe /S` | 3.6s 目录清空；进程 0 / 注册表 0 / 快捷方式 0 | PASS |
| 便携版启动/关闭 | `不玩游戏-Portable-1.0.0.exe` | 2.5s 出窗（自解压），关闭后进程 0、临时目录残留 0 | PASS |
| SHA-256 | `certutil -hashfile` | Setup `2422a83c…314c7c`｜Portable `116229ac…8b9e8` | PASS |

### 环境注意（非产品缺陷）

- 本机网关注入 `ELECTRON_RUN_AS_NODE=1` 与 `NODE_OPTIONS=...node-language-shim.cjs`，
  直接启动打包产物会被当作 Node 解释器执行（报 `bad option: --disable-gpu`，退出码 9）。
  **验收时必须先清除这两个变量**；普通用户环境不存在该变量，不影响发布。
- 本机无可用的 GPU 设备（DirectComposition 取不到 video device），应用走软件渲染；打包版已代码级禁用 GPU 加速。

### 已知问题（均为 P2，不阻塞发布但需在 Release 说明或后续版本处理）

1. **安装目录与用户数据目录使用英文包名**：`%LOCALAPPDATA%\Programs\bu-wanyouxi-client`、`%APPDATA%\bu-wanyouxi-client`，
   而显示名为「不玩游戏」。根因：`package.json` 缺根级 `productName`。
2. **卸载后保留用户数据**：卸载清空程序目录与注册表，但 `%APPDATA%\bu-wanyouxi-client` 保留（Electron 默认行为），
   与「清除数据一键彻底删除」的产品承诺存在口径差，建议在 PRIVACY/README 明示。
3. **安装包与提交未绑定**：现有 exe 生成于 2026-09-19，早于本次提交 `4901112`；
   源码（09-05）早于产物（09-19）故内容一致，但未重新打包，发布前建议重打一次并刷新 SHA-256。
