# A 批素材 Prompt Pack · 铁轨尽头 / 灰线 / 静帧 / 投币洗衣房

> 版本 v1.0 ｜ 2026-09-05 ｜ 林绘澄（美术 / 技术美术）
> 范围：A 批 4 款 × 8 素材位 = 32 项规格。**本文件只产规格，不产图片、不改 `client/` 代码。**
> 上游依据：`design/catalog/游戏目录规格.md`（第 7/9/14/16 条）、`client/src/assets/SOURCES.md`、`client/src/assets/games/` 现有 6 款实拍素材、`client/src/styles.css` 中的裁切规则。

---

## 0. 开工前必须先对齐的一件事：尺寸对不上

任务简报给的尺寸与现有 6 款的**运行时尺寸**不一致，且不一致的方向会直接破坏并排一致性。逐项核对（实际尺寸由 webp 文件头解析得出，非文档抄录）：

| 素材 | 简报要求 | 现有 6 款实际 | 本规格采用 | 判断 |
|---|---|---|---|---|
| `icon.webp` | 512×512 | **64×64** | 母版 512×512 → 交付 **64×64** | 简报数字正好当母版，交付按运行时 |
| `portrait.webp` | 600×900 | 600×900 | 一致 | ✅ |
| `header.webp` | 1920×620 | **920×430** | 母版 1840×860 → 交付 **920×430** | ⚠️ 简报疑似把 `header` 与 `library-hero` 的尺寸串了 |
| `library-hero.webp` | 1920×1080 | **1920×620** | 母版 2560×826 → 交付 **1920×620** | ⚠️ 1080 与 620 差 74% 高度，混用会裁掉主体 |
| `screenshot-01..03` | 1920×1080 | **1280×720** | 母版 1920×1080 → 交付 **1280×720** | ✅ 同为 16:9，简报数字直接当母版最省事 |
| `logo.svg` | 透明底 | `viewBox 0 0 480 120` | 一致 | ✅ |

**为什么不能按简报的直接交付**：`header` 若给 1920×620（3.1:1）而容器按 2.14:1 的 `object-fit: cover` 裁切，纵向会丢掉 31%；**新 4 款与老 6 款并排时会出现「构图被压扁」的视觉断层**，这是并排测试里最刺眼的一类不同源。同理 `library-hero` 若给 1080 高（1.78:1），在 1920×620 的容器里会丢 43% 画面高度 —— 主体几乎必被切。

> **待 team-lead 与用户确认**：以上「母版大、交付按运行时」的方案是否通过。若不通过、坚持按简报直接交付，则需同步改 `styles.css` 里 6 处容器比例，并把现有 6 款一起重裁 —— 工作量与风险都远大于按运行时交付。

---

## 1. 统一视觉语言（18 款共享，本节优先于任何单款描述）

### 1.1 四条核心规则

**规则一 · 单一主光，暗部偏冷**
每张图只有一个可指认的主光源（太阳 / 灯 / 荧光管），方位固定在高位 30°–45°，横向落在左或右 1/3；背光侧不得压成中性黑，必须偏入 `#1b2838` 这一族的冷蓝/冷青。第二光源只允许是「环境补光」，亮度不超过主光的 25%。

**规则二 · 明度双峰，单一强调色**
画面底色只允许落在**两档**：暗场 L 0.10–0.32，亮场 L 0.62–0.75（仅治愈系，如云朵烘焙坊）。**L 0.35–0.60 的中间调底色一律禁入** —— 这是「业余感」的最大来源。全画面只允许一个强调色系，占像素 8–15%，饱和度 S ≥ 0.45；其余区域饱和度压在 0.40 以下。

**规则三 · 主体偏置，留一块 25% 静区**
主体的视觉重心横向落在 55%–70%（横画幅）或纵向 40%–60%（竖画幅）；画面必须存在一块**连续、低细节、面积 ≥25%** 的静区，用来承载 UI 叠字。静区位置由画幅决定（见 §1.2），不是随手留白。

**规则四 · 手绘成像，画面内无字**
质感统一为「有笔触的数字绘画」：可见的干刷边缘、细线勾边、纸面颗粒，允许局部失焦。禁止照片感、禁止 3D 渲染的塑料高光、禁止纯矢量平涂。画面内**任何位置不得出现可读文字、字母、数字、伪文字笔画**。

### 1.2 为什么偏偏是这四条

这四条不是审美偏好，是从「18 张图会被并排看」这个事实反推出来的四个**最强的同源线索**，按人眼识别顺序排列：

1. **光照是观众第一眼读的东西，比题材更早被识别。** 18 张图题材跨度极大（西部、军事、抽象风景、室内经营），但只要有同一个光源高度 + 同一个暗部色温，大脑会把它们归档为「同一个渲染管线出来的」。这是唯一能跨题材生效的统一手段。
2. **明度骨架决定缩略图是否成排。** 商店首页是 6 张 64px 的小图标、之后是 140px 高的竖版卡、再是 300px 高的焦点横幅 —— 所有比较都发生在**极小尺寸**上。小尺寸下细节全丢，只剩明度对比和色块关系。双峰明度让每张缩略图都是「深底 + 一块亮」，成排时节奏一致；一旦混入中间调，那一张会立刻显灰、显脏。这也是为什么必须**禁掉 0.35–0.60 区间**，而不是简单要求「整体偏暗」。
3. **静区是功能需求，不是留白美学。** 代码事实：`.storehero__shade` 是左深右浅的水平渐变（0.82 → 0.35 → 0.05），`.storehero__text` 固定在左下，`max-width: 60%`；`.storedetail__hero-shade` 是下深上浅的垂直渐变，logo 压在左下。也就是说**左侧与下方的画面会被吃掉 60–78% 的亮度**。把这套约束提到 18 款共享层，好处是：所有图的「暗」都长在同一个位置，用户滑动时不会看到明暗在跳。
4. **「成像方式」是最后一道防伪。** 假素材库最容易露馅的地方不是画得不好，而是**同一页里混了照片、3D 渲染、扁平矢量、AI 油腻高光四种介质**。把介质锁死为「手绘 + 允许颗粒」，18 款就自动被读成「同一家美术团队做的」。

