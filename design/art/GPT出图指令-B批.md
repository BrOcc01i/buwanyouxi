# 给 GPT 的出图指令 · B 批

> 4 款 × 7 = 28 张。用法同 A 批：先贴「开场设定」一次，之后一张一条消息。

---

## 0. 与 A 批的三处不同（先看，别照抄 A 批）

**① 亮度契约放宽了。** A 批要求「全部暗场，平均明度 0.10–0.32」，结果 28 张里有 15 张超了——但并排看并没有断层。原因是那三款的亮度是题材决定的（雾天、沙漠日照、壁纸工具）。所以 B 批改成**按题材给区间**，不再一刀切：

| 款 | 目标平均明度 | 为什么 |
|---|---|---|
| 第九次醒来 | 0.10–0.24 | 灰烬与石，最暗的一款 |
| 棍下留人 | 0.18–0.34 | 雾气漫射，靠亮度差做纵深 |
| 晒谷场 | 0.30–0.45 | **白天**的村子，硬光短影，这是它和「第七走廊」的分界 |
| 一格山河 | 0.28–0.42 | 台灯下的羊皮纸地图 |

**② 别和 A 批撞色。** A 批已经占了：暖褐（铁轨尽头）、冷灰（灰线）、琥珀暖光（投币洗衣房）、青蓝（静帧）。B 批要错开：

- 第九次醒来 → **骨白 + 锈红**
- 棍下留人 → **墨绿 +  temple 金**
- 晒谷场 → **麦黄 + 干土褐**（注意与铁轨尽头区分：这里是正午顶光硬影，那边是黄昏低角长影）
- 一格山河 → **羊皮纸 + 朱砂**

**③ 四款都要有「一个错位」。** 这是整套素材的骨架——每款必须有一个和同类作品错开的具体设定，不能只画个类型场面：

- 第九次醒来：**钟只敲一次**，而你会死很多次；画面里永远有一座钟，但没有人
- 棍下留人：**九千级台阶**是主角；妖王正脸从不出现
- 晒谷场：**影子比人多**——画面里要有一个「不该存在的影子」
- 一格山河：**一格土地**——画面就是一张摊在桌上的小地图，有格线

---

## 开场设定（贴一次）

```text
You are making cover art for a fictional offline game client. All art is shown in a dark UI at small sizes: 64px icons, 140px tall cards, 300px tall banners.

Apply these rules to every image:

1. ONE light source only, high angle 30–45°, from the left or right third. The shadow side must be cold — tinted toward deep blue-teal, never neutral black.
2. Two value zones only. Keep the base either dark (10–32% luminance) or bright (62–75%); avoid mid-grey as the base. One accent hue only, covering 8–15% of the frame, and it should be the only saturated thing.
3. Put the subject off-centre, around 55–70% across. Leave one continuous, low-detail area of at least 25% of the frame for UI text to sit on.
4. Hand-painted digital illustration: visible brush edges, fine line work, paper grain, some soft focus. No photorealism, no 3D render, no plastic highlights, no flat vector, no glossy CGI.
5. Absolutely NO text anywhere. No letters, numbers, words, captions, signage, labels, plates, watermarks or logos. Any sign, poster, map, screen, notebook or package must be completely blank.

Output wide landscape 3:2 unless the message says otherwise. I will crop it myself.
```

---

## 1. `ninth-awakening` 第九次醒来 · 类魂

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#14110f` 灰烬黑（底）｜`#6b6257` 骨灰（中间调）｜`#b9a98f` 苍白骨（亮）｜`#8a3b2a` 余烬锈红（**强调，占 8–15%**）｜`#2b2f33` 冷石板 |
| 主光 | 单一硬冷光，来自左上 30°，长而硬的投影；背光面偏冷蓝 |
| 质感 | 裂开的石阶、灰烬、锈铁、破布；除强调色外全部哑光 |
| 差异化 | 全批最暗；唯一以「计数」为主题的一款；钟是唯一反复出现的物件 |
| 禁止 | 血条 / HUD / 血渍、巨龙、王座、骑士铠甲正面、火焰特效 |

### ① icon — 1:1

```text
A minimal emblem: a single cracked stone bell hanging from a rusted iron bracket, seen straight on, one thin seam of ember-red light glowing along the crack. Ash-grey stone against near-black, flat painterly shading, bold silhouette, perfectly centred with generous margin, no text.
```

