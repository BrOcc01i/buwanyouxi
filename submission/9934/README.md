# 9934 上架材料包

面向 [9934](https://9934.zrainbow1257.com/) 的作品投稿。依据是站点公开的 Agent 契约，不是帖子里截图的推测：

- `GET /.well-known/agent-descriptions` → `agent-description.json`
- `GET /api/v1/capabilities`（限额）
- `GET /api/openapi.json`（字段与枚举）

## 当前状态

| 项 | 状态 |
|---|---|
| 可玩网页版 | ✅ 已发布 <https://wbapp-2dudtnqv6wzny0cakya40o.app.workbuddy.host/?sharecode=MTHIS5RECT> |
| 浏览器实测 | ✅ 5 个路由全渲染，0 个 ≥400 响应，0 破图 |
| 封面 | ✅ `media/01-cover.webp`（133 KB） |
| 展示图 6 张 | ✅ `media/02…07`，最大 136 KB（限额 1,400,000 B） |
| 正文文案 | ✅ `payload.json` |
| 执行脚本 | ✅ `submit.mjs`（`--dry` 校验通过，仅 `source_url` 未定稿） |
| 作者令牌 | ❌ 待本人签发 |
| `source_url` | ❌ 待定（建议 GitHub 仓库） |

## 站点硬性约束（摘自公开契约）

- `url` 必须是**作者已部署、可实际游玩**的 HTTPS 地址；站方明确「不接收或运行游戏程序、部署包或 Agent 代码」——exe 不能作为上架内容，必须走网页版。
- 必填：`resource_kind=game`、`title`(1–60)、`description`(8–1000)、`url`、`source_url`、`author_name`(≤80)、`role`、`category`、`rights=true`、`cover_media_id`。
- `category` 只能取：休闲 / 益智 / 冒险 / 策略 / 经营 / 街机 / 竞速 / 双人。
- 媒体：单张 ≤ 1,400,000 B；`display_media_ids` ≤ 6；动图 ≤120 帧、≤40M 解码像素、≤15 秒。
- 每个 POST 必带 `Idempotency-Key`（`[A-Za-z0-9_.:-]{16,128}`）。
- 审核为人工；普通 approve 只做收录，要作品管理权须另做 ownership claim（在原站部署路径发布 `proof_document`）。

## 三项阻塞

1. **作者令牌**：本人用 Linux DO 登录 9934 → `/index.html#/account/agents` → 同意三份协议 → 签发 `author_agent`，scope 至少 `submissions:read`、`submissions:write`、`media:write`。令牌只放环境变量 `NW9934_TOKEN`，不进仓库。
2. **`source_url`**：发布来源或版本说明。建议建公开 GitHub 仓库（同时可跑通 CI、建 Release 放安装包）；改 `payload.json` 后重跑 `node submit.mjs --dry` 应无报错。
3. **协议**：站方要求显式同意「用户协议 / 隐私说明 / 社区公约」，签授权前请自行确认。

## 执行

```bash
cd submission/9934

# 1) 本地校验（不上网）
node submit.mjs --dry

# 2) 上传封面+6 张展示图 → 创建草稿，结果写 draft-result.json
NW9934_TOKEN=... node submit.mjs

# 3) 人工核对草稿后，按精确 revision/content_hash 送审
NW9934_TOKEN=... node submit.mjs --review
```

`submit.mjs` 不打印、不落盘令牌；素材哈希与体积见 `manifest.json`。

## 素材来源

- `01/02/04/05/06/07`：`client/tests/visual-baseline/*_1920x1080.png`（与当前构建像素级一致，`npm run visual:compare` 26/26 通过）
- `03`：临时脚本按「下载中」状态实拍 1920×1080（基线里的下载页是暂停态，不适合做展示）
- `raw/` 保留原始 PNG，便于换尺寸重出

## 若改用 GitHub Pages

把 `web-publish/` 推到仓库 `docs/` 并开启 Pages，`url` 换成 `https://<user>.github.io/<repo>/` 更干净——当前分享链接带 `?sharecode=`，无码访问会被拦成「链接不完整」。