补充：这四条也**顺手修掉了现有素材的两处不一致** —— ① 云朵烘焙坊（mean L 0.73）是唯一亮场，本批刻意不复制亮场路线，让 A 批全部落在暗场一档；② 第七走廊暗部 L<0.06 的像素占到 53%–77%（全部 42 张里最差），属于死黑，规则二设了 35% 的上限来防止复制这个毛病。

### 1.3 数值契约（可脚本校验）

| 指标 | 目标区间 | 依据 |
|---|---|---|
| 画面平均明度 mean L | **0.16–0.30**（本批 4 款全暗场） | 现有 5 款暗场为 0.048–0.296 |
| 画面平均饱和度 mean S | **0.15–0.40** | 现有 42 张为 0.154–0.519，中位约 0.30 |
| 底色 L | 暗档 0.10–0.32 ／ 亮档 0.62–0.75 | 禁用 0.35–0.60 |
| 强调色像素占比 | 8–15% | 低于 8% 无记忆点，高于 15% 变霓虹 |
| 强调色饱和度 S | ≥ 0.45 | — |
| 死黑像素（L<0.06） | ≤ 35% | 现有最差样本 77% |
| 高光溢出（L>0.94） | ≤ 1% | 现有 42 张均值≈0，保持 |
| 主光高度角 | 30°–45° | 规避「顶光死板」与「平光无体积」 |
| 主体重心（横画幅） | 横向 55%–70% | 让开左侧 UI 叠字区 |
| 主体重心（竖画幅） | 纵向 40%–60% | 见 §5 裁切说明 |
| 静区面积 | ≥ 25%，连续 | — |
| 色相偏移 | 相对锚点 ±15° | — |

校验脚本（素材落位后跑一遍，输出逐张 mean L / mean S / 死黑占比）：

```bash
# 依赖 ffmpeg，无需 PIL。用法：在项目根目录执行
python - <<'EOF'
import subprocess, glob, colorsys, statistics as st
for p in sorted(glob.glob('client/src/assets/games/*/*.webp')):
    raw = subprocess.run(['ffmpeg','-v','quiet','-i',p,'-vf','scale=48:48',
                          '-f','rawvideo','-pix_fmt','rgb24','-'],
                         capture_output=True).stdout
    n = len(raw)//3; L=[]; S=[]; dark=0
    for i in range(n):
        r,g,b = (raw[3*i]/255, raw[3*i+1]/255, raw[3*i+2]/255)
        _,l,s = colorsys.rgb_to_hls(r,g,b)
        L.append(l); S.append(s); dark += l < 0.06
    Lm, Sm, dk = st.mean(L), st.mean(S), 100*dark/n
    flag = 'OK ' if (0.10 <= Lm <= 0.32 and Sm <= 0.42 and dk <= 35) else 'FAIL'
    print(f'{flag} {p.split("games/")[1]:<34} L={Lm:.3f} S={Sm:.3f} dark={dk:.1f}%')
EOF
```

### 1.4 Logo 排版规范（直接照抄现有 6 款的构型，勿改参数）

现有 6 个 `logo.svg` 是**手写矢量**，不是图生图产物。全部字标必须严格同构，否则一排 logo 会立刻散架：

| 项 | 参数 |
|---|---|
| viewBox | `0 0 480 120`（固定） |
| 中文主标 | `x=14 y=72`，`font-size=58`，`font-weight=900`，`letter-spacing=4` |
| 主标填充 | 135° 线性渐变，浅端 → 深端（浅端取该款强调色提亮 10–15%，深端取暗部色） |
| 主标描边 | `stroke=rgba(0,0,0,.35)`，`stroke-width=1.5`，`paint-order:stroke` |
| 英文副标 | `x=16 y=104`，`font-size=19`，`font-weight=600`，`letter-spacing=7`，全大写，纯色（不渐变，取该款中间调） |
| 字体栈 | `'Microsoft YaHei','PingFang SC',sans-serif` |
| 背景 | 完全透明；不加外发光（CSS 已用 `drop-shadow` 补，重复会糊） |
| 可读下限 | CSS 限制 `max-width: 320px`，即屏幕上最小有效字高约 38px —— 主标不得超过 6 个汉字 |

英文副标一律用**项目自造的发行商/题材词**，不得使用任何真实作品名或其变体。

### 1.5 全批禁用清单（写进每条 prompt 的负面里）

写实照片感 · 3D 渲染塑料高光 · 高饱和赛博霓虹（紫/品红电光）· 彩虹渐变 · 画面内任何可读文字 · 真实作品标志 / 角色 / 厂商水印 · 其他游戏 UI 截图感（HUD、准星、血条、边框）· 多格拼贴 / 分屏 · 畸变肢体 / 多指 / 融脸 · 低分辨率噪点 / JPEG 块 · 过曝高光 · 死黑阴影。

---

## 2. 逐款视觉锚点（4 节，各 ≤10 行）

### 2.1 `rail-end` 铁轨尽头 · 西部开放世界

- **色板**：`#2a1f18` 沥青棕黑（底）｜`#c98a4b` 晒褪的黄铜／尘土（强调）｜`#7a3b2e` 锈红（中间调）｜`#d9c3a0` 骨纸／赏金告示（亮）｜`#4a5a5e` 远景冷天（暗部救援）
- **主光源**：右侧低角日光，**8°–12°** 贴地平线（四款里最低的光位），长影向左拖
- **构图重心**：横向 62%–68%；左侧 40% 交给「铁轨消失点 + 空天」
- **材质**：晒裂的皮革、氧化铁、碱土浮尘、干木纹；全画面唯一允许的高光是**轨面那一条**，其余一律哑光
- **差异化**：四款中唯一有**自然日光**的；唯一强调色是黄铜/金而非电光；唯一允许出现**远景人形**（只做剪影，不辨五官）
- **禁**：现代枪械、电线杆、柏油路、品红夕阳、干净新衣、任何带字的告示（一律留白纸）

