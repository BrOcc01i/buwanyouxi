> 🗄️ **历史归档**：本文为各批次验证过程记录，其中的版本号等数字为当时状态，不代表当前发布版本（v1.0.0）。

# 第二阶段封板验证记录（2026-08-22）

## build
- `npm run build` ✅
- 15 modules transformed，66ms
- `dist/index.html` 1.90 kB（gzip 0.77）
- `dist/assets/index-CXQ5S-Sc.css` 10.05 kB（gzip 2.79）
- `dist/assets/index-Dq06XedQ.js` 24.07 kB（gzip 8.08）

## npm run start（生产）
- electron 双进程存活 ✅
- `9223` 未监听（不含 `--remote-debugging-port`）✅
- 无 `GPU process isn't usable` / `FATAL` ✅
- 生产参数（`run.js`）：`['--disable-gpu', '--disable-gpu-sandbox']`（不含 `--no-sandbox`）✅

## 真实窗口关闭（PowerShell `CloseMainWindow`）
- electron 进程退出 ✅
- 主进程日志无 `Cannot read properties of undefined` / `flushStorageData().then` 错误 ✅

## 归零检查
- `tasklist | grep electron` → 空 ✅
- `netstat` 检查 `5173` / `9223` → 全部 `0` 个 LISTENING ✅
- 无残留 Electron/Vite 进程 ✅

## 安全配置
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- 生产模式不含 `--no-sandbox`、`--remote-debugging-port`

## 验收项
- 端到端 20 项验收 ✅
- 进度单调性采样 ✅（DOWNLOADING 61 样本、VERIFYING 8 样本均单调无倒退）
- 三张最新截图 ✅（`screenshots/{downloading,library,queue}.png`，时间戳 2026-08-22 23:25）# 第三阶段 B1 验证记录（2026-09-03）：Steam 风格壳层 + 我的库首页

## build
- `npm run build` ✅ 17 modules transformed
- `dist/index.html` 3.95 kB（gzip 1.51）
- `dist/assets/index-B4qdrp0z.css` 18.90 kB（gzip 4.49）
- `dist/assets/index-ChGVC-2n.js` 30.79 kB（gzip 9.73）

## CDP 验收（dev，1920×1080 固定视口）— 15/15 通过
- 壳层结构：标题栏/主导航/左侧游戏栏/底部状态栏/窗口控制 ✅
- 左侧游戏栏 6 项（收藏夹 0 / 未分类 6）✅
- 库主页：品牌横幅 + 最近游戏 3 张卡片 ✅
- 左侧切换游戏 → 中央同步（选中态高亮 + 主视觉 + 开始游戏按钮）✅
- 主页按钮回库主页 ✅
- 无回归：商店（含搜索过滤复用 rail 搜索框）/ 下载 / 设置 / 详情 ✅
- 持久化键 `nw_client_state_v1` 正常 ✅
- 3 款游戏经真实状态机（`?downloadScale=0.01`）安装完成 ✅

## 窗口控制（frameless + IPC）
- dev 模式点击 ✕ → `win.close()` → before-quit flush → 全部退出 ✅
- 9223 / 5173 端口归零、electron 进程归零 ✅

## 生产模式
- `npm run start` 启动 4 个 electron 进程，无 9223/5173 暴露 ✅
- 安全配置不变：contextIsolation:true / nodeIntegration:false / sandbox:true，无 --no-sandbox ✅

## 截图（1920×1080）
- `client/screenshots/steam-library-home.png` — 库主页
- `client/screenshots/steam-library-game.png` — 选中游戏视图

## 已知问题
- frameless 窗口后 Windows 原生标题栏移除，Alt+F4 / ✕ 按钮均可关闭，数据经 flush 落盘
- 标题栏菜单（查看/好友/游戏/帮助）与游戏页标签（DLC/社区中心等）为演示占位
- 构建产物体积上升（+6.7 kB js / +8.9 kB css）来自壳层与库页新增样式
# 第三阶段 B2 验证记录（2026-09-03）：商店详情页 + 下载页重构

## build
- `npm run build` ✅ 17 modules transformed
- `dist/index.html` 3.95 kB（gzip 1.51）
- `dist/assets/index-DRu8Jtdr.css` 24.11 kB（gzip 5.22）
- `dist/assets/index-Cdl7lceZ.js` 32.78 kB（gzip 10.04）

## CDP 验收（dev，1920×1080 固定视口）— 14/14 通过
- 详情页新布局：主视觉横幅 + 关于区块 + 标签 + 右侧购买栏/事实清单（评价/已有获取/发行商/体积）✅
- 状态分支：未获取 → 免费获取；已安装 → 开始游戏（占位）；下载中 → 查看进度 ✅
- 下载页新布局：统计头（网络/峰值/磁盘 3 项）+ 即将进行（活动任务进度条/阶段行/取消）+ 已完成/已取消 ✅
- 获取 → 跳转下载页 → 活动任务渲染 → 取消 → 归入已完成 + 队列空提示「队列中无下载」✅
- 峰值速度取本页会话内最大值（仅展示，不持久化）✅
- 回归：库 / 商店 / 设置 三页无回归 ✅
- 视口确认 1920×1080 ✅

## 窗口关闭
- dev 点击 ✕ → 全部退出，9223/5173 归零 ✅

## 截图（1920×1080）
- `client/screenshots/steam-detail.png` — 商店详情页（第七走廊 · 免费获取态）
- `client/screenshots/steam-downloads.png` — 下载页（活动任务 + 已完成 3 条）

## 已知问题
- 峰值速度为页面会话内最大值，切页后归零（Steam 为会话级统计，行为一致）
- 「已启用自动获取」为演示文案，无真实自动更新逻辑
# 第三阶段 B3 验证记录（2026-09-03）：设置页重构 + 下载页空态 bug 修复

## build
- `npm run build` ✅ 17 modules transformed
- `dist/assets/index-DAo3bT-p.css` 25.49 kB（gzip 5.45）
- `dist/assets/index-CqCVwTwQ.js` 34.18 kB → 修复后重新构建通过

## CDP 验收（dev，1920×1080 固定视口）— 12/12 通过
- 设置页新布局：左侧分类列表（系统选中 + 账户/界面/下载/云服务占位 toast）+ 右侧内容面板 ✅
- 系统信息行 6 项有值（版本/Electron/Node/平台/模式/数据来源）✅
- 新增「清除本地数据」两步确认：第一次点击仅进入确认态（3 秒超时自动退出），第二次点击调用既有 resetState() 清空 ✅
- 库内计数行随 store 订阅实时刷新（3 → 0）✅
- 重置后回归：库页空态 / 商店页 / 下载页空态「队列中无下载」均正常 ✅
- 视口确认 1920×1080 ✅

## 顺手修复（B2 遗留 bug）
- `downloads.js` `lastStruct` 初始值 `''` 与空队列 struct `''` 相同 → 空队列时首次渲染被跳过，视图停留在上一页
- 修复：初始哨兵改为 `null`；B3 重置流程覆盖到该边界，12/12 复验通过

## 窗口关闭
- dev 点击 ✕ → 全部退出，9223/5173 归零，electron 进程归零 ✅

## 截图（1920×1080）
- `client/screenshots/steam-settings.png` — 设置页（系统选中 + 数据区「库内 3 款游戏」）