### ② portrait — 2:3

```text
Vertical dark fantasy key art: a narrow stone stairway climbing into cold fog, a single rusted bell hanging above the last visible step, its crack glowing faint ember red. Ash-grey stone, pale bone light from the upper left, deep shadow on the right. No figure anywhere. The bell sits in the middle band vertically; the top quarter is empty fog. Painterly, somber. No text.
```

### ③ header — 3:2（上下会被裁，主体留中间带）

```text
Wide somber banner: a vast cracked stone courtyard at dusk, one iron bell on a leaning frame at the right third, a thin ember-red glint catching its edge. The left half is a calm ash-grey haze with almost no detail — it will carry the title text. Cold hard light from the upper left, long shadows. Keep the bell inside the central band vertically. Painterly, desaturated. No people, no text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: the interior of a ruined stone chapel at night, pale moonlight falling through a collapsed roof onto an empty stone floor, one faint ember-red point far in the dark. Deep shadow in the lower third, bare walls on the left. Painterly, matte, ash grey and bone. Compose as one horizontal band; bottom third stays dark. No figures, no text.
```

### ⑤ screenshot-01

```text
Wide scene: a long stone staircase descending into thick fog, worn steps wet with condensation, rusted chains hanging along one wall, cold light from above. No figure. Ash grey and slate palette with one small ember-red speck far down the stair. Painterly, quiet, oppressive. No text.
```

### ⑥ screenshot-02

```text
Wide interior: a small stone alcove with a dead campfire, ash and a blackened kettle, a folded cloth and a short iron rod leaning against the wall. Faint ember glow inside the ash. Cold blue-grey shadows elsewhere. No figure. Painterly, intimate, still. No text.
```

### ⑦ screenshot-03

```text
Wide courtyard: a cracked bell lying on its side in a stone yard, its rim buried in ash, one thin crack glowing ember red. Overcast hard light from the upper left, long shadow to the right. No figure, no blood. Painterly, desaturated, heavy. No text.
```

---

## 2. `staff-mercy` 棍下留人 · 东方神话动作

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#101a18` 墨青黑（底）｜`#4a6b5a` 苔绿（中间调）｜`#a8c4b0` 雾青（亮）｜`#d9b25e` 庙金（**强调**）｜`#2a2b26` 石灰 |
| 主光 | 山脊背后的逆光，从右上渗过来；雾气承担全部体积，没有硬阴影 |
| 质感 | 水墨晕染、湿石阶、苔、竹影；边缘可以虚到接近消失 |
| 差异化 | 唯一以「台阶」为主体的一款；全批唯一的东方调；金色只出现在极小面积（庙檐/幡） |
| 禁止 | 金箍、虎皮裙、祥云、佛像正脸、龙、汉字书法、武侠对打姿态 |

### ① icon — 1:1

```text
A minimal emblem: a worn wooden staff standing upright against a slab of wet stone steps, one thin gold ring near its top. Ink-wash mist around the base, moss green and pale teal, flat painterly shading, bold simple silhouette, perfectly centred, generous margin, no text.
```

### ② portrait — 2:3

```text
Vertical eastern-fantasy key art: an endless flight of wet stone steps climbing into pale mist, moss between the stones, one small temple eave with a gold finial barely visible at the top edge. Backlight from behind the ridge, upper right, soft and diffuse. No figure. The steps fill the middle band vertically; the top quarter is mist. Ink-wash painterly, muted green and pale teal. No text.
```

### ③ header — 3:2（上下会被裁）

```text
Wide misty banner: stone steps descending from the upper right into a valley of fog, a single wooden staff planted upright at the right third with a thin gold ring catching light. The left half is soft grey-green mist with almost no detail — it will carry the title text. No figure, no temple facade with writing. Backlit, diffuse, ink-wash painterly. Keep the staff inside the central band vertically. No text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: a mountain ridge dissolving into layered mist at dawn, moss-covered stone railings running along the ridge line, one gold temple finial far at the right. Soft backlight, no hard shadows, pale teal and moss green. Compose as a horizontal band; bottom third stays dark and empty. No figures, no text.
```

### ⑤ screenshot-01

