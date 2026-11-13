> 🗄️ **历史归档**：本文为开发过程阶段记录，其中的版本号等数字为当时状态，不代表当前发布版本（v1.0.0）。当前权威文档见仓库根目录 README.md 与 RELEASE_CHECKLIST.md。

# 「不玩游戏」虚拟下载体验 — 交付概要

> 项目一句话：纯前端 demo（v2.0 虚拟下载体验）+ Electron 桌面客户端（v0.2.0，含本地游戏库 + 模拟下载 + 下载队列）
> 状态：两个阶段均已交付，端到端验收全绿，原 demo 完整保留

## 阶段一：纯前端虚拟下载体验（v2.0，已交付）

> 零依赖、file:// 直开的单页应用，让用户 3~5 分钟完整体验一次虚拟游戏下载流程 + 揭示问卷
> 目录：`E:\wb-project\不玩游戏\虚拟下载体验\`（3 文件，41KB）

## 阶段二：Electron + Vite 桌面客户端（v0.2.0，已交付）

> 深色 Steam 启发客户端，原生 ES Module + contextIsolation，主进程/renderer 分离
> 目录：`E:\wb-project\不玩游戏\client\`（含验收截图 `client/screenshots/`）

**第一阶段（客户端外壳）：**
- Electron 主进程（`electron/main.js`）+ preload contextBridge（`electron/preload.js`）+ 启动器（`electron/run.js`）
- 深色外壳：左侧导航（商店/我的库/下载/设置）+ 顶部工具栏 + 主内容区
- hash 路由 4 页面真实可切换，零依赖（自写 `router.js`）
- 安全配置：`contextIsolation:true` + `nodeIntegration:false` + `sandbox:true`；生产模式不含 `--no-sandbox`、`--remote-debugging-port`

**第二阶段（本地库 + 下载引擎）：**
- 状态层：`src/state/store.js`（版本化 `nw_client_state_v1` 持久化 + 订阅 + 安全降级）+ `src/state/download-engine.js`（8 阶段状态机 + 队列调度 + tick + 加速）
- 6 阶段下载：PREPARING（文案轮换）→ DOWNLOADING（进度单调 0~100%、速度 2~18 MB/s 波动、ETA 非负）→ VERIFYING（99.0~99.9% 单调→100%）→ INSTALLING（子步骤+子进度）→ SHORTCUT（仅界面状态）→ COMPLETED（写入 installed + installedAt）
- 下载队列：一次一个活动任务，其余排队，排队/活动均可取消；重复获取不创建重复任务
- 商店卡片状态徽标 / 详情页按状态分支（获取/正在下载/已安装/启动）/ 库页 installed 列表 + 启动占位 + 下载中进度
- 启动按钮只做本地反馈，不启动外部程序
- 加速测试：`?downloadScale=0.01`（默认 1，仅影响时长、不改变阶段顺序）
- 端到端验收 20/20 通过（CDP 真实驱动 Electron 窗口），进度单调性采样通过（DOWNLOADING 61 样本、VERIFYING 8 样本均单调无倒退）
- 构建产物：`dist/index.html` 1.90 kB + `assets/index-*.css` 10.05 kB + `assets/index-*.js` 24.07 kB（gzip 8.08），15 个模块

**未实现（后续阶段）：** 真实游戏文件下载、暂停/继续、Windows 安装包、GitHub Actions CI、macOS/Linux 打包、大规模视觉重构、账号/支付/云同步。

## 交付物

代码位于 `虚拟下载体验/`，三文件、零依赖、file:// 直开：

| 文件 | 大小 | 职责 |
|------|------|------|
| `index.html` | 6.4 KB | 4 个页面容器 + LaunchOverlay + toast |
| `styles.css` | 12.0 KB | 浅色商店 UI + 深色沉浸下载页 + 移动端 375px + reduced-motion |
| `app.js` | 22.8 KB | 6 款虚构游戏 + hash 路由 + 6 状态机 + 埋点 + localStorage + 导出 |

合计 41 KB，无后端、无构建工具、无外部资源。

## 验证结果

| 项 | 结果 |
|----|------|
| 单元测试 UT1（状态机时长区间） | ✅ |
| 单元测试 UT2（进度单调 / VERIFYING 后 100%） | ✅ |
| 单元测试 UT3（速度突变不 NaN/负数） | ✅ |
| 单元测试 UT4（埋点 500 条裁头） | ✅ |
| 单元测试 UT5（localStorage 降级） | ✅ |
| 端到端 AC1 首页 6 卡随机 / 库条隐藏 | ✅ |
| 端到端 AC2 90s+ 全流程推进 / 速度波动 / 进度 100% | ✅ |
| 端到端 AC3 `bg_owned` 写入 | ✅ |
| 端到端 AC4 COMPLETED + 桌面图标落入 + 启动按钮显示 | ✅ |
| 端到端 AC5 LaunchOverlay → 任意键 → done | ✅ |
| 端到端 AC6 揭示文案 / 问卷提交 / `bg_survey` / 埋点 | ✅ |
| 端到端 AC7 再体验一个 + 库条显示 1 图标 | ✅ |
| 端到端 AC8 导出 `bg_events.json`（1517 字节 JSON Blob） | ✅ |
| 异常路径 直接访问 `play/` 无 session → 落详情页 | ✅ |
| 异常路径 直接访问 `done/` 无 owned → 回首页 | ✅ |
| 视觉 首页 6 卡渐变 / emoji / 体积梯度 | ✅ |
| 视觉 下载完成态（100% / 进度条 / 桌面图标） | ✅ |

## 实现要点与决策

1. **下载进度 vs 速度的物理矛盾调和** —— 规格书 10.8 要求体积 1200~48000MB、下载时长 60~100s、速度 2~18 MB/s 三者并存（48GB/80s 需 600MB/s，矛盾）。本实现**进度按时间推进**（progress += dt/duration），**显示速度独立随机游走**（2~18），**剩余时间由进度反推**（避免 NaN 与荒谬值）。既满足规格 2~18 波动可见，也满足 3~5 分钟总时长目标。
2. **桌面图标落图时机** —— 原本用 `if (dt < 50)` 触发，但 `setInterval(100ms)` 首回调必晚于 50ms 触发条件，图标永不落入。已修复：改为 `advance()` 进入 SHORTCUT 时**同步**调用 `addDesktopIcon` + `playChime`。
3. **localStorage 不可用**自动降级到内存态（隐私模式 / 配额满），流程不受影响，仅不持久化。
4. **`prefers-reduced-motion`** 完全移除落图位移与卡片悬浮动画，保留文字与进度。
5. **6 款游戏** 题材互不重复（治愈/恐怖/竞速/解谜/经营/动作），体积梯度 1.2~47GB，发行商全部虚构。

## 已知边界

- CDP 端到端 30 步全通过，但**`AC2 速度有波动` 的样本量偏小**（4~7 个 500ms 轮询样本）；实际 100ms tick 频率下波动密度更高，规格 2~18 区间由 UT3 单元测试 100% 覆盖。
- **`setInterval` 首回调延迟**这一类 bug 在端到端测试中才会暴露；状态机需以"进入下一阶段时立即执行阶段入口动作"为原则，避免依赖首次 tick 触发。

## 规格书外添加

仅两处极小实用化补丁，未引入任何规格外概念：
- 详情页 `<button class="btn-back">← 返回</button>`（规格只说"返回"，补充了视觉）
- 详情页 `+ 「已有 N 人获取」`（规格已要求 mock 数字，固定为每款常量）

## 跑起来

直接双击 `虚拟下载体验/index.html` 即可，或：

```bash
# 任意静态服务（仅 file:// 也行）
python -m http.server 8080 -d "虚拟下载体验"
# 访问 http://127.0.0.1:8080
```

预计使用时长：3~5 分钟/次（首次），二次访问因库条陈列约 1~2 分钟。

---

# 第三阶段 B1（2026-09-03）：Steam 高还原 UI —— 全局壳层 + 我的库首页

参考用户提供的 Steam 截图重做壳层与库首页，保留「不玩游戏」自有品牌，零 Steam 商标/素材/截图资源（全部 CSS/DOM 自绘）。

## 本批交付
- **顶部标题栏**：品牌 + 菜单区（查看/好友/游戏/帮助）+ 本地访客用户区 + 窗口控制（最小化/最大化/关闭，frameless + IPC，走 before-quit flush 落盘）
- **主导航**：后退/前进 + 商店/库/社区（社区为占位）+ 右侧下载/设置快捷入口
- **左侧游戏栏**：主页按钮、游戏和软件筛选、搜索框（复用 `#search-input`，商店过滤不受影响）、收藏夹(0)/未分类(6) 分组、游戏列表选中态、下载中 mini 进度条
- **中央库首页双模式**：主页（品牌横幅 + 最近游戏卡片）/ 选中游戏（主视觉 + 开始游戏/安装/免费获取 + 体积/评价/发行商 + 标签页 + 动态）
- **底部状态栏**：添加游戏 → 商店、管理下载 → 下载页、好友与聊天（占位 toast）