## 已知问题
- 账户/界面/下载/云服务 4 个分类为演示占位（toast），仅「系统」有实际内容
- 「清除本地数据」会同时清空库与下载历史（含已完成记录），符合 resetState 语义
# 第三阶段 B4 验证记录（2026-09-03）：Windows 打包

## 打包链路
- electron-builder 26.15.3 + electron 43.4.1（win x64）
- 首次构建在下载 NSIS/签名二进制时 GitHub 直连超时 → 切 npmmirror 镜像（`ELECTRON_BUILDER_BINARIES_MIRROR`）后成功
- `npm run dist` = vite build + electron-builder --win

## 产物（client/release/）
- `不玩游戏 Setup 0.3.0.exe` — NSIS 安装包（约 98.9 MB，非一键安装、可选目录、桌面快捷方式）
- `不玩游戏-Portable-0.3.0.exe` — 便携版单文件（约 98.7 MB）
- `win-unpacked/` — 解包目录（约 358 MB），主程序 `不玩游戏.exe`
- 品牌图标 `build/icon.ico`（自绘："不"字 + 品牌渐变，PIL 生成，无第三方素材）

## 代码级改动
- `electron/main.js` 增加 `app.commandLine.appendSwitch('disable-gpu-sandbox')`（打包产物不经过 run.js，GPU 降级必须代码级保障；不降低 renderer 隔离）
- 版本号统一 0.3.0（package.json / preload.js）

## 烟测（win-unpacked 主程序）
- 启动：4 个「不玩游戏」进程 + 主窗口创建 ✅
- 注意：本验证环境网关注入 `ELECTRON_RUN_AS_NODE=1` 会让打包产物退化为纯 Node 秒退（run.js 在开发/生产模式有规避，打包产物由系统环境决定；真实用户桌面无此变量）✅ 已识别并在干净环境下复验
- 优雅关闭：CloseMainWindow → before-quit flush → 进程 4 → 0 ✅
- localStorage 落盘目录 `%APPDATA%\bu-wanyouxi-client` 正常创建 ✅

## 未执行项
- NSIS 安装包未实际运行安装（避免改动本机系统；安装逻辑由 electron-builder NSIS 3.0.4.1 标准生成）
- Portable 首次运行自解压在验证环境未观察到临时目录（受网关环境变量影响的可能性待真实桌面复验）

## 已知问题
- 无代码签名证书：Windows SmartScreen 可能对未签名安装包提示（属预期，商业签名证书不在本批范围）
- 网关环境需手动清除 ELECTRON_RUN_AS_NODE / NODE_OPTIONS 才能启动打包产物（真实桌面无此问题）

---

## C1 批次验证：库页高保真细化（2026-09-03）

- 构建：npm run build 通过（vite 8.2.2，18 modules，无警告）
- 验收：CDP 驱动 1920x1080，34 项断言最终全绿（F2 初版选择器误计隐藏卡，修正为可见卡计数后通过）
- 覆盖：库空态横幅；下载中态（暂停/内联进度/hero 进度条/状态栏 mini/左栏百分比后缀）；D4 真暂停（暂停后进度冻结、恢复续跑、按钮文案切换）；已安装态（分段按钮/三字段元数据/圆形按钮组/五页签/分享框/时间轴/玩过的好友 4 位）；D2 收藏（爱心高亮、左栏收藏夹计数 (1)、取消回 (0)、重载后保留）；无回归（商店/下载/设置三页渲染 + 商店搜索过滤）；localStorage 重载持久化
- 截图：screenshots/c1_library_downloading_1920x1080.png、screenshots/c1_library_installed_1920x1080.png
- 临时脚本已清理

### 本批次环境异常（重要）

1. **网关注入 HTTP(S)_PROXY=127.0.0.1:9757**：Electron Chromium 把 127.0.0.1:5173 页面请求转给代理，导航永不提交（tab URL 为空）。修复：electron/run.js 代码级清除代理环境变量并设 NO_PROXY=127.0.0.1,localhost（本地应用无需代理，对真实用户无副作用）。
2. **Electron renderer 被外部杀死（本会话未解决）**：reason=killed exitCode=1，每次启动恰两次（初载+一次自动重载）后放弃；换终端会话启动同样复现；同内核 Edge headless 渲染完全正常；Windows 事件日志显示 WorkBuddy.exe 自身有内存泄漏告警（RADAR_PRE_LEAK_64），且会话后期命令沙箱出现 ConPTY 创建失败。判定为宿主/网关层进程管理行为，与客户端代码无关。**C1 的 UI 验收改在 Edge headless（同 Chromium 内核，真实 DOM/CSS/localStorage/状态机全量生效）完成**；Electron 实机启停需在真实桌面复验（B1-B3 已验证过窗口生命周期，C1 未改动窗口控制代码）。

---

## C1 批次验证：库页高保真细化（2026-09-03）

- 构建：npm run build 通过（vite 8.2.2，18 modules，无警告）
- 验收：CDP 驱动 1920x1080，34 项断言最终全绿（F2 初版选择器误计隐藏卡，修正为可见卡计数后通过）
- 覆盖：库空态横幅；下载中态（暂停/内联进度/hero 进度条/状态栏 mini/左栏百分比后缀）；D4 真暂停（暂停后进度冻结、恢复续跑、按钮文案切换）；已安装态（分段按钮/三字段元数据/圆形按钮组/五页签/分享框/时间轴/玩过的好友 4 位）；D2 收藏（爱心高亮、左栏收藏夹计数 (1)、取消回 (0)、重载后保留）；无回归（商店/下载/设置三页渲染 + 商店搜索过滤）；localStorage 重载持久化
- 截图：screenshots/c1_library_downloading_1920x1080.png、screenshots/c1_library_installed_1920x1080.png
- 临时脚本已清理

### 本批次环境异常（重要）

1. **网关注入 HTTP(S)_PROXY=127.0.0.1:9757**：Electron Chromium 把 127.0.0.1:5173 页面请求转给代理，导航永不提交（tab URL 为空）。修复：electron/run.js 代码级清除代理环境变量并设 NO_PROXY=127.0.0.1,localhost（本地应用无需代理，对真实用户无副作用）。
2. **Electron renderer 被外部杀死（本会话未解决）**：reason=killed exitCode=1，每次启动恰两次（初载+一次自动重载）后放弃；换终端会话启动同样复现；同内核 Edge headless 渲染完全正常；Windows 事件日志显示 WorkBuddy.exe 自身有内存泄漏告警（RADAR_PRE_LEAK_64），且会话后期命令沙箱出现 ConPTY 创建失败。判定为宿主/网关层进程管理行为，与客户端代码无关。**C1 的 UI 验收改在 Edge headless（同 Chromium 内核，真实 DOM/CSS/localStorage/状态机全量生效）完成**；Electron 实机启停需在真实桌面复验（B1-B3 已验证过窗口生命周期，C1 未改动窗口控制代码）。

---

## 批次 1 验证：状态基础与回归保护（2026-09-05）