```text
Wide scene: steep wet stone steps switchbacking up a cliff, bamboo growing on one side, mist pouring down the steps, faint gold light at the top edge. No figure. Ink-wash painterly, muted greens, soft edges. No text.
```

### ⑥ screenshot-02

```text
Wide interior: a small mountain shrine interior, a stone floor, a wooden staff leaning in the corner, three incense sticks burned down, one gold plaque on the wall completely blank. Soft diffuse light from the open doorway. No figure, no writing. Painterly, quiet. No text.
```

### ⑦ screenshot-03

```text
Wide scene: a narrow stone platform above a sea of cloud, a single worn staff lying flat on the stones, scattered fallen leaves, dawn light from behind the clouds. No figure, no enemy. Ink-wash painterly, pale teal and gold accents, very soft edges. No text.
```

---

## 3. `threshing-floor` 晒谷场 · 民俗恐怖

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#2a2118` 干土褐（底）｜`#8a6a3a` 稻草黄（中间调）｜`#d9c9a3` 晒白（亮）｜`#6b2f22` 陈血锈（**强调，压到 5–8%**）｜`#454b3f` 田埂灰绿 |
| 主光 | **正午顶光**，硬、短影、几乎垂直——这是它和「第七走廊」（夜间室内）的分界 |
| 质感 | 干稻草、扬尘、旧砖、纸扎、晒裂的泥地 |
| 差异化 | 全批唯一**白天**的恐怖；恐惧来自「影子的数量」而不是黑 |
| 禁止 | 红衣女鬼、纸人正脸、血、夜晚、跳吓构图、稻田里的脸 |

### ① icon — 1:1

```text
A minimal emblem: a worn wooden rake standing upright in a dry threshing floor, seen straight on, surrounded by scattered straw. Harsh overhead noon light casting one short hard shadow that does not match the rake. Warm straw and dry earth tones, flat painterly shading, bold silhouette, centred, no text.
```

### ② portrait — 2:3

```text
Vertical rural-horror key art: an empty village threshing floor at noon, straw spread out to dry, low brick houses at the edge. Harsh vertical sunlight, very short shadows. On the packed earth there is one extra shadow with no person casting it. Bleached straw yellow and dry earth, painterly, still. The ground occupies the middle band; the top quarter is white-hot sky. No figures, no text.
```

### ③ header — 3:2（上下会被裁）

```text
Wide daylight banner: a broad threshing floor of packed earth covered in drying straw at midday, a low village wall and a loudspeaker pole on the right third. The left half is flat empty ground and glare with almost no detail — it will carry the title text. Harsh vertical sun, hard short shadows, dust in the air. Painterly, bleached and dry. No people, no lettering on the wall. Keep content in the central band. No text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: the edge of a village at dusk after harvest, stacked straw bales and a low wall, one window glowing dim amber far right, long shadows across dry ground. Deep shadow in the lower third, empty wall on the left. Painterly, dry brown and straw. No figures. Compose as a horizontal band. No text.
```

### ⑤ screenshot-01

```text
Wide scene: a village lane between low brick houses at noon, drying grain spread on mats, a loudspeaker on a pole, doors closed. Harsh overhead light, short hard shadows, dust. No people. Painterly, bleached straw and brick. All door signs blank. No text.
```

### ⑥ screenshot-02

```text
Wide interior: a dim village kitchen, a wood stove, a kettle, bowls stacked on a worn table, one paper offering hanging by the door. Light from a single small window, dust in the beam. No people. Painterly, warm earth tones, quiet. Paper is blank. No text.
```

### ⑦ screenshot-03

```text
Wide scene: a harvested field at the edge of a village in late afternoon, straw stubble, a scarecrow without a head, long shadows stretching toward the viewer. One shadow too many on the ground. Warm dry light from the left. Painterly, muted. No people, no text.
```

---

## 4. `one-tile-realm` 一格山河 · 4X 策略

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#1c1a16` 墨褐（底）｜`#7a6a4a` 羊皮纸暗（中间调）｜`#d6c69a` 旧纸（亮）｜`#9a5b32` 朱砂印（**强调**）｜`#3f4a42` 舆图青 |
| 主光 | 桌面台灯，暖光从左上压下；画面像一张摊开的旧地图 |
| 质感 | 羊皮纸、墨线、火漆印、木纹桌面、折痕 |
| 差异化 | 全批唯一「静物/俯视」视角；画面里必须有**格线**；朱砂只出现在印章与边界 |
| 禁止 | 现代地图、国旗、真实文明符号、UI 面板、3D 地形渲染、文字地名 |