## 技术决策
- 新增 `src/state/ui.js`（库选中态，非持久化）与 `src/shell.js`（壳层装配），路由/store/download-engine/detail 逻辑零改动
- `electron/main.js` 改 `frame:false` + `nw-window-control` IPC；preload 增加白名单式 `windowControls()`
- 旧 `.sidebar` 样式保留未删（不再被 DOM 引用），避免误伤其他页面样式

## 验证
- `npm run build` 通过（js 30.79 kB / css 18.90 kB）
- CDP 验收 15/15 通过（1920×1080 固定视口），含 4 页无回归与窗口关闭进程归零
- 详见 `client/verification.md` 第三阶段 B1 段；截图 `client/screenshots/steam-library-{home,game}.png`

## 本批范围外（待后续批次）
详情页重构、下载页重构、Windows 打包、GitHub 发布。

---

# 第三阶段 B2（2026-09-03）：商店详情页 + 下载页重构

延续 B1 壳层，将详情页与下载页重做为 Steam 风格，仅改视图层，数据逻辑零改动。

## 本批交付
- **详情页**：主视觉横幅（渐变 + emoji + 名称/hook）+「关于这款游戏」+ 标签 + 右侧购买栏（免费获取/开始游戏/查看进度三分支）+ 事实清单（评价/已有获取/发行商/体积）。原 startDownload 分支逻辑原样保留。
- **下载页**：统计头（网络/峰值/磁盘使用量，含每 tick 轻量更新与会话峰值）+「即将进行」区（活动任务：阶段行 + 主进度条 + INSTALLING 子步骤 + 取消；排队行）+「已完成/已取消」区 + 空态「队列中无下载」。保留 struct 对比 + updateLive 双层刷新模式与取消/查看逻辑。