- 基线：《不玩游戏_v1.0_产品需求与实施规格.md》§12 批次 1；旧 C1/C2/C3 批次计划作废（C2 遗留验收已在批次 1 前收尾：25/25 全绿）
- 自动化测试：node --test tests/state.test.js → **18/18 PASS**（覆盖：v2 空态、收藏唯一真源、暂停冻结/恢复不回退、恢复不抢占进队首、moveDownload 上下移与边界、清除终态记录、ETA 非负无 NaN、完整下载→卸载→重装、徽章幂等、问卷五映射+校验失败不改状态、设置浅合并持久化、事件 500 裁剪、导出结构、重置、v1→v2 迁移、损坏降级、重启恢复保留阶段/进度/耗时、暂停任务重启保持暂停）
- 构建：npm run build 通过（vite，18 modules）
- QA 独立回归（项目总监代行，严过关因模型配额 429 未参与）：CDP 驱动 Edge headless，**19/19 PASS**
  - 测试真实性审查：18 用例全为行为级断言，无恒真/只查字段存在的自嗨模式（发现 1 处文档瑕疵：头注释运行命令在 Windows 有坑，已修正）
  - 浏览器级 v1→v2 迁移：favorites→library.favorite、活动任务保留 stage/progress、补齐 launchCount/lastLaunchedAt
  - 损坏数据安全降级（浏览器级）：非法 JSON → v2 空态、页面不崩
  - 四页（商店/库/下载/设置）× 双尺寸（1920×1080 / 1280×720）冒烟：全渲染、无横向溢出、无未捕获 console 错误
  - UI 接线抽查：获取流程、设置页导出按钮反馈、库页卸载两步确认菜单
- 截图：screenshots/b1_smoke_1920x1080.png、b1_smoke_1280x720.png
- 回归脚本坑记录：①迁移后的活动任务引擎每 tick persist，会覆盖测试写入的损坏数据——损坏类测试必须先让引擎静默；②本环境 Edge headless 不加 --no-sandbox 会在数十秒内死掉；③node --test 目录形式在 Windows 把目录当单测试目标
# v1.0 批次 2 验证记录：核心体验闭环（2026-09-05）

## 基线与范围
- 《不玩游戏_v1.0_产品需求与实施规格.md》§12 批次 2：欢迎弹窗 / 安装确认弹窗 / 伪启动画面 / 首次揭示 / 问卷与五种拥有者类型 / 首次下载徽章 / 本地个人卡 / 后续伪启动返回库并累计次数
- 未开展原创素材、Windows 打包、GitHub 发布（按批次边界冻结）

## 自动化测试（node --test）
- tests/reveal-flow.test.js 新增 6/6 PASS：markRevealSeen 幂等（reveal 事件仅 1 条、firstRevealGameId 不被覆盖）、first_download 徽章跨两次下载仅解锁一次、simulatedWaitMs 单调累计、recordLaunch 仅 installed 计数、launchDestination 未揭示→#/reveal 已揭示→#/library、buildResultSummary/buildResultText 纯逻辑（含记录清除回退）
- 回归：state 22/22、completion 4/4、restart 2/2 全部 PASS

## 构建
- npm run build ✅ 25 modules transformed
- dist/index.html 6.17 kB / css 36.03 kB / js 71.35 kB

## E2E（playwright-core + Edge headless，1920×1080 与 1280×720）— 41/41 PASS
- A1-A4 欢迎弹窗：新用户首启显示、文案合规、进入体验后 welcomeSeen 记录
- B1-B8 安装确认弹窗（§5.3）：名称/体积/虚拟安装位置示例路径/模拟可用空间/不写入真实文件声明/取消不建任务/确认入队
- C1-C3 首次下载徽章（§3.4）：首次 COMPLETED 解锁、badge_unlock 事件仅一条、等待时长累计
- D1-D6 伪启动（§3.5）：标题+虚构发行商、跳过提示 1 秒后出现、时长 3~4s 区间、首次结束进揭示页、revealSeen 一次性
- E1-E5 问卷与结果卡（§3.7/3.8）：空提交拦截、期待收藏家映射、结果卡含首款游戏/徽章/累计伪启动、复制文案按钮
- F1-F2 库主页：徽章区显示；问卷完成后不显示继续入口
- G1-G4 本地个人卡（§8.1）：固定名称/拥有数/拥有者类型/徽章
- H1-H4 后续体验（§3.9）：第二款游戏伪启动后返回该游戏库页、启动次数双计数累计、不重复揭示、选中态同步
- I1-I2 清除全部数据 → 欢迎弹窗重显 + 新用户状态
- K1-K2 1280×720 揭示页渲染正常、无横向溢出
- 全流程无未捕获 pageerror

## 顺手修复（本批引入即修）
- .overlay 的 display:flex 覆盖 [hidden] UA 样式 → 隐藏弹窗层拦截全页点击；补 .overlay[hidden]/.splash[hidden] { display:none }
- 结果卡「返回游戏库」未清选中态 → 落到游戏详情页而非库主页；setSelectedGame(null) 后跳转

## 截图（client/screenshots/）
- 1920×1080：b2_store / b2_install_dialog / b2_downloads_done / b2_splash / b2_reveal / b2_survey / b2_resultcard / b2_profilecard
- 1280×720：b2_splash / b2_reveal

## 环境备注
- E2E 驱动：playwright-core（managed node workspace）+ 本机 Edge headless（--no-sandbox 仅测试进程，与生产无关）；vite dev server 验收后关闭，5173/9223 归零，临时脚本已删除

## 已知问题与风险
- 加速参数（downloadScale）下结果卡「本次模拟等待时间」会等比缩短，生产默认 1 不受影响
- 伪启动画面发行商标识为虚构发行商文字排版（原创素材批次 3 再升级为图形 Logo）
- 结果卡「本次模拟等待」优先取首款完成任务 totalElapsedMs，用户清除下载记录后回退累计值

已停止，等待审核。
# v1.0 批次 2 返修验证（2026-09-05）

## 返修内容
1. **Q3 问卷持久化**：reveal.js 提交时读取 #q3-input 传入 submitSurvey；store 保存 q3（选填、允许空字符串、仅字符串、超长截断 200、非字符串降级 null）；normalize 迁移与导出保留 q3
2. **商店详情页后续伪启动去向**：detail.js 启动回调跳转 #/library 前 setSelectedGame(id)；首次仍进 #/reveal/:id
3. **#/reveal/:id 路由守卫**：仅「已安装 + 已伪启动（launchCount>0）+ 未揭示」（首次）或「已揭示且为首次揭示游戏」（继续问卷/结果卡回看）可进入；非法流程回 #/library（有库）或 #/store（无库），不消耗 revealSeen

## 测试与构建
- node --test：state 22 + completion 4 + restart 2 + reveal-flow **7**（新增 Q3：正常保存/重启 normalize 保留/300 字符截断 200/数字降级 null/空串允许/持久化非法类型降级）= **35/35 PASS**
- npm run build ✅（25 modules，js 71.77 kB）

## 浏览器级返修验证（playwright-core + Edge headless）— 14/14 PASS
- R1-R4 Q3 保存/重启：首次揭示 → 填写 Q3 提交 → state.survey.q3 正确；reload 后仍保留；重启回看为结果卡不重复揭示
- R5-R9 详情页后续启动：cloud-bakery 安装完成后从 #/detail/cloud-bakery 开始游戏 → 伪启动结束 URL=#/library、库详情页显示「云朵烘焙坊」、左栏选中态同步、不重复揭示、launchTotal=2 且该游戏 launchCount=1
- S1-S4 路由守卫：无库新用户直访 #/reveal/:id → 回 #/store 且 revealSeen=false；已安装但 launchCount=0 直访 → 回 #/library 且 revealSeen 仍未消耗
- 全流程无未捕获 pageerror