### 2.2 `grey-line` 灰线 · 军事 FPS 单人战役

- **色板**：`#1e2422` 石墨（底）｜`#b8622f` 锈橙／尾灯（强调，占比压到 8%）｜`#3d4a44` 橄榄绿（中间调）｜`#8a9488` 雾绿灰（亮）｜`#0d1113` 深黑（暗部，但不得死黑）
- **主光源**：**无直射光**。阴天顶光 + 全天空漫射，光比 1:2 以内，靠雾与湿面反光做体积
- **构图重心**：横向 60%–70%，主体高度压低（画面下 1/3）；左上大面积雾做静区
- **材质**：湿帆布、泥浆飞溅、哑光军械漆、雨膜、混凝土
- **差异化**：四款中**唯一由天气而非灯具照亮的**；饱和度最低（目标 mean S ≈ 0.18）；唯一强调色是「热的小点」而非「亮的面」
- **禁**：血腥伤口、英雄姿态、授勋仪式、任何国旗/部队徽记、现代都市天际线、晴天蓝天、游戏 HUD

### 2.3 `stillframe` 静帧 · 动态壁纸工具（非游戏）

- **色板**：`#0e1a22` 暮蓝黑（底）｜`#2f5560` 板岩青（中间调）｜`#8fb8b3` 淡雾青（亮）｜`#d8b98a` 最后一道天光（强调）｜`#c96f4d` 远岸余烬（极小面积热色）
- **主光源**：极远的低角度天光 / 不可指认的漫射光源；**没有灯具、没有硬阴影**
- **构图重心**：横向 50%–60%（四款中最靠中间的）；地平线固定在 **38%** 高度；静区就是天空本身
- **材质**：雾、水膜、砂岩、空气颗粒；笔触最软，边缘最虚，允许 90% 画面无实体
- **差异化**：**唯一没有主体的一款**——「被看的东西」是空气与光；唯一刻意让 90% 画面留空的；唯一不表现「事件」的
- **禁**：人物、动物、建筑、船只、飞鸟、清晰倒影里的人影、桌面图标/任务栏/窗口边框、HDR 过饱和、暴风巨浪大片感

### 2.4 `coin-laundry` 投币洗衣房 · 经营模拟

- **色板**：`#20211f` 夜墙灰（底）｜`#e8955a` 琥珀钨丝（强调）｜`#dfe9ea` 冷白荧光（第二光，非强调）｜`#7fb3c8` 洗衣粉青（点缀 ≤3%）｜`#4a4f4c` 旧瓷砖（中间调）
- **主光源**：顶部荧光管（冷、硬、垂直向下）+ 柜台一盏琥珀吊灯（暖、软）；冷暖在**同一个画面里对撞**，这是它区别于 rail-end 的关键
- **构图重心**：横向 62%–70%（洗衣机列在右）；左侧留给「暗墙 + 一台公用电话」
- **材质**：湿亚麻地胶反光、旧塑料筐、铬边起雾、瓷砖缝发黑、铝箔棉纸
- **差异化**：四款中唯一**人工光源主导**的；唯一同时用冷+暖两色温；唯一不依靠远景空间纵深（最「贴脸」的一款）
- **禁**：霓虹灯管、可读招牌/洗剂包装商标、复古美式餐厅陈设、卡通化、崭新机器、性化处理

---

## 3. 逐素材 Prompt（32 条）

**通用约定**
- 每条英文 prompt 可直接投喂，**已内置**「无字」约束；负面词见 §3 各款专属 + §4 通用清单，两条一起用。
- 构图百分比均指**母版**坐标；交付裁切规则见 §5。
- `logo.svg` **不用图像模型**（见 §1.4、§3.5）：模型生成文字必然产生伪字形，直接违反规则四。

### 3.1 `rail-end` 铁轨尽头

**① icon.webp** — 母版 512×512，交付 64×64
> Minimal game icon emblem: a single iron rail spur ending abruptly in cracked dry earth, viewed from high above, deep umber ground, one brass rim-light running along the rail head, flat painterly shading, bold silhouette, centered, generous margin, no text.
- 中文说明：一枚「铁轨到此为止」的俯视徽记，强调轨面那一道黄铜反光，让 64px 下也能读成「一条线断了」。
- 构图：轨道斜穿画面，占 55%–65% 面积；四周留 ≥18% 空边；主体完全居中（图标会被裁成正方形显示，不要靠边）。
- 专属负面：modern vehicles, paved road, power lines, magenta sunset, cartoon mascot, glossy plastic, readable poster text

**② portrait.webp** — 母版 1200×1800，交付 600×900
> Vertical western key art: a dust-caked steam locomotive stalled on unfinished track at dusk, low amber sun behind it throwing long shadows toward the viewer, pale empty sky filling the upper quarter, drifting alkali dust, muted earth palette, painterly oil illustration, no text.
- 中文说明：一辆锈死的蒸汽机车停在没修完的铁轨上 —— 「晚点三十年」就是这张脸。
- 构图：机车上半部在**纵向 42%–60%**（卡面可见区），顶部 25% 留纯空天，底部 15% 留给暗地面；机车宽度不超过画面 55%，不要顶到左右边。
- 专属负面：cowboy hat close-up, revolver in hand, galloping horse, cinematic lens flare, orange-teal grade, sandstorm whiteout

**③ header.webp** — 母版 1840×860，交付 920×430
> Wide cinematic banner: rusted rails running in from lower left toward a bleached horizon at the right third, one small rider silhouette facing away, low sun glow at upper right, the left half a calm dark dust haze with no detail, painterly, muted brown and dull brass, no text.
- 中文说明：焦点横幅。左边整块暗尘留给标题与简介叠字，右边放「一个人 + 一条没尽头的轨」。
- 构图：**左侧 0%–45% 必须是低细节暗区**（会被 `.storehero__shade` 压到 82% 暗度）；主体重心横向 **62%–68%**，纵向 45%–55%（`object-position: center 35%` 会保留母版纵向约 24%–76%）；人形高度不超过画面 22%。
- 专属负面：close-up face, gunfight, muzzle flash, crowd, buildings with signage, symmetrical composition, centered subject

