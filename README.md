# 不玩游戏（Bu Wan You Xi）

> 一个完全离线的虚构游戏客户端体验。像使用游戏平台一样浏览、获取和收藏虚构游戏——但不会连接游戏服务器、不会下载真实文件、不会启动外部程序。

**Bu Wan You Xi** ("Not Playing Games") is a fully offline fictional game-client experience built with Electron. Browse, "download" and collect fictional games — no game servers, no real downloads, no accounts, no payments.

![平台](https://img.shields.io/badge/platform-Windows-blue) ![许可](https://img.shields.io/badge/license-MIT-green) ![版本](https://img.shields.io/badge/version-1.0.0-orange)

## 项目定位

- **它是什么**：一个本地运行的 Windows 桌面客户端，完整模拟游戏平台的浏览 → 获取 → 下载 → 安装 → 启动 → 收藏体验。所有游戏、评分、获取人数均为本地虚构常量。
- **它不是什么**：不是游戏平台，不含任何真实商店、社区、账号或支付功能；不隶属、不模仿、不代表任何第三方游戏平台的商标或素材。

## 主要功能

- **商店**：焦点推荐、六款原创素材虚构游戏、搜索、按状态显示（免费获取 / 安装 / 下载中 N% / 已在库中）
- **游戏库**：库主页（最近游戏 / 接下来畅玩 / 徽章）、收藏夹、筛选排序、卸载（保留统计）
- **下载管理**：暂停 / 继续 / 取消 / 队列上移下移 / 清除记录，同一时间单任务调度，重启后进度恢复
- **首次体验闭环**：欢迎弹窗 → 首次下载徽章 → 3~4 秒伪启动画面 → 首次揭示 → 体验问卷与五种拥有者类型结果卡
- **本地个人卡**：无账号体系，右上角「本地访客」查看本地统计与徽章
- **设置**：减少动态效果、界面声音、下载完成通知、默认启动页面、导出 / 清除全部本地数据
- **明确禁用入口**：社区、好友、DLC 等未实现入口均以 `aria-disabled` 禁用并提示「离线体验不可用」

## 截图

见 `client/screenshots/`（1920×1080 与 1280×720 双尺寸验收截图）。

## 功能边界（重要）

- ❌ 不连接任何游戏服务器或第三方服务
- ❌ 不下载真实文件（下载进度为本地模拟）
- ❌ 不启动外部程序（「开始游戏」为 3~4 秒伪启动画面）
- ❌ 无账号体系、无后端、无支付、无广告
- ❌ 不实现自动更新
- ✅ 全部数据仅保存在本机（渲染进程 localStorage，键 `nw_client_state_v1`）

## 隐私说明

见 [PRIVACY.md](PRIVACY.md)。一句话版本：**不收集、不上传、不共享任何数据**；所有状态仅存于本机，清除数据功能可一键彻底删除。

## 运行方式（开发）

```bash
cd client
npm install
npm run dev        # vite dev server + electron 开发模式
```

## 构建方式（生产）

```bash
cd client
npm install
npm run build      # 生产构建（dist/）
npm run preview    # 生产构建 + electron 加载 dist
npm run dist       # electron-builder 打包 Windows 安装版 + 便携版（release/）
```

## 下载与校验（v1.0.0）

| 文件 | 字节数 | SHA-256 |
|---|---|---|
| `不玩游戏 Setup 1.0.0.exe` | 108,287,473 | `2422a83c7f2ad1da898e83b4729671f5d2d09641e824eae8f9b493f523314c7c` |
| `不玩游戏-Portable-1.0.0.exe` | 108,059,756 | `116229acf3cb5c207caf868d2d4938944524b52a855b85886cb682671c28b9e8` |

校验方法（Windows 命令行）：

```cmd
certutil -hashfile "不玩游戏 Setup 1.0.0.exe" SHA256
```

版本号三处一致：`package.json` 1.0.0 / 应用内「关于」与设置页 1.0.0（`APP_VERSION`）/ Git tag `v1.0.0`。

## Windows SmartScreen 提示

本项目的 Windows 安装包与便携版**未进行代码签名**（首版不购买签名证书）。首次运行时，Windows SmartScreen 可能弹出「Windows 已保护你的电脑」提示——这是所有未签名应用的正常现象。请点击「更多信息」→「仍要运行」。可通过页面下方 SHA-256 校验值核对文件完整性。

## 非隶属声明

本项目为独立原创作品。「不玩游戏」及本项目中的全部游戏名称、图像素材、文案均为原创内容，与 Valve Corporation、Steam 或任何其他游戏平台、发行商 **不存在任何隶属、合作、授权或认可关系**。本项目不使用任何第三方平台的商标、标识或受版权保护的素材。

## 许可证

[MIT](LICENSE)

## 仓库范围

- `client/` —— 正式 Electron 客户端（源码 + 测试 + 原创素材）
- `虚拟下载体验/` —— 历史网页原型（v1 演示，保留存档）
- `*.md` —— 产品需求、各批次实施规格与交付文档

`node_modules/`、`dist/`、`release/`、临时验证目录与参考图片不入库（见 `.gitignore`）。