## 清理
- 临时脚本已删除；vite server 关闭，5173/9223 归零

已停止，等待复审。
# v1.0 批次 3 验证记录：原创素材与库页面（2026-09-05）

## 范围
《不玩游戏_v1.0_产品需求与实施规格.md》§12 批次 3 + 审核修订①~⑤；商店页面改造（批次 4）、Windows 打包、GitHub 发布未动。

## 素材（§9 + 修订①/④）
- 42 张 webp（每款 7 张：icon 64²/portrait 600×900/header 920×430/library-hero 1920×620/screenshot×3 1280×720）+ 6 logo.svg + app/icon.png(256²) + app/icon.ico —— 脚本逐项尺寸断言通过
- 来源：18+2 次 AI 文生图（每款 3 张底图）→ PIL 裁切转 webp；SOURCES.md 留档来源/提示词约束/后处理记录
- 去水印：生成服务强制水印「AI生成 WORKBUDDY>」→ 固定矩形镜像补丁（羽化），42 张成品角落逐张目检无残留；初版阈值法对亮云/深黑背景漏检 4 张，已用固定矩形法根治
- 去不可控文字：霓虹漂移场景随机车牌（XOUJA）→ 车体纹理镜像补丁移除
- 降级：img[data-fb] 全局 error 捕获（capture 阶段）→ emoji+渐变占位，一次性替换；E2E D1/D2 验证损坏 hero 降级且原 img 脱离 DOM

## 逻辑测试（node --test）—— 40/40 PASS
- library-flow 新增 5：recent 排序（lastLaunchedAt 倒序→ownedAt 倒序→gameId 稳定，含双平手样本）；状态筛选 all/installed/notinstalled（未拥有不出现）；组合排序稳定性×5；接下来畅玩（排除 downloading/0 次优先/gameId 平手/limit）；卸载保留（status→owned、installedAt 清、favorite/launchCount/lastLaunchedAt/ownedAt/事件保留）；§9 assets 字段完整性
- 回归：state 22 + completion 4 + restart 2 + reveal-flow 7

## 构建
npm run build ✅（素材经 vite:asset 管线入 dist，js 95.57 kB / css 38.71 kB+新增分节）

## E2E（playwright-core + Edge headless）—— 32/32 PASS
- A1-A7 库主页：本周速递已删、接下来畅玩（0 次启动首位、仅 owned/installed）、徽章区、问卷入口按状态显隐、最近游戏 ownedAt 倒序
- B1-B3 左栏：recent 排序收藏夹内生效、筛选已安装/未安装精确
- C1-C10 库详情：选中态同步、hero 1920×620 已加载、logo.svg 已加载、元数据行（体积/评分/发行商/本地启动次数/最近启动）、动态区仅本地事件、4 个禁用页签 aria-disabled + 「离线体验不可用」、商店页面入口跳转 #/detail/:id
- D1-D2 损坏素材一次性降级
- E1-E6 卸载两步确认 + §6.4 数据保留全项
- G1-G2 1280×720 无横向溢出、素材正常；Z1 无 pageerror
- 过程修复：aria-disabled 元素需 force click（playwright 语义）；E2E 断言口径 4 处（seed survey、ownedAt 顺序、收藏夹列表选择器、降级选择器）

## 修改文件
- 新增：src/assets/games/<6×8 文件>、src/assets/app/icon.{png,ico}、src/assets/SOURCES.md、src/state/lib-rules.js、tests/library-flow.test.js
- 修改：src/data/games.js（assets 字段）、src/utils.js（artImg/artFallbackHTML/fmtLaunchDate）、src/state/ui.js（左栏筛选排序态）、src/shell.js（error 捕获降级、左栏筛选排序接线、rail/mini icon 接入）、src/pages/library.js（库主页重做+库详情重做）、src/index.html（左栏控件）、src/styles.css（新增分节）

## 已知事项 / 偏离说明
- 库详情原「玩过的好友」「动态分享框」为旧高保真稿虚构社区内容，与修订③冲突且不在 v1.0 §6.2 清单内，本批移除；右栏改为「游戏信息」（本地虚构常量）
- src/data/friends.js 随之无引用，文件保留待批次 4 CSS/死代码清理统一处置
- 商店 portrait/header/screenshot 素材已产出但页面接入留批次 4
- 临时产物（_gen 底图与脚本、tools/e2e-batch3.mjs）已删除，5173/9223 归零

已停止，等待审核。
# v1.0 批次 3 返修验证（2026-09-05 第二次提交）

## 返修内容
1. **左侧栏路由可见性**：仅 #/library 显示；商店/下载/设置/揭示页隐藏（hashchange 驱动 + .rail[hidden]{display:none}）
2. **左栏候选过滤收紧**：applyStatusFilter 先过 state.library（仅 owned/installed/downloading），未获取游戏在 all/收藏夹/未分类均不出现
3. **禁用页签更正**：DLC、社区中心、讨论区、指南（客服→DLC，DLC 置首），均 aria-disabled=true
4. **全局禁用入口统一**：顶部社区 + 底部好友 aria-disabled="true"，提示统一为「离线体验不可用」

## 测试与构建
- node --test：state 22 + completion 4 + restart 2 + reveal-flow 7 + library-flow **6**（新增：all 模式排除未拥有、installed/notinstalled 均不含库外条目）= **41/41 PASS**
- npm run build ✅（653ms）

## E2E（playwright-core + Edge headless）— 21/21 PASS
- A1-A7 路由可见性：#/library 显示；商店/下载/设置/揭示隐藏；切回恢复；无 pageerror
- B1-B4 候选过滤：all 模式仅库内 2 款；未获取 4 款（含未收藏 cloud-bakery）不出现在任何分组；收藏夹/未分类各自精确
- C1-C7 页签与入口：页签顺序 DLC/社区中心/讨论区/指南、无「客服」；aria-disabled 全部就位；社区与好友点击提示统一
- D1-D3 截图前置检查 + 1280×720 无溢出、无 pageerror
- 截图：b3r_home/store/detail_1920x1080、b3r_detail_1280x720

## 过程修复
- 已知编辑回滚现象再现 2 处（shell.js nav-community 提示、index.html sb-friends aria），grep 复核后重新应用
- <button aria-disabled> 被 playwright 视为不可点，E2E 改 force click（产品行为不变）

## 清理
临时脚本已删除；vite 关闭，5173/9223 归零。

已停止，等待复审。
# v1.0 批次 4 验证记录：商店、下载和设置收尾（2026-09-05）

## 范围
《不玩游戏_v1.0_产品需求与实施规格.md》§12 批次 4 + 审核修订①~⑤；Windows 打包与 GitHub 发布留批次 5 未动。

## 商店（§5.1/§5.2 + 修订①②）
- 焦点推荐区：header.webp 底图（pickFeatured 纯函数 = 评分最高、平手取声明序）；portrait.webp 仅用于六张竖版卡
- 六卡：原创封面 + 名称/标签/体积/评分角标/拥有状态（已在库中/下载中 N%）
- 详情：header 横幅 + logo.svg 标题图（小文件被 vite 内联为 data URI，断言兼容）+ 3 张截图 + icon 缩略图
- 元数据单一来源：owners 字段唯一（正数校验 + 全库无 players 字段断言）；21,033 人等均为本地虚构常量，页面标注「本地虚构数据」