**④ library-hero.webp** — 母版 2560×826，交付 1920×620
> Ultra-wide quiet background: inside an abandoned rail depot at night, cold moonlight through broken roof slats, a single warm lantern deep in the frame, deep shadow across the lower third, empty wall on the left, matte painterly texture, desaturated umber and slate, no text.
- 中文说明：游戏库详情的背景板。深夜废弃车站，光斑从破屋顶漏下来，中间一盏远灯——够大、够静、不抢前景的字。
- 构图：**下 1/3 压到接近纯暗**（logo 与简介压在这里）；左侧 30% 只留墙面肌理；唯一亮点（提灯）放在横向 55%–65%、纵向 45%。
- 专属负面：busy clutter, hanging lamps cluster, glossy metal, starry sky, deep black crush, high contrast HDR

**⑤ logo.svg** — `viewBox 0 0 480 120`，透明底
- 主标渐变：`#d8a06a` → `#7a3b2e`（135°）｜副标纯色 `#c9b39a`
- 副标文案（自造词，勿改）：`RAIL END`
- 中文说明：字标只用矢量。中文名 4 字，`y=72` 基线下会留出充足下缘。
- 说明：**不投喂图像模型**。若必须出位图参考，允许一次「构图草样」但不得直接使用（必产伪文字）。

**⑥ screenshot-01.webp** — 母版 1920×1080，交付 1280×720
> Wide in-world scene: an empty main street of a wooden frontier town at noon, heat shimmer above the boards, one hitching post and a water trough, no people, long hard shadows, muted dust palette, painterly illustration, flat cinematic framing, no text.
- 中文说明：正午的镇子空无一人 —— 商店截图要让人相信这个世界在你不玩的时候也在晒着。
- 构图：街道透视消失点落在横向 58%–62%；前景木栈道占下 25%；无角色，避免「摆拍」感。
- 专属负面：crowd, duel, gun drawn, saloon sign with letters, horses in motion, midday blue sky saturation

**⑦ screenshot-02.webp** — 母版 1920×1080，交付 1280×720
> Wide night scene: a small campfire beside an overloaded pack mule, a bedroll and a tin cup, warm firelight on the near side and cold blue distance, sage brush silhouettes, painterly, low saturation, quiet, no people, no text.
- 中文说明：营地的一夜 —— 火在那烧着，人不在画面里，暗示「他还在追」。
- 构图：火堆在横向 35%–42%（唯一暖光源），骡子在 55%–65%；火光照亮半径不超过画面 30%。
- 专属负面：human figure, face, weapon, wolf, blood, orange-teal cinema grade, overly warm overall

**⑧ screenshot-03.webp** — 母版 1920×1080，交付 1280×720
> Wide dusk scene: a stopped freight train on a trestle above a dry riverbed, seen from a low angle far away, one lantern moving along the cars, dust in the air, amber and slate palette, painterly, no text, no violence.
- 中文说明：旱河谷上的栈桥与停住的货车 —— 世界的尺度比人重要。
- 构图：栈桥横贯纵向 55%–60% 处；提灯是画面唯一高亮点（横向 40%）；天空占上 35% 且干净。
- 专属负面：explosion, derailed wreck, fire, people fighting, sunset gradient rainbow, birds flock

### 3.2 `grey-line` 灰线

**① icon.webp** — 母版 512×512，交付 64×64
> Minimal emblem: a thin pale supply-route line cutting diagonally across dark olive terrain seen from above, one small ember-orange dot resting on the line, dense flat fog, painterly minimal shading, bold silhouette, centered, no text.
- 中文说明：一枚「一条线 + 一个点」的军用地图徽记 —— 48 个人就是这条线上的一个点。
- 构图：斜线贯穿对角，粗细占画面宽 4%–6%（更细会在 64px 消失）；亮点直径 ≥ 画面 10%。
- 专属负面：crosshair, rifle silhouette, helmet emblem, national insignia, bright green night vision, HUD

**② portrait.webp** — 母版 1200×1800，交付 600×900
> Vertical military key art: six soldiers in rain-soaked gear walking away down a flooded supply road at first light, seen from behind, heavy fog swallowing the far distance, flat cold light, faces hidden, muted olive and graphite, painterly illustration, no text.
- 中文说明：六个人背对镜头走在积水路上，雾把前方吃掉了 —— 没人回头看，因为没人收到撤退命令。
- 构图：队伍在**纵向 45%–62%**（卡面可见区），头部不进入上 25%；人形整体高度占画面 30%–38%，不要顶天立地；地平线在 55%。
- 专属负面：facial features, gore, wounded, heroic low-angle pose, flag, dog tags with text, sunny sky, lens flare

**③ header.webp** — 母版 1840×860，交付 920×430
> Wide banner: a mud-covered supply truck stopped on a rutted road at the right third, dim headlights lost in fog, an empty grey field and low cloud filling the left half, overcast flat light, cold desaturated olive, painterly matte, no text.
- 中文说明：一辆陷在泥里的补给车 —— 「开到地方」就是全部剧情。
- 构图：**左侧 0%–45% 低细节雾区**；卡车重心横向 68%、纵向 55%；车头朝左（与左侧文字形成对望）；不得出现可读车牌。
- 专属负面：explosion, muzzle flash, soldier aiming, centered truck, bright headlight glare, blue sky, saturated green

**④ library-hero.webp** — 母版 2560×826，交付 1920×620
> Ultra-wide quiet background: an empty roadside checkpoint at night, rain on wet concrete, one red signal lamp far down the road, deep shadow across the lower third, vast fog on the left, cold graphite and olive tones, painterly, no text.
- 中文说明：空无一人的夜间检查站，远处一盏红灯 —— 补给线还没断，只是没人守着。
- 构图：下 1/3 近黑（承字）；红灯在横向 62%、纵向 42%，是唯一饱和点，直径 ≤ 画面 2%；左侧 40% 只有雾。
- 专属负面：guard figure, barrier arm with text, barbed wire close-up, red alert lighting, heavy vignette

