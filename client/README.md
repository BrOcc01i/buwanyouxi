# 不玩游戏 — 桌面客户端

> ⚠️ **历史文档（批次 1~2 阶段存档，2026-08）**：本文写于客户端外壳与下载引擎阶段，
> 部分描述已过期（如「暂停/继续未实现」「重启后任务重置」——两者现均按规格 §7 实现：
> 支持暂停/继续/队列调度，活动任务重启后保留阶段与进度）。当前权威文档见仓库根目录
> [README.md](../README.md) 与 [不玩游戏_v1.0_产品需求与实施规格.md](../不玩游戏_v1.0_产品需求与实施规格.md)。
> 下文按历史原样保留，仅作阶段记录。

Steam 启发式深色桌面客户端，基于 **Electron + Vite + 原生 ES Module**（不使用 React/TypeScript）。
**第一阶段**：客户端外壳；**第二阶段**：本地游戏库 + 模拟下载 + 下载队列。

## 目录结构

```
client/
├── package.json          # 工程配置与脚本
├── vite.config.mjs       # Vite 配置（root: src，ESM）
├── .gitignore
├── electron/
│   ├── main.js           # 主进程（BrowserWindow + contextIsolation + before-quit flushStorageData）
│   ├── preload.js        # preload（contextBridge 暴露最小 API）
│   └── run.js            # 启动器：dev/prep 区分、端口检测、NODE_ENV 传递、清理子进程
└── src/
    ├── index.html        # renderer 入口（外壳静态结构）
    ├── main.js           # renderer 主逻辑（启动引擎 + 注册路由 + 启动）
    ├── styles.css        # 深色 Steam 启发样式
    ├── utils.js          # 格式化工具（fmtSize/fmtSpeed/fmtETA/stageLabel）
    ├── router.js         # 零依赖 hash 路由
    ├── state/
    │   ├── store.js          # 全局状态 + 订阅 + localStorage 持久化（nw_client_state_v1）
    │   └── download-engine.js # 下载队列 + 6 阶段状态机 + 加速
    ├── data/
    │   └── games.js      # 6 款虚构游戏（ES module）
    └── pages/
        ├── store.js      # 商店页（卡片网格 + 搜索过滤 + 状态徽标）
        ├── detail.js     # 详情页（按状态分支：获取/正在下载/已安装/启动）
        ├── library.js    # 我的库（installed 列表 + 下载中进度 + 启动占位）
        ├── downloads.js  # 下载页（活动任务 + 队列 + 完成列表 + 取消 + 空状态）
        └── settings.js   # 设置（读取 nwApp 运行信息）
```

原纯前端 demo 位于 `../虚拟下载体验/`，**保留不动**，可独立打开。

## 安全配置

- `contextIsolation: true`（渲染进程隔离 Node 上下文）
- `nodeIntegration: false`（renderer 不能直接 require）
- `sandbox: true`
- preload 通过 `contextBridge.exposeInMainWorld('nwApp', ...)` 仅暴露版本/平台等只读信息
- 生产模式不启用 `--no-sandbox`、`--remote-debugging-port`（开发模式保留便于验收）
- 生产模式启用 `--disable-gpu --disable-gpu-sandbox`：`--disable-gpu` 禁用硬件加速；`--disable-gpu-sandbox` 仅禁用 GPU 进程 sandbox（规避无 GPU/虚拟环境下 GPU 进程反复崩溃，**不是**全局 `--no-sandbox`，renderer 仍受 `sandbox:true` 保护）

## 安装与启动

```bash
cd client
npm install            # 安装 electron / vite / concurrently / wait-on / cross-env
npm run dev            # 开发模式：Vite dev server (127.0.0.1:5173) + Electron 窗口
```

> 国内环境需先设镜像下载 electron 二进制：`export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ && node node_modules/electron/install.js`

## 其他脚本

```bash
npm run build          # 构建产物到 dist/（vite build）
npm run preview        # 构建后以生产模式启动 Electron（加载 dist/index.html）
npm start              # 直接以生产模式启动（需先 build 出 dist）
```