## 验证
- build 通过（js 32.78 kB / css 24.11 kB）
- CDP 验收 14/14（1920×1080），获取→下载→取消全流程、三页回归、✕ 关闭进程归零
- 详见 `client/verification.md` B2 段；截图 `client/screenshots/steam-detail.png`、`steam-downloads.png`

## 本批范围外
设置页重构（保持原样可用）、Windows 打包、GitHub 发布。

---

# 第三阶段 B3（2026-09-03）：设置页重构 + 下载页空态 bug 修复

## 本批交付
- **设置页 Steam 风格**：左侧分类列表（系统选中，账户/界面/下载/云服务为演示占位 toast）+ 右侧内容面板（系统信息 6 项 + 数据区）
- **清除本地数据**：两步确认（3 秒超时自动退出确认态），复用既有 resetState()；库内计数行随 store 订阅实时刷新
- **顺手修复 B2 遗留 bug**：downloads.js `lastStruct` 初始 `''` 与空队列 struct 相同导致空队列时首渲染被跳过（视图停留上一页）；初始哨兵改 `null`。B3 重置流程覆盖到该边界并复验通过

## 验证
- build 通过；CDP 12/12（1920×1080）；重置→三页空态回归；✕ 关闭进程归零
- 截图 `client/screenshots/steam-settings.png`；详见 `client/verification.md` B3 段

## 第三阶段 UI 重构（B1+B2+B3）至此全部完成
壳层、库、商店详情、下载、设置五个页面均为 Steam 风格自有品牌实现。剩余：Windows 打包、GitHub 发布（需用户明确批准后进行）。

---

# 第三阶段 B4（2026-09-03）：Windows 打包