**⑤ logo.svg** — `viewBox 0 0 480 120`，透明底
- 主标渐变：`#c6cfc2` → `#6b7a6e`（135°）｜副标纯色 `#9aa79c`
- 副标文案：`GREY LINE`
- 中文说明：只有 2 个汉字，字号仍按 58 保持，让它在 320px 宽下与 4–5 字的 logo 视觉重量接近（勿放大补白）。
- 说明：**不投喂图像模型**。

**⑥ screenshot-01.webp** — 母版 1920×1080，交付 1280×720
> Wide in-world scene: a paved supply road in heavy fog, a canvas-covered truck half in frame at right, wet asphalt reflecting diffuse sky, telegraph poles fading into white, cold olive palette, painterly, no people, no text.
- 中文说明：雾里的补给路，电线杆一根根消失 —— 这类游戏的压迫感来自「看不到尽头」。
- 构图：路面占下 55%，卡车的半身在右 25% 处被画框切掉（增强「继续往前」的暗示）。
- 专属负面：cars, city buildings, guardrails with text, sun, shadows from direct light, motion blur streaks

**⑦ screenshot-02.webp** — 母版 1920×1080，交付 1280×720
> Wide interior at night: inside a truck cab, a blank unmarked map spread on the dash lit by one small dome light, rain streaking the windshield, dark hills beyond, worn canvas and scratched metal, painterly, muted, no readable writing, no text.
- 中文说明：驾驶室里摊着一张空白地图 —— 这一作的「任务界面」是纸和油，不是准星。
- 构图：地图占下 40%，顶灯在横向 42%；挡风玻璃外必须保持过曝的灰白（顶光反差）。
- 专属负面：gps screen, glowing digital display, readable map labels, hands on wheel, dashboard lights cluster

**⑧ screenshot-03.webp** — 母版 1920×1080，交付 1280×720
> Wide scene in rain: four soldiers resting under a stretched tarp beside a ditch, heads down, gear stacked, grey water dripping, no wounds, flat overcast light, cold olive and rust palette, painterly, quiet, no text.
- 中文说明：四个人挤在防水布下躲雨 —— 「今晚谁先睡」比枪战更接近这款游戏的真相。
- 构图：防水布三角占上 45%，人形居中偏右（55%）；右侧 25% 留给车尾或土坡；不得露出五官。
- 专属负面：combat, blood, bandage with red, crying face, campfire warmth overload, sunbeam god rays

### 3.3 `stillframe` 静帧（工具，非游戏）

**① icon.webp** — 母版 512×512，交付 64×64
> Minimal emblem: a soft-edged rectangular window filled with a slow dusk gradient, thin pale frame, one faint horizon line inside, flat minimal shading, calm, generous margin, centered, no interface elements, no text.
- 中文说明：一枚「一扇装了黄昏的窗」—— 工具卖的是「贴在最底层的那块风景」，不是游戏。
- 构图：矩形占画面 62%–68%，圆角约 8%；内部只有渐变 + 一条 2% 细的地平线；四周 ≥16% 空边。
- 专属负面：desktop icons, taskbar, window chrome, cursor, play button, gear icon, character, landscape photo inside frame

**② portrait.webp** — 母版 1200×1800，交付 600×900
> Vertical ambient landscape: layered mountain ridges dissolving into pale mist, a flat dusk sky filling the upper half, no focal object, no figures, extremely soft edges, low saturation teal and warm sand, painterly haze, still, no text.
- 中文说明：层叠山脊化进雾里，上半是空天 —— 拿来当封面，但不讲任何故事。
- 构图：地平线在**纵向 52%**（卡面可见区中心附近），山脊层次 3–4 层且越远越淡；顶部 30% 纯渐变；**不得出现任何实体**。
- 专属负面：person, animal, bird, house, boat, waterfall, dramatic storm clouds, teal-orange grade, sharp focus foreground

**③ header.webp** — 母版 1840×860，交付 920×430
> Wide panoramic landscape: a still lake at dusk, flat mirror water filling the left half, one distant reed bank at the right, hairline horizon, soft gradient sky, no subject, no figures, muted teal and pale amber, painterly minimal, no text.
- 中文说明：一面不动的湖 —— 左边整片水面留白，右边一小丛芦苇给眼睛一个落点。
- 构图：**左侧 0%–48% 只有镜面水与渐变色**（承字区）；地平线在纵向 42%；芦苇重心横向 78%、高度 ≤ 画面 15%。
- 专属负面：ripples from impact, splashing, boat, dock, fish, sunset fire colors, centered subject

**④ library-hero.webp** — 母版 2560×826，交付 1920×620
> Ultra-wide still landscape: slow clouds over a dark hill line along the bottom edge, faint stars above, one warm ember of light on the horizon at right, everything soft and low contrast, deep teal and charcoal, painterly, no text.
- 中文说明：极宽的一条夜岭与慢云 —— 它是背景板，所以故意做得比其它三款更「退后」。
- 构图：山线压在底部 **8%–14%** 高度；右 68% 处一点极小暖光；上 60% 是深青天，允许极弱星点（不超过 40 颗可见点）。
- 专属负面：milky way photo, aurora, moon large, city glow with buildings, high contrast, stars too large

**⑤ logo.svg** — `viewBox 0 0 480 120`，透明底
- 主标渐变：`#a8d4d0` → `#3d6b74`（135°）｜副标纯色 `#8fb2b4`
- 副标文案：`STILLFRAME`
- 中文说明：2 个汉字 + 一段较长的英文副标。副标 10 字符 × (19px + 7 字距) ≈ 260px，仍在 480 内，**不要为了填满而加大字距**。
- 说明：**不投喂图像模型**。此类抽象工具最容易让模型自动「补一个主体」，务必手写矢量。