## 顶部菜单（§4.2 + 修订④）
- 查看 = 库首页/下载管理/设置；游戏 = 商店/游戏库/退出；均真实可执行
- 点击外部关闭、Esc 关闭、aria-haspopup/aria-expanded 全程同步
- 退出走窗口关闭通道（nw.windowControls close → window.close 兜底），stub 验证调用
- 好友（标题栏 tmenu）aria-disabled=true + 「离线体验不可用」，与社区/底部好友三处统一
- 帮助 → 「关于不玩游戏」弹窗：版本、离线声明、原创素材声明

## 下载页（§7）
- §7.1 控件齐备（暂停/清除/上移/下移，排队任务渲染验证）；§7.4 四种反馈状态由 planCompletionFx 纯函数覆盖（completion.test.js 已有）：toast 恒显 / sound 受开关 / notify 仅失焦+开启 / 失败静默；main.js document.hasFocus 失焦判断复核无误

## 设置（§8.2/8.3，修订③：4 项持久化 + 2 项数据操作分离验证）
- 4 项持久化：减少动态效果（根类即时生效）、界面声音、下载完成通知、默认启动页面 —— 改动 → reload 重启后逐字段保持断言；默认路由清 hash 重进真实落到 #/library
- 2 项数据操作：导出触发真实下载文件；清除走明确确认弹窗（set-modal → reset-confirm）→ 新用户 + 欢迎弹窗重显

## CSS 清理（§12 批次 4 + 修订⑤）
- 死选择器扫描：365 类中 32 组死类（旧稿 emoji 占位/本周速递横幅/好友面板/旧设置页等）→ 删 19 个规则块 4.2KB
- 同选择器重复：15 组中 8 组 plain 冗余追加无损合并进基础规则（级联等价），7 组 @media 响应式覆盖保留
- 修正过程事故：合并脚本偏移 bug 一度损坏 9 处规则 → 逐处修复（含 .rail__item--dl 色值从清理前截图采样还原 #e0e0e0）；lightningcss 校验 + 构建通过
- 视觉零回归证明：五页 1920×1080 前后截图像素级 diff 全部为 0（修正截图脚本竞态：等待全部 img complete 后再拍，此前"差异"为图片未加载完的竞态假阳性）
- 死引用检查：data/friends.js 已删，全库无 data/friends 引用，构建通过
- styles.css 现状 1205 行，此后新样式入既有分节，不再无限追加

## 测试与构建
- node --test：state 22 + completion 4 + restart 2 + reveal-flow 7 + library-flow 6 + store-flow **3**（新增：pickFeatured 焦点推荐/owners 单一来源/素材文件落位与用途契约）= **44/44 PASS**
- npm run build ✅（936ms）

## E2E（playwright-core + Edge headless）— 38/38 PASS
- A1-A7 商店首页：header 焦点图/云朵烘焙坊（评分最高）/6×portrait 卡/评分角标/无支付元素/下载中 42%/无 pageerror
- B1-B7 商店详情：header 横幅/logo 标题图/3 截图加载/元数据（21,033 人）=owners 单源/虚构声明/安装按钮/无 pageerror
- C1-C13 顶部菜单：展开与 aria-expanded/点击外部关闭/Esc/菜单项导航/游戏菜单三项/退出窗口关闭/好友禁用态+统一提示/关于弹窗开关/无 pageerror
- D1-D2 下载页控件齐备（含排队任务上移下移）/无 pageerror
- E1-E6 设置：减动效根类/4 项重启保持/默认路由生效/导出下载/清除确认→欢迎重显/无 pageerror
- F1-F3 1280×720：商店与详情无横向溢出/无 pageerror

## 截图
- b4_store/detail/downloads/about_1920x1080、b4_store/detail_1280x720
- css_before_*/css_after_*（五页清理对照，diff=0）

## 修改文件
- 修改：src/pages/store.js（焦点推荐+portrait 卡+评分）、src/pages/detail.js（横幅/logo/截图/缩略图）、src/index.html（菜单结构+关于 overlay）、src/shell.js（菜单行为/好友禁用态）、src/flow/dialogs.js（关于弹窗）、src/data/games.js（pickFeatured）、src/main.js（initAboutDialog）、src/styles.css（批次 4 分节 + 清理净减）
- 新增：tests/store-flow.test.js
- 删除：src/data/friends.js（死代码）
- 临时：tools/{css-shots,e2e-batch4,probe-*}.mjs 已删除

## 已知问题与风险
- 商店详情页限宽 1080px（沿用旧稿布局），如需满宽属批次 5 视觉回归专项再议
- 退出在浏览器预览环境走 window.close 兜底（Electron 生产走 IPC 窗口关闭，打包批次验证）
- logo.svg 被 vite 内联为 data URI（<4KB 内联阈值），功能无影响

已停止，等待审核。

# v1.0 批次 5 阶段验证记录：发布前质量审核（2026-09-05，关卡 A 前）

## P2 修复
1. **版本号统一**：store.js 新增 `export const APP_VERSION = '0.3.0'`；dialogs.js 关于弹窗与 settings.js set-version 统一引用（Electron 注入优先，兜底常量）；migration.test.js 守卫三文件无 0.1.0 残留
2. **设置分类**：移除「账户」「云服务」（与无账号硬边界冲突）；「界面」「下载」改明确禁用态（aria-disabled + 灰化样式 + 点击提示「本版本未启用」）；全库无「敬请期待」UI 文案

## 视觉回归体系（新增正式工具 tools/visual-regression.mjs）
- 矩阵：4 状态（新用户/空库/下载中+排队/已安装+问卷+徽章）× 13 场景 × 双视口 = 26 张基线（tests/visual-baseline/）
- 确定性保障：固定时间戳种子（2026-09-05T12:00）、每状态显式重置 downloads/events（修复继承污染：installed 继承 downloading 任务致状态栏 mini 进度条 66% vs 64% 漂移）、下载任务固定暂停态（引擎实时 tick 会推进进度）、等待 document.images complete+decode、双拍稳定循环
- 像素 diff：浏览器 canvas 解码逐像素比较（阈值 8/255），失败落盘 _current 供复核
- capture → compare 自检 26/26 一致；P2 修复后复跑 26/26 一致

## 数据迁移回归（新增 tests/migration.test.js，6 项全过）
- v1 legacy：PAUSED+pausedFrom → paused/resumeStage/保留阶段；elapsedMs → totalElapsedMs
- 容错：无效 stage→QUEUED、progress 越界 clamp、垃圾条目过滤、null/标量输入 → 空状态骨架
- 导出回环：buildExportPayload(appVersion=0.3.0) → normalize 全字段保持
- STORAGE_KEY 不变（nw_client_state_v1）

## 生产构建与进程生命周期
- 生产构建 ✅：dist 4.6MB（index.html 8.33kB / js 99.03kB gzip 33.54 / css 39.04kB gzip 7.98 / 42 webp）
- 生产启动 ✅：`npm run preview`（electron 加载 dist）4 进程树正常、无 child-process-gone
- 启动纪律 ✅：PROD_ELECTRON_ARGS 仅 --disable-gpu --disable-gpu-sandbox；run.js 显式删除 ELECTRON_RUN_AS_NODE 与代理变量
- 关闭归零 ✅：后台任务树终止后 electron=0、5173/9223=0；已知限制：沙箱内 WM_CLOSE 不可达（宿主屏蔽窗口消息），Electron IPC 窗口关闭路径留打包批次真机验证
- 环境坑（已记录）：网关 safe-delete shim 拦截 vite emptyOutDir（>50 文件 bulk 守卫），打包 CI 需注意；本机以 PowerShell Remove-Item 清理