### ① icon — 1:1

```text
A minimal emblem: a single square tile of aged parchment with an ink-drawn river crossing it, one small red wax seal at the corner. Warm lamp light from the upper left, deep shadow around the tile. Flat painterly shading, bold square silhouette, centred, generous margin, no text.
```

### ② portrait — 2:3

```text
Vertical strategy key art: an aged parchment map spread on a dark wooden table, ink-drawn grid lines, a river and a few tiny hill marks, one red wax seal at the lower right corner. Warm lamp light from the upper left, the rest of the table in shadow. The map fills the middle band; the top quarter is dark table. No figures, no lettering anywhere on the map. Painterly, parchment and ink. No text.
```

### ③ header — 3:2（上下会被裁）

```text
Wide banner: a large aged parchment map covering the right two thirds of a dark wooden table, ink grid lines and a coastline, one red wax seal and a bronze ruler at the edge. The left third is empty dark tabletop with a single lamp glow — it will carry the title text. Warm lamp light from the upper left, everything else in shadow. Painterly. No lettering on the map, no text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: the surface of an old parchment map seen from directly above, faint ink grid, a river drawn as a single line, one corner sealed in red wax. Warm lamp light from the upper left, edges falling into shadow. Compose as a horizontal band; the bottom third stays dark. No lettering, no figures, no text.
```

### ⑤ screenshot-01

```text
Wide overhead scene: a parchment map on a wooden table, ink grid lines dividing it into small squares, a few carved wooden tokens resting on the squares, one side lit warmly by a lamp. No lettering on the map. Painterly, parchment tones. No text.
```

### ⑥ screenshot-02

```text
Wide scene: a scholar's desk at night, an open blank ledger, a brush resting in an ink stone, a red seal and a small bronze compass, warm lamp light from the left, deep shadow on the right. No figures, no writing on the pages. Painterly, muted. No text.
```

### ⑦ screenshot-03

```text
Wide scene: a horizon made of stacked parchment layers, each layer a slightly different stage of a drawn landscape, a single red seal in the foreground, warm side light from the upper left. Abstract but painterly, no lettering, no people. No text.
```

---

## 5. 尺寸与投递

生成时**不用管尺寸**，按比例出图即可（1:1 / 2:3 / 16:9 / 3:2），我按运行时尺寸裁：

| 素材 | 你出的比例 | 我交付的尺寸 |
|---|---|---|
| icon | 1:1 | 64×64 |
| portrait | 2:3 | 600×900 |
| header | 3:2（**主体留中间带**，上下会被裁成 2.14:1） | 920×430 |
| library-hero | 3:2（**只保留中间横条**，会裁成 3.1:1） | 1920×620 |
| screenshot-01~03 | 16:9 | 1280×720 |

**存放**：

```
art-inbox\
├─ ninth-awakening\   icon · portrait · header · library-hero · screenshot-01~03
├─ staff-mercy\
├─ threshing-floor\
└─ one-tile-realm\
```

logo 不用生成，我手写矢量（英文副标：`NINTH AWAKENING` / `STAFF MERCY` / `THRESHING FLOOR` / `ONE TILE REALM`）。

## 6. 收图清单（28 张）

| 游戏 | icon | portrait | header | hero | ss-01 | ss-02 | ss-03 |
|---|---|---|---|---|---|---|---|
| 第九次醒来 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 棍下留人 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 晒谷场 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 一格山河 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## 7. 出图后自己先过这四条

1. **有没有冒出来的文字**——地图、门牌、纸扎、木牌这些位置最容易出伪字
2. **主体在不在中间带**——header 和 library-hero 会被上下裁掉，主体贴边就废了
3. **暗部有没有死黑**——把亮度拉高能看见材质纹理，就是对的
4. **和 A 批并排像不像一家做的**——笔触、颗粒、没有任何 3D 塑料高光

不达标的重生成，别留着。真要取舍，宁可构图差一点，也别留文字。