## 本批交付
- 打包链路：electron-builder 26.15.3，npm run dist（vite build + electron-builder --win）；GitHub 直连下载二进制超时，切 npmmirror 镜像解决
- 产物（client/release/）：NSIS 安装包「不玩游戏 Setup 0.3.0.exe」（非一键、可选目录、桌面快捷方式）+ Portable「不玩游戏-Portable-0.3.0.exe」+ win-unpacked
- 品牌图标：自绘"不"字渐变 ico（PIL + 微软雅黑，零第三方素材）
- 代码级 GPU 保障：main.js 增加 disable-gpu-sandbox（打包产物不经过 run.js）；版本统一 0.3.0

## 验证
- win-unpacked 烟测：4 进程 + 主窗口创建、优雅关闭 4→0、localStorage 落盘目录创建
- 识别网关 ELECTRON_RUN_AS_NODE=1 干扰：打包产物在网关环境秒退，清除变量后正常（真实桌面无此问题）
- NSIS 安装包未实际安装（避免改动本机系统）

## 剩余
GitHub 发布（需用户批准 + 提供仓库/账号方式；当前 GitHub 连接器未连接）。

## C1：库页高保真细化（2026-09-03 深夜）

- 规格先行：新建 第三阶段_Steam高保真UI实施规格.md（26 项差距盘点 + D1-D5 决策点），用户拍板 D1-D5 全 A、砍推荐问卷卡、P2 纳入 3 项后开工
- C1 交付：库选中页对齐截图 1/2 —— 分段按钮(开始游戏/安装 + 下拉菜单)、元数据行(需要的空间/最后运行日期/游戏时间)、hero 圆形按钮组(⚙/ⓘ/♡)、五页签(含客服)、动态分享框+时间轴、玩过的好友面板(虚拟好友首字色块头像)；下载中态 = 真暂停/恢复 + 内联进度 + hero 底部进度条；左栏条目「名称 - N%」后缀；状态栏下载 mini(图标+名称+进度+%)；左栏收藏夹真实分组
- 数据层扩展（按决策）：games.js +4 虚拟元数据字段；friends.js 新增；store.js favorites 持久化；download-engine PAUSED 态(暂停清计时/恢复按 progress 折算续跑/重启重排)
- 另修复 run.js：清除网关注入的 HTTP(S)_PROXY(会致 Electron 页面导航挂死) + 设 NO_PROXY
- 环境异常：本会话 Electron renderer 被宿主反复杀死(reason=killed)，Edge headless 正常 → C1 验收改用 Edge(同内核)完成，34 项断言全绿；Electron 实机待真实桌面复验
- 停在审核点，待用户过 C1 后进 C2(下载页高保真)

## 批次 1：状态基础与回归保护（2026-09-05 交付）

- 基线切换：《不玩游戏_v1.0_产品需求与实施规格.md》为唯一需求基线，按 §12 五批推进；旧 C1/C2/C3 作废（C2 遗留验收 25/25 收尾后关闭）
- 交付：store.js 升级 v2 状态模型（profile/survey/events/settings 四项/library.favorite+launchCount/任务 paused+resumeStage）+ v1→v2 迁移（不清老数据、PAUSED 旧态正确转换）+ 12 个业务 API（uninstallGame/updateSettings/recordLaunch/unlockBadge/submitSurvey/buildExportPayload/exportLocalData/resetAllData/moveDownload/clearFinishedDownloads 等）
- 语义修正：重启恢复保留活动任务阶段/进度/耗时（原实现违规清零）；恢复不抢占活动任务进队首等待；暂停任务重启保持暂停
- 页面接线：库页真卸载（两步确认）、设置页导出+重置、shell 收藏唯一真源、下载页 paused 渲染
- 测试：tests/state.test.js 18/18 PASS（node:test + localStorage shim）；build 通过
- QA 代行回归 19/19（严过关因配额 429 缺席，项目总监代行并如实声明）；双尺寸截图各一张
- 已知环境坑（本会话验证环境）：Edge headless 需 --no-sandbox 否则数十秒内死；沙箱每条命令结束回收其内启动的进程；迁移后活动任务的引擎 tick persist 会覆盖损坏数据类测试写入
- 停在批次 1 审核点；下一步批次 2 核心体验闭环（欢迎弹窗/安装确认/伪启动/揭示/问卷/徽章/个人卡）