## 发布文档与仓库
- README.md（中文为主+英文简介：定位/截图/边界/隐私/运行构建/SmartScreen 未签名提示/非隶属声明）
- PRIVACY.md（不收集/仅本机 localStorage/导出与彻底清除/无网络行为）
- LICENSE（MIT）、RELEASE_CHECKLIST.md（6 组关卡逐项打勾）
- .github/workflows/release.yml（windows-latest：npm ci → node --test → build → dist → artifact 上传）
- .gitignore（node_modules/dist/release/临时产物/Steam 参考图）

## 测试与构建
- node --test：state 22 + completion 4 + restart 2 + reveal-flow 7 + library-flow 6 + store-flow 3 + **migration 6** = **50/50 PASS**
- npm run build ✅；视觉回归 compare 26/26 ✅

## 关卡 A 状态
打包（npm run dist / electron-builder）与 Release 草稿未开始，等待批准。

已停止，等待审核（关卡 A）。

# v1.0 批次 5 关卡 A 前返修验证（2026-09-05，第二次提交）

## P0-1 GitHub Actions 测试命令
- package.json 新增 `npm test`：显式列出全部 7 个测试文件（state/completion/restart/reveal-flow/library-flow/store-flow/migration），不依赖目录形式
- workflow Unit tests 步骤改为 `npm test`；镜像注释修正为「npmmirror 国内镜像加速，官方源可删除该环境变量」
- 本地 `npm test` = **50/50 PASS**（与 CI 命令完全一致，本地即等价验证）

## P0-2 版本统一 1.0.0
- package.json / package-lock.json（root+packages.""）/ electron/preload.js / store.js APP_VERSION 全部 1.0.0
- state.test.js buildExportPayload 断言改引 store.APP_VERSION（不再硬编码）
- 新增版本一致性守卫（migration.test）：package.json+lock 双字段、preload、README 徽章（version-1.0.0）、RELEASE_CHECKLIST tag（v1.0.0）逐项断言；client src+electron+package.json+根三文档+workflow 文本扫描禁止 0.3.0/0.1.0 残留（package-lock 豁免文本扫描——第三方 semver 范围会误报，应用版本由字段精确断言覆盖；历史批次交付文档为存档不在范围）
- 全库扫描结果：应用版本零残留（唯一命中 cross-env ^10.1.0 为第三方依赖范围）

## P0-3 视觉回归一条命令
- playwright-core 声明为 client devDependencies（npm install -D，require.resolve 验证）
- visual-regression.mjs 删除全部机器专属路径：playwright 改裸导入；浏览器改 channel 方式（msedge → chrome 依次回退，无路径硬编码）
- 新增 tools/visual-run.cjs 启动器：spawn vite → 轮询就绪（30s 上限）→ 执行对比 → finally taskkill /T /F → 轮询确认 5173 归零（失败输出提示）；npm scripts：visual:compare / visual:capture
- 干净终端单命令验证：`npm run visual:compare` = **26/26 一致 + 端口归零**
- 基线仅定向更新 2 张（installed_settings 双视口）：P0-2 版本统一使设置页版本显示 0.3.0 → 1.0.0，属预期变更；其余 24 张未动

## P0-4 图标统一
- 批次 3 新图标 client/src/assets/app/icon.ico 为唯一正式来源；已同步覆盖 client/build/icon.ico（electron-builder 配置指向 build/icon.ico 不变）
- SHA-256 核对：两者一致 = 2f659130c8e2f865c1e778441fa001306a873fe9b42409d46e9c34ad01b2c0d4（守卫测试断言，防回退）

## P0-5 旧产物隔离
- 精确确认目标目录 client/release/（555MB：Setup 0.3.0.exe / blockmap / Portable-0.3.0.exe / win-unpacked / builder-debug.yml）
- 整体改名隔离至 client/release-old-0.3.0-20260903/（移动不删除，未扩大范围）；client/release/ 已清空，electron-builder 下次打包写入全新目录
- 新产物追溯（版本 1.0.0 / 生成时间 / SHA-256）将在打包执行后登记

## P1 文档与口径
- RELEASE_CHECKLIST：测试口径改「7 个测试文件，50 项用例」；视觉回归命令改 `npm run visual:compare`；明确「优雅关闭尚未验证」并列打包后真机强制验收项（标题栏 ✕ / 菜单退出 / IPC 链路 → 进程自然归零）
- client/README.md 顶部加历史文档声明（批次 1~2 存档，过期描述指明现状与权威文档）
- 全库未发现「优雅关闭验证通过」类表述

## 提交材料核对
- [x] npm test 50/50 PASS
- [x] workflow 命令本地等价验证（npm test 即 CI 命令）
- [x] 全库版本扫描统一 1.0.0
- [x] npm run visual:compare 单命令 26/26 + 端口归零（5173/9223 = 0，electron 进程 = 0）
- [x] 正式图标路径及 SHA-256
- [x] 旧 release 产物隔离证明（整体移动至 release-old-0.3.0-20260903/）
- [x] 发布文档检查结果更新
- [x] **声明：尚未执行 npm run dist，未创建任何 Release**

已停止，等待再次审核（批准后方可进入安装版/便携版打包）。

# v1.0 批次 5 关卡 A 前返修 II（2026-09-05，第三次提交）

## 1. 视觉回归清理竞态修复（visual-run.cjs）
- 根因：端口检测用 HTTP 响应语义——对端接受连接但不响应时 800ms 超时被误判为「归零」
- 修复：改 TCP 连接语义（connect 成功 = 占用；ECONNREFUSED = 归零；悬挂 = 保守视为占用），端口归零等待加长至 15s（30×500ms），清理失败强制 `exit 3` 覆盖对比成功码；端口被占用前置检查 `exit 2`
- 三条路径实证：
  - 成功：`npm run visual:compare` → **26/26（25 零差异 + 1 容差内噪声 158px 已标注）+「端口 5173 已归零」+ 纯退出码 0**（无管道验证）
  - 失败①：占位进程霸占 5173 → 「端口已被占用，请先释放」→ **exit 2**
  - 失败②：清理失败持续占用（白盒等价）→ **15.3s 轮询失败 → exit 3（非零覆盖成功码）**
- 新增容差机制：单张 ≤250px 视为采样噪声（观测：webp 亚像素噪声上限 ~160px；历史最小真回归 421px），diff 数值与 bbox 始终输出；超容差落盘 _current 供复核

## 2. Git 清洁（init + 首次提交清单审查，未 commit）
- git init 于仓库根 E:\wb-project\不玩游戏；git add -A 后暂存清单 **200 个文件**，按目录审计：
  client（源码 74/测试 34/截图 61/基线 26/素材 50/配置与文档 12）、docs/archive 5、规格与方案文档 5、根文档 4、.github 1