**⑥ screenshot-01.webp** — 母版 1920×1080，交付 1280×720
> Wide still frame: rain running down a dark window pane, blurred warm street light beyond, shallow focus, soft bokeh, no figures, no legible signs, muted teal and amber, painterly, calm, no text.
- 中文说明：一张「会动的雨窗」—— 商店截图展示的是壁纸本体，不是软件界面。
- 构图：玻璃平面占满画面，焦点在纵向 40% 处；光斑 bokeh 直径 ≤ 画面 6%；不得出现可读招牌。
- 专属负面：window frame with sill, interior furniture, person reflected, sharp city detail, neon signs, UI overlay

**⑦ screenshot-02.webp** — 母版 1920×1080，交付 1280×720
> Wide still frame: light caustics rippling across the sandy floor of shallow clear water, seen from just above the surface, slow gradient from pale green to deep blue, no fish, no figures, painterly, minimal, no text.
- 中文说明：浅水底的光纹 —— 纯质感，无叙事。
- 构图：水面分界在顶部 12%（隐约一条线），其余全是水底；光纹疏密不均，最亮处横向 55%。
- 专属负面：coral reef, tropical fish, diver, water surface from below, sunbeams through water, turquoise saturation

**⑧ screenshot-03.webp** — 母版 1920×1080，交付 1280×720
> Wide still frame: fine snow falling over a dark pine ridge, low cloud moving through the trees, one pale break in the sky at right, no buildings, no figures, desaturated blue-grey, painterly, quiet, no text.
- 中文说明：雪落在黑松脊上，右边天上裂开一道白 —— 适合长时间盯着，不刺眼。
- 构图：松脊占下 60%，右侧 75% 处一道天空裂缝作为唯一亮区；雪点稀疏（不做暴雪）。
- 专属负面：cabin, smoke chimney, snowman, animal tracks, blizzard, whiteout, moon, northern lights

### 3.4 `coin-laundry` 投币洗衣房

**① icon.webp** — 母版 512×512，交付 64×64
> Minimal emblem: a front-loading washing machine porthole seen straight on, dark glass with one small amber coin resting against the rim, cool fluorescent rim light, flat painterly shading, bold circle silhouette, centered, no text.
- 中文说明：正圆的洗衣机舱门 + 一枚卡在边缘的硬币 —— 「不吞硬币」就是这店的信誉。
- 构图：圆形占画面 66%–72%，完全居中；冷白轮廓光在左上；硬币仅占 8% 且必须可辨。
- 专属负面：coins scattered pile, slot machine, laundry basket, cartoon wash bubbles, brand label, spin motion lines

**② portrait.webp** — 母版 1200×1800，交付 600×900
> Vertical key art: a small coin laundry at two in the morning, one customer asleep on a plastic chair beside a spinning drum, warm amber bulb over the counter, cold fluorescent tubes above, wet linoleum reflections, painterly, muted, no text.
- 中文说明：凌晨两点的洗衣房，一个人睡在塑料椅上，滚筒还在转 —— 这游戏卖的是「陪着」。
- 构图：人形与滚筒在**纵向 45%–62%**；顶部 25% 留给荧光管与天花（不放大字）；湿地面反光占下 20%；人脸背对或垂头，不可辨。
- 专属负面：smiling face, sexy pose, vintage diner, jukebox, neon sign, cinematic rain outside, pristine machines

**③ header.webp** — 母版 1840×860，交付 920×430
> Wide banner: a row of front-loading washers glowing at the right third of a dim laundromat, stacked plastic baskets, one hanging amber bulb, the left half a dark quiet wall with a blank payphone, night, painterly, warm amber and cool grey, no text.
- 中文说明：右边一排亮着的滚筒，左边一面暗墙和一台公用电话 —— 电话是给「听完三个人的一生」留的。
- 构图：**左侧 0%–45% 暗墙**（承字区）；滚筒列重心横向 70%、纵向 55%；吊灯在横向 52% 作冷暖分界；公用电话在横向 30%、纵向 62%（小，但可辨）。
- 专属负面：neon, open sign with letters, brand logos, coin slot machine, wide empty floor, symmetrical row

**④ library-hero.webp** — 母版 2560×826，交付 1920×620
> Ultra-wide quiet background: an empty laundromat after closing, one fluorescent tube over the folding table, deep shadow across the lower third, worn tile and chrome, warm amber against cold grey, painterly, no text.
- 中文说明：打烊后的空店，一根荧光管照在折叠台上 —— 画面里没有人，但处处是人的痕迹。
- 构图：下 1/3 近暗（承字）；折叠台在横向 40%–55%；左侧 35% 只有瓷砖墙；荧光管略过曝（允许，因是光源本体）。
- 专属负面：people, abandoned ruin, graffiti, broken glass, horror mood, flickering ghost, heavy vignette

**⑤ logo.svg** — `viewBox 0 0 480 120`，透明底
- 主标渐变：`#f2b46a` → `#a8542f`（135°）｜副标纯色 `#d9b79a`
- 副标文案：`COIN LAUNDRY`
- 中文说明：**5 个汉字是本批最长**。58px + 4 字距 → 约 306px 宽，`x=14` 起排仍在 480 内；**禁止为塞下而缩字号**，缩了就和其它 17 个 logo 不同高。
- 说明：**不投喂图像模型**。

**⑥ screenshot-01.webp** — 母版 1920×1080，交付 1280×720
> Wide interior scene: a folding table under a fluorescent tube, a plastic basket of warm towels, one coin tray with scattered coins, worn tile floor, night, no people, warm and cold mixed light, painterly, no text.
- 中文说明：折叠台上的热毛巾和一排硬币 —— 经营模拟的「账本」，全在这些小物件上。
- 构图：台面占下 50%，荧光管在上 15% 横穿；硬币在横向 58% 处必须是画面最亮的小点。
- 专属负面：calculator, cash register with digits, price tags, people, clean showroom look, neon

**⑦ screenshot-02.webp** — 母版 1920×1080，交付 1280×720
> Wide counter scene: a worn laminate counter at night, a blank notebook and a ballpoint pen, a small radio, a chipped mug, amber bulb light from above left, no people, no readable writing, painterly, muted, no text.
- 中文说明：柜台上摊着空白笔记本和一支笔 —— 「记事」这件事得看得见，但字不能出现。
- 构图：柜台占下 55%；灯在左上 20% 处形成硬阴影；笔记本翻开但页面纯白无笔画。
- 专属负面：readable handwriting, newspaper, sticky notes with text, calendar, computer screen, people