> 生产模式（start / preview）加载 `dist/index.html`；开发模式（dev）加载 `http://127.0.0.1:5173`。
> 若 `npm run dev` 报「端口 127.0.0.1:5173 已被占用」，说明有残留的 vite/dev 实例，先关闭占用进程再重试（启动器会自动检测并给出清晰错误）。

## 开发加速（下载速度）

URL 查询参数 `?downloadScale=N` 缩放各阶段时长（仅影响时长，阶段顺序与业务结果不变）：

```
http://127.0.0.1:5173/?downloadScale=0.01#/store   # ~1.5s 完成完整流程
http://127.0.0.1:5173/?downloadScale=0.05#/store   # 截图下载中（约 5s）
http://127.0.0.1:5173/?downloadScale=1#/store      # 正常速度（默认）
```

> 默认值为 1（不加速）。该参数只用于开发/验收快速测试；生产环境构建不带此逻辑（构建后无 URL query）。

## 数据边界（第二阶段）

- **不接账号、后端、支付、网络 API。**
- **不创建真实游戏文件、不读写用户选择的安装目录。**
- 所有状态只保存在 renderer 的 `localStorage`（key `nw_client_state_v1`）。
- localStorage 不可用 / JSON 损坏 / 缺字段时降级为空状态，页面不崩溃。
- 刷新/重启后：installed 状态保留；进行中的下载任务重置为 QUEUED 重新开始（normalize 时处理）。
- 加速参数 `downloadScale` 只在 dev 模式有效（通过 URL query 读取）；生产构建不读取。

## 已完成

**第一阶段（客户端外壳）**

- Electron + Vite 工程骨架，主进程/renderer 分离
- 深色 Steam 启发外壳：左侧导航 + 顶部工具栏 + 主内容区
- 4 个导航（商店 / 我的库 / 下载 / 设置）真实可点击切换
- 商店页：6 款虚构游戏卡片网格 + 搜索过滤
- 详情占位页 / 设置页 nwApp 读取

**第二阶段（本地库 + 下载引擎）**

- 状态层：`state/store.js`（版本化 `nw_client_state_v1` 持久化、订阅、安全降级）+ `state/download-engine.js`（8 阶段 QUEUED→PREPARING→…→COMPLETED|CANCELLED、tick 100ms、加速 scale）
- 6 阶段全部实现：PREPARING（连接/节点文案轮换）、DOWNLOADING（进度单调 0~100%、速度 2~18 MB/s 波动、ETA 非负）、VERIFYING（99.0~99.9% 抖动→100%）、INSTALLING（子步骤、子进度条）、SHORTCUT（仅界面状态）、COMPLETED
- 取消：QUEUED / 活动 均可取消，库对应条目自动清理
- 队列：一次一个活动任务，其余排队，可取消排队任务
- 重复点击免费获取不创建重复任务
- 商店卡片状态徽标（已在库中 / 下载中 xx%）/ 详情页按状态分支 / 库页 installed 列表+启动占位+下载中进度
- 启动按钮只做本地反馈，不启动外部程序

## 未实现（后续阶段）

- 真实下载/安装流程
- 暂停/继续（可选加分项）
- Windows 安装包（electron-builder）
- GitHub Actions CI
- 视觉最终打磨
- 真实游戏目录读写
- 账号 / 支付 / 云同步

## 验证摘要

| 类别 | 状态 |
|------|------|
| `npm run build` | ✅ 15 modules，js 24.07 KB / 8.08 KB gzip |
| `npm run start` | ✅ 生产模式加载 dist；9223 不监听（无 --remote-debugging-port）；无 GPU fatal |
| `npm run preview` | ✅ build + 生产启动 |
| `npm run dev` 端口占用 | ✅ 报「端口 127.0.0.1:5173 已被占用」并 exit 1 |
| 端到端 20 项验收 | ✅ 全部通过（详见 overview 与 git log） |
| 截图 | `screenshots/{downloading,library,queue,store,detail,settings}.png` |
| 原 `虚拟下载体验/index.html` | ✅ 3 文件完整未动，可独立打开 |