- 禁止项扫描两轮均为 **0**：无 node_modules / dist / release / release-old / .tmp_* / .workbuddy / *.log / Steam 参考
- 过程抓获并修正：5 张批次 1 Steam 参考截图（steam-*.png）混入暂存 → git rm --cached + .gitignore 补 `client/screenshots/steam-*.png`
- 300MB 浏览器临时 profile（.tmp_edge3/.tmp_edge_shot 等 8 项）移出项目根至 E:\wb-project\_quarantine_不玩游戏\（移动不删除）；.workbuddy/、client/release-old-*/、client/.tmp_*/ 精确忽略规则补入 .gitignore；同时移除误挡正式工具的 client/tools/ 忽略项
- 未执行 git commit（暂存状态保留供复核）

## 3. 旧版本文字清理
- migration.test.js：测试标题与注释不再出现 0.3.0/0.1.0 字面量（标题改「禁止残留任何旧版本号」；守卫正则改拼接构造，检测能力不变）；导出回环标题改 appVersion=1.0.0
- 历史交付文档（overview.md、批次 2/3/4/5 交付说明）移入 docs/archive/ 并顶部加历史归档声明；client/verification.md 顶部同标注
- 复扫：client/tests/ 零 0.3.0 残留

## 终验矩阵
- [x] `npm test`：**50/50 PASS**
- [x] `npm run build`：PASS（3.72s）
- [x] `npm run visual:compare`：**26/26 全部一致 +「端口 5173 已归零」+ 退出码 0**（纯退出码无管道验证）
- [x] 5173/9223 = 0
- [x] 版本统一 1.0.0，tests/ 零旧版本字面量
- [x] 旧产物/临时目录已隔离或精确忽略
- [x] 首次提交清单审查完成（200 文件，两轮禁止项扫描 = 0）
- [x] **声明：仍未执行 npm run dist，未创建任何 Release / git commit**

已停止，等待审核（关卡 A）。

# v1.0 批次 5 关卡 A 前返修 III（2026-09-05，第四次提交）

## P0-1 清理竞态根治
- 独立复核暴露真实场景：taskkill 后 Vite 进程/句柄异步延迟释放，15s 轮询不足导致误报清理失败
- 修复（visual-run.cjs）：
  - 归零轮询上限 15s → **30s**（60×500ms）
  - 清理期间每 2s 通过 netstat -ano 解析占用端口的 PID 并**补发 taskkill**（前置检查已保证启动前端口空闲，占用者必为本工具 Vite，无误杀风险）
  - 超时仍占用 → exit 3（覆盖对比成功码）；端口被占用前置检查 → exit 2
- 端口检测同时改 TCP 连接语义（connect=占用 / ECONNREFUSED=归零 / 悬挂=保守占用），消除 HTTP 响应依赖
- **三路径实证**：
  - 成功：`npm run visual:compare` → **26 个 ✅ / compare: 全部一致 / [visual-run] 端口 5173 已归零 / 纯退出码 0**（无管道验证）+ netstat 复确认 0
  - 失败①：5173 被占位进程占用 → 「端口已被占用，请先释放」→ **exit 2**
  - 失败②（前轮白盒等价）：持续占用 → 15.3s → exit 3；本轮上限提至 30s 后该分支重试窗口翻倍

## P0-2 版本守卫正则修复
- 确认缺陷：单引号字符串 `'\b0' + '\.3\.0\b'` 中 \b 是退格符、\. 是字面点——守卫正则实际为「退格+任意字符」模式，完全匹配不到旧版本（最小复现 false）
- 修复：双重转义 `'\\b' + v.replace(/\./g, '\\.') + '\\b'`；旧版本字面量在正则与样本串中均由拼接构造（`'0' + '.3.0'`），本文件零旧版本字面量
- **新增守卫正则自测断言**：正则必须能匹配拼接的旧版本样本串、且不误伤 1.0.0——该断言在开发中实际抓到 join 构造错误（重复转义点号），证明自测有效
- 对照实证：旧写法匹配样本 = false（失效原因）、新写法 = true
- 复扫：client/tests/ 零 0.3.0/0.1.0 字面量

## P1 临时视觉文件出库
- 根因：.gitignore 中 `screenshots/_vr_*` 缺 client/ 前缀（且重复一条），无法忽略 client/screenshots/ 下的临时图
- 修复：改 `client/screenshots/_vr_*` 与 `client/screenshots/_diff_*`；git rm --cached 移除 _vr_store_diff/_vr_version_base/_vr_version_cur 3 张
- 暂存禁入扫描（含 _vr_/_diff_/_current/steam/log/tmp/release 等全部模式）= **0**

## 终验矩阵
- [x] `npm test`：**50/50 PASS**
- [x] `npm run build`：PASS（5.46s）
- [x] `npm run visual:compare`：**26/26 全部一致 +「端口 5173 已归零」+ 退出码 0**（纯退出码无管道验证）+ netstat 复确认 0
- [x] 占用路径复验：exit 2
- [x] 版本守卫实际拦截能力实证（自测断言）
- [x] 暂存 197 文件，禁入项扫描 = 0（含 _vr_* 临时图）
- [x] **声明：仍未执行 npm run dist，未创建任何 Release / git commit**

已停止，等待审核（关卡 A）。

# v1.0 批次 5 关卡 A 前返修 IV（2026-09-05，第五次提交）

## P0-1 TIME_WAIT 误判根治
- 独立复现确认：taskkill 后端口无 LISTENING 进程、仅剩大量 TIME_WAIT，而 TCP connect 检测偶发被内核接受 → 误报「仍被占用」（exit 非零后端口才自行释放）
- 修复（visual-run.cjs）：端口判定从 TCP connect 改为 **netstat LISTENING 语义**——
  - `portListening()`：`netstat -ano | findstr ":5173" | findstr LISTENING` + 正则精确匹配 `:5173\s`（排除 :51730 前缀撞车）；**TIME_WAIT 不算占用**
  - 前置占用检查 / Vite 就绪等待 / finally 归零确认三处全部切换该语义
  - 保留 exit 3 能力：LISTENING 持续 30s 无法清除（每 2s 对监听 PID 补杀）→ 非零覆盖
- **三路径实证（LISTENING 语义）**：
  - 成功×2：连续两跑均 **26 个 ✅ / compare: 全部一致 / [visual-run] 端口 5173 已归零 / 纯退出码 0**；第二遍在 **20 个 TIME_WAIT 残留**期间执行（精确复现用户场景），LISTENING=0
  - 失败①：占位 LISTENING 进程 → **exit 2**
  - 失败②：LISTENING 持续 30s 无法清除 → exit 3（补杀机制保留，同前轮白盒实证）

## P0-2 workflow 打包关卡
- 确认缺陷：release.yml 同时配置 push/PR 触发与无条件 `npm run dist`——推送 main 即自动打包，绕过关卡 A
- 修复：拆分为双工作流
  - `.github/workflows/ci.yml`：push/PR/workflow_dispatch → install → `npm test` → build（**grep 确认无 npm run dist**）
  - `.github/workflows/package.yml`：**仅 workflow_dispatch** 手动触发 → install → test → build → package → artifact（grep 确认含 workflow_dispatch 与 dist）
- 原 release.yml 删除；RELEASE_CHECKLIST CI 条目同步更新为双工作流描述

## 过程修正
- 版本守卫扫描列表更新：release.yml → ci.yml + package.yml（旧文件已删，守卫 ENOENT 由测试自暴露）