**⑧ screenshot-03.webp** — 母版 1920×1080，交付 1280×720
> Wide dawn scene: the laundromat window from inside, pale blue morning outside, one empty chair and a folded jacket left behind, floor reflections, quiet, muted amber and blue, painterly, no people, no text.
- 中文说明：天亮了的窗，一把空椅子，一件被落下的外套 —— 客人走了，故事留在店里。
- 构图：窗框在横向 60%–85%；窗外必须过曝成淡蓝白（不要细节）；椅子在横向 38%，外套搭在椅背。
- 专属负面：person leaving, silhouetted figure outside, street with cars, sunrise orange, glare blown out

---

## 4. 通用负面词清单

逐条拼进每次调用的 negative prompt（不区分款，全批共用）：

```
text, letters, words, numbers, caption, subtitle, typography, watermark, signature, logo,
brand mark, copyright symbol, UI, HUD, crosshair, health bar, minimap, menu overlay,
screenshot frame, border, frame within frame, collage, split screen, multiple panels,
photorealistic, photograph, 3D render, CGI, plastic skin, glossy plastic highlight,
oversaturated, neon cyberpunk, magenta glow, rainbow gradient, HDR halo, lens flare burst,
deformed hands, extra fingers, extra limbs, mutated anatomy, fused faces, distorted perspective,
low resolution, jpeg artifacts, heavy noise, pixelation, oversharpened,
crushed blacks, blown highlights, muddy midtones, flat gray wash,
text in any language, chinese characters, japanese characters, cyrillic characters
```

补充说明（技术美术视角，不是审美意见）：
- **`text` 单独不够**。模型对「招牌 / 海报 / 车牌 / 标签」这类语义槽位有强先验，必须连 **`readable text`, `signage with letters`, `license plate`, `product label`** 一起压；本批 prompt 里已把相关物体改写成 `blank`（空白告示、空白地图、空白笔记本），这是双保险。
- **`photorealistic` 与 `3D render` 必须同时出现**。只写一个时，模型常退化成「写实但打了柔光」的照片感，和现有 6 款的手绘笔触并排立刻不同源。
- **不要写 `no text` 到 negative 里**。负面提示按词匹配，`no` 会被忽略而 `text` 被强化；正向 prompt 里才用 `no text` 句式。

---

## 5. 文件命名与落位表（32 行）

生成 → 后处理（居中裁切 / 缩放 / 转 webp `quality=82`）→ 按下列文件名放回 `client/src/assets/games/<gameId>/`。

| # | 游戏 | 文件 | 生成母版 | 交付尺寸 | 格式 |
|---:|---|---|---|---|---|
| 1 | rail-end | `rail-end/icon.webp` | 512×512 | **64×64** | webp q82 |
| 2 | rail-end | `rail-end/portrait.webp` | 1200×1800 | **600×900** | webp q82 |
| 3 | rail-end | `rail-end/header.webp` | 1840×860 | **920×430** | webp q82 |
| 4 | rail-end | `rail-end/library-hero.webp` | 2560×826 | **1920×620** | webp q82 |
| 5 | rail-end | `rail-end/logo.svg` | — | **480×120 viewBox** | svg 手写 |
| 6 | rail-end | `rail-end/screenshot-01.webp` | 1920×1080 | **1280×720** | webp q82 |
| 7 | rail-end | `rail-end/screenshot-02.webp` | 1920×1080 | **1280×720** | webp q82 |
| 8 | rail-end | `rail-end/screenshot-03.webp` | 1920×1080 | **1280×720** | webp q82 |
| 9 | grey-line | `grey-line/icon.webp` | 512×512 | **64×64** | webp q82 |
| 10 | grey-line | `grey-line/portrait.webp` | 1200×1800 | **600×900** | webp q82 |
| 11 | grey-line | `grey-line/header.webp` | 1840×860 | **920×430** | webp q82 |
| 12 | grey-line | `grey-line/library-hero.webp` | 2560×826 | **1920×620** | webp q82 |
| 13 | grey-line | `grey-line/logo.svg` | — | **480×120 viewBox** | svg 手写 |
| 14 | grey-line | `grey-line/screenshot-01.webp` | 1920×1080 | **1280×720** | webp q82 |
| 15 | grey-line | `grey-line/screenshot-02.webp` | 1920×1080 | **1280×720** | webp q82 |
| 16 | grey-line | `grey-line/screenshot-03.webp` | 1920×1080 | **1280×720** | webp q82 |
| 17 | stillframe | `stillframe/icon.webp` | 512×512 | **64×64** | webp q82 |
| 18 | stillframe | `stillframe/portrait.webp` | 1200×1800 | **600×900** | webp q82 |
| 19 | stillframe | `stillframe/header.webp` | 1840×860 | **920×430** | webp q82 |
| 20 | stillframe | `stillframe/library-hero.webp` | 2560×826 | **1920×620** | webp q82 |
| 21 | stillframe | `stillframe/logo.svg` | — | **480×120 viewBox** | svg 手写 |
| 22 | stillframe | `stillframe/screenshot-01.webp` | 1920×1080 | **1280×720** | webp q82 |
| 23 | stillframe | `stillframe/screenshot-02.webp` | 1920×1080 | **1280×720** | webp q82 |
| 24 | stillframe | `stillframe/screenshot-03.webp` | 1920×1080 | **1280×720** | webp q82 |
| 25 | coin-laundry | `coin-laundry/icon.webp` | 512×512 | **64×64** | webp q82 |
| 26 | coin-laundry | `coin-laundry/portrait.webp` | 1200×1800 | **600×900** | webp q82 |
| 27 | coin-laundry | `coin-laundry/header.webp` | 1840×860 | **920×430** | webp q82 |
| 28 | coin-laundry | `coin-laundry/library-hero.webp` | 2560×826 | **1920×620** | webp q82 |
| 29 | coin-laundry | `coin-laundry/logo.svg` | — | **480×120 viewBox** | svg 手写 |
| 30 | coin-laundry | `coin-laundry/screenshot-01.webp` | 1920×1080 | **1280×720** | webp q82 |
| 31 | coin-laundry | `coin-laundry/screenshot-02.webp` | 1920×1080 | **1280×720** | webp q82 |
| 32 | coin-laundry | `coin-laundry/screenshot-03.webp` | 1920×1080 | **1280×720** | webp q82 |