## 终验矩阵
- [x] `npm test`：**50/50 PASS**
- [x] `npm run build`：PASS（3.97s）
- [x] `npm run visual:compare` 连续三跑：**26/26 全部一致 +「端口 5173 已归零」+ 退出码 0**（含 20 个 TIME_WAIT 残留场景）
- [x] 失败路径：占用 LISTENING → exit 2；LISTENING 无法清除 → exit 3（机制保留）
- [x] GitHub Actions：push/PR 不执行 npm run dist；打包仅手动触发
- [x] 暂存 198 文件，禁入项扫描 = 0
- [x] **声明：仍未执行 npm run dist，未创建任何 Release / git commit**

已停止，等待审核（关卡 A）。

# v1.0 批次 5 关卡 A 前返修 V（2026-09-19，第六次提交）

## P0-1 清理诊断与彻底性增强（visual-run.cjs 重写清理段）
- **三态区分**（不再混为一谈）：
  - 真实 LISTENING = 占用，可补杀（LISTENING 行解析 PID 为补杀目标）
  - TIME_WAIT = 连接释放延迟，不算占用，成功输出中明确标注计数（内核自然消退）
  - 释放延迟 = 进程已死但条目短暂残留 → 阶段二等待内核释放
- **两阶段清理**：阶段一（30s）杀 Vite 树 + 每 1s 对实际监听 PID 补杀（补杀目标 = LISTENING 行 PID，即实际监听进程，非父包装；记录并输出补杀/存活校验）；阶段二（60s）无活监听进程时等待内核自然释放
- **失败诊断输出**（用户要求）：LISTENING 计数、TIME_WAIT 计数、最后监听行（含地址与 PID）、监听 PID 列表、已尝试补杀记录、补杀后存活 PID
- 成功输出示例：`[visual-run] 端口 5173 已归零（TIME_WAIT=12 将由内核自然消退，不影响使用）`
- **只有实际观察到无 LISTENING 才返回 0**；真实 LISTENING 经两阶段仍存在 → exit 3

## 四路径实证
- 成功路径 ×3（分别在 TIME_WAIT=13 / 21 / 12 残留期间执行）：均 **26/26 全部一致 + 端口已归零 + 纯退出码 0**
- 占用路径：占位 LISTENING 进程 → 「端口已被占用」+ **监听行与 PID 诊断输出** → **exit 2**
- 清理失败路径（白盒等价：同一算法 + taskkill 失效模拟 + 60s 窗口）：占位 LISTENING 存活 → **44s 后 exit 3**，诊断输出完整：
  `❌ 端口 5173 仍存在真实监听（LISTENING=1，TIME_WAIT=0），无法清理` / 最后监听行 `TCP 127.0.0.1:5173 0.0.0.0:0 LISTENING 12936` / `监听 PID: 12936 | 已尝试补杀: 12936×30 | 存活: 12936`

## 环境处置
- 上轮 PATH 污染（实验残留）导致 shell 工具链不可用 → 显式恢复 PATH 后完成全部验证
- 根目录遗留实验日志（7 个 *.log）移至 `E:\wb-project\_quarantine_不玩游戏\root-logs\`（移动不删除）

## 终验矩阵
- [x] `npm test`：**50/50 PASS**
- [x] `npm run build`：PASS（1.93s）
- [x] `npm run visual:compare`：**26/26 全部一致 +「端口 5173 已归零」+ 纯退出码 0**
- [x] 5173/9223 LISTENING = 0，electron 进程 = 0
- [x] 失败路径：占用 → exit 2；真实 LISTENING 无法清理 → exit 3（均附诊断输出）
- [x] GitHub Actions：ci.yml（push/PR 无 dist）与 package.yml（仅 workflow_dispatch）分离
- [x] 暂存 **198 文件**，禁入项扫描 = 0
- [x] **声明：仍未执行 npm run dist，未创建任何 Release / git commit**

已停止，等待审核（关卡 A）。

---

# v1.0.0 关卡 B 发布门验收（2026-11-13）

> 本节修正上文「未执行 npm run dist / 未创建 git commit」的历史状态：打包已发生（2026-09-19 14:26），
> Git 基线已于 2026-11-13 建立。

## 基线
- 分支 `main`（原 master 更名，与 ci.yml 触发分支对齐）
- 提交 `4901112`：198 文件 / 15,556 行插入
- tag `v1.0.0`（annotated，本地未推送）
- 规格文档更名：`第三阶段_Steam高保真UI实施规格.md` → `第三阶段_高保真商店UI实施规格.md`

## 产物
| 文件 | 字节数 | SHA-256 |
|---|---|---|
| 不玩游戏 Setup 1.0.0.exe | 108,287,473 | 2422a83c7f2ad1da898e83b4729671f5d2d09641e824eae8f9b493f523314c7c |
| 不玩游戏-Portable-1.0.0.exe | 108,059,756 | 116229acf3cb5c207caf868d2d4938944524b52a855b85886cb682671c28b9e8 |

## 终验矩阵
- [x] `npm run build`：PASS（1.86s，入口 js 99.03 kB / gzip 33.54）
- [x] `npm test`：**50/50 PASS**（0 fail / 0 skipped）
- [x] `npm run visual:compare`：**26/26 ✅**，`compare: 全部一致`，**真实退出码 0**，端口 5173 归零
- [x] 打包版启动（win-unpacked）：4 进程，主窗口标题「不玩游戏」，0.5s 出窗
- [x] 优雅关闭（WM_CLOSE）：4 进程 → 0，≤0.5s；leveldb 写入时刻与关闭时刻一致（flush 生效）
- [x] 三条退出链路同源（源码证据）：`shell.js:78` 菜单退出复用 `nw-window-control` → `main.js:48` `win.close()`
- [x] 安装版：`/S` 安装退出码 0（7.9s）→ 启动 0.5s → 关闭归零 → `/S` 卸载 3.6s
- [x] 卸载残留：进程 0 / 注册表项 0 / 桌面与开始菜单快捷方式 0
- [x] 便携版：2.5s 出窗（自解压），关闭后进程 0、临时解压残留 0
- [x] 启动参数纪律：打包版无 `--no-sandbox` / `--remote-debugging-port`；
      GPU 禁用由 `main.js:8-10`（`appendSwitch` + `disableHardwareAcceleration`）代码级保障
- [x] 禁入项扫描：暂存 198 路径中 node_modules / dist / release / .workbuddy / 日志 / 临时图 = 0

## 未通过 / 未验证项
- [ ] Edge E2E 各批次场景回归：本次未复跑
- [ ] GitHub Actions 远端全绿：无远端仓库，从未运行
- [ ] 安装包 dev 依赖审计：未做 asar 逐项核对
- [ ] 仓库 Steam 相关表述：文件名已改，正文仍提及，公开前需自查

## 环境陷阱（复现必须遵守）
网关注入 `ELECTRON_RUN_AS_NODE=1` 与 `NODE_OPTIONS=--require .../node-language-shim.cjs` 时，
直接启动打包产物会被当作 Node 执行（`bad option: --disable-gpu`，退出码 9）。
验收前必须 `Remove-Item Env:ELECTRON_RUN_AS_NODE; Remove-Item Env:NODE_OPTIONS`。

## 判定
**CONCERNS** —— 质量门与真机验收全项 PASS；阻塞公开发布的仅剩：CI 从未远端运行、
安装包未与提交绑定（建议重打并刷新 SHA-256）、Steam 相关表述自查。