**裁切规则（必须知道，否则主体会被切）**

| 用途 | 容器 | `object-fit` / 位置 | 实际可见区 | 对生成的约束 |
|---|---|---|---|---|
| 商店焦点横幅 | `.storehero` 100% × **300px** (`height:300px`) | cover / `center 35%` | 母版纵向约 **24%–76%**，横向全宽 | 主体须落在纵向 30%–70% |
| 竖版卡封面 | `.card__cover` **height:140px** | cover / 默认居中 | 母版纵向约 **27%–73%**（按 200px 卡宽估） | 主体须落在纵向 40%–62%；顶部 25% 会被裁掉，别放重点 |
| 商店详情头图 | `.storedetail__hero` | cover / `center 30%` | 母版纵向约 **21%–79%** | 同 header |
| 库详情背景 | `.libgame__hero` `min-height:240px` | cover / 默认居中 | 母版纵向约 **33%–67%** | 重点压在中间带，下 1/3 仍要暗（承 logo 渐变） |
| 商店截图 | `.storedetail__shot` `aspect-ratio:16/9` | cover | 全幅无裁切 | 16:9 母版直接缩，不要再裁 |
| 左栏 / 下载列表 icon | `.rail__swatch` 小方块 | cover / 居中 | 居中正方形裁切 | 主体必须居中，四边留 ≥18% 空 |

---

## 6. 验收标准（每张素材过这 5 条才算合格）

1. **并排同源**：与现有 6 款缩到 320px 宽并排（共 10 张一排），不看标题能否认出「同一批」；底色明度必须落在 0.10–0.32，**不得落在 0.35–0.60 中间调**，否则单张返工。
2. **主体不被裁切**：按 §5 的三种容器各看一遍 —— 焦点横幅里主体是否还在（纵向 24%–76%）、竖版卡里头部/关键物是否被切（纵向 27%–73%）、icon 居中正方形裁切后是否仍可辨。三者都要过。
3. **暗部不死黑**：`L < 0.06` 的像素占比 ≤ **35%**；把暗部提亮 +60 后能看见材质（木纹、布褶、瓷砖缝），而不是一片纯 `#000`。参考红线：现有第七走廊最高 77%，是反面样本。
4. **无文字残留**：400% 放大扫**四角 + 画面中部 + 所有"本该有字的物体"**（告示、招牌、车牌、包装、屏幕、书页），不得出现任何字母/数字/伪文字笔画；空白处必须是干净的纸/漆/布。
5. **色板落区间**：主色相在锚点 ±15°；mean L 0.16–0.30；mean S 0.15–0.40；强调色像素占比 8%–15% 且 S ≥ 0.45；高光溢出（L>0.94）≤ 1%。跑 §1.3 脚本，全 `OK` 才算过。

---

## 7. 风险与待决

| # | 事项 | 影响 | 建议 |
|---|---|---|---|
| 1 | **`header` / `library-hero` / `icon` 尺寸与简报不符**（见 §0） | 高：会破坏 10 款并排一致性，且运行时裁切错位 | 请 team-lead 确认采用「母版大 / 交付按运行时」；若改尺寸须同步改 `styles.css` 6 处并重裁老 6 款 |
| 2 | `logo.svg` 无图像模型参与 | 中：与「4×8=32 条 prompt」的字面要求有出入 | 手写矢量是唯一能保证「零伪文字」的路径；如需模型出草样，只作参考不入库 |
| 3 | 现有素材含 AI 服务水印，需靠镜像补丁去除（见 `SOURCES.md`） | 中：新批次若换生成渠道，水印位置/形态可能不同 | 落位前统一目检右下角；建议在 §6 第 4 条之外单加一步「水印位复检」 |
| 4 | `rail-end` 与 `coin-laundry` 同属暖调，有撞色风险 | 中：两款并排时可能被读成同一部作品 | 已用「自然日光 vs 人工荧光」+「外景低角 vs 室内顶光」拉开；生成后必须并排过一遍第 1 条 |
| 5 | `stillframe` 是工具不是游戏，但商店货架语境会诱导模型加「主体」 | **高：本批最容易做垮的一款** | 见下 |

### 最容易做垮的一款：`stillframe` 静帧

三个原因，都是结构性的、不是「多试几次就好」：

1. **它没有主体，而扩散模型被训练成「必须放一个主体」。** 一旦画面空，模型会自作主张补上一个人、一间小屋、一条船、一只鸟 —— 每一件都让「工具」变成「游戏封面」，直接违反硬约束。这是 prompt 层面最难对抗的一类先验，负面词只能压低概率，不能清零。
2. **空画面会诱导模型用「过饱和 + 强对比」来凑"好看"。** 而静帧要的恰恰是**低对比、低饱和、可长时间凝视**（目标 mean S ≈ 0.16，是全批最低）。这两个目标天然反向，模型默认会滑向壁纸广告的 HDR 味儿，跟我们要的「贴着桌面的呼吸感」是两回事。
3. **它 90% 是空的，所以任何一处瑕疵都是全画面的焦点。** 另三款有物件和笔触可以把注意力引开；静帧里一条错的地平线、一处没糊干净的渐变带、一粒突兀的噪点，都会被一眼看见。容错率最低。

应对：`stillframe` 的四张图（portrait/header/library-hero/三张 screenshot）**必须单独一轮出、单独过验收**，不要和其它三款混在同一次生成里比稿，否则最容易被「看起来更热闹」的那几款带着跑偏。

---

*本文件为 A 批唯一规格源。B 批（其余 14 款）另出，命名与 §1 规则沿用，色板各自新定。*
