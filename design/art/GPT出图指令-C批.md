# 给 GPT 的出图指令 · C 批

> 4 款 × 7 = 28 张。用法同 A/B 批：先贴「开场设定」一次，之后一张一条消息。

---

## 0. 这一批要躲开的颜色

前两批已经用掉了：暖褐、冷灰、琥珀、青蓝、骨白+锈红、墨绿+庙金、麦黄+干土褐、羊皮纸+朱砂。

C 批四款必须各自成立，不能和上面任何一款撞：

| 款 | 主色 | 和谁容易撞 | 靠什么分开 |
|---|---|---|---|
| 残局守则 | 枪金属 + 破片橙 | 灰线 | 灰线是**户外雾天无直射光**；这款是**室内人工顶灯 + 硬短影** |
| 一招半式 | 夜蓝 + 刀刃白 + 灯笼暖红 | 棍下留人 | 棍下是**白天雾山**；这款是**夜雨小巷**，只有一盏灯 |
| 代签人 | 冷灰 + 临床白 + 青绿指示 | 回声档案馆 | 回声是**旧声音/暗**；这款是**现代办公室/亮**，几何硬边 |
| 同谋 | 雨夜青 + 钠灯黄 | 霓虹漂移 | 霓虹是**紫电光**；这款只有**一盏街灯**，其余全暗 |

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

## 1. `clutch-protocol` 残局守则 · 战术射击 5v5

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#0d1012` 枪金属黑（底）｜`#2f3a44` 钢灰（中间调）｜`#9aa6ad` 苍白钢（亮）｜`#e0531e` 破片橙（**强调 8–12%**）｜`#1d2a26` 暗绿 |
| 主光 | 室内人工顶灯 + 一处屏幕冷光；硬、方向明确、短影；**没有雾** |
| 质感 | 水泥、防弹玻璃、喷涂模板、黄黑警示胶带、散落弹壳、布线 |
| 差异化 | 唯一「室内 / 人工光 / 近距离」的射击；画面里必须有一个**红灯**暗示倒计时，但绝不能出现数字 |
| 禁止 | 士兵面孔、国旗/部队徽记、枪口特写、血、HUD、准星、战术手语 |

### ① icon — 1:1

```text
A minimal emblem: a single yellow-black hazard stripe running diagonally across a dark steel plate, one small orange detonator light glowing at its end, seen straight on. Gunmetal black and pale steel, flat painterly shading, bold simple silhouette, perfectly centred, generous margin, no text.
```

### ② portrait — 2:3

```text
Vertical tactical key art: a dim concrete corridor inside an industrial facility, a single hard overhead light casting a short sharp shadow, a stack of crates and a coil of cable at the right, one small red lamp glowing far down the corridor. No people. Gunmetal, pale steel, one orange accent. Painterly but crisp, no fog. The corridor fills the middle band; the top quarter is dark ceiling. No text.
```

### ③ header — 3:2（上下会被裁）

```text
Wide banner: an interior of a concrete plant room, a steel door half open at the right third with hard light spilling through, hazard tape on the floor, one orange light glowing on a control box. The left half is a flat dark wall with almost no detail — it will carry the title text. Hard artificial light, short shadows, no fog. Painterly, gunmetal and steel. Keep content in the central band. No people, no lettering. No text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: an empty indoor shooting lane at night, concrete floor, a row of paper targets hanging at the far end, one overhead tube light humming, hazard stripes along the wall. Everything desaturated steel grey except one small orange lamp. Compose as a horizontal band; bottom third stays dark. No people, no numbers on the targets. No text.
```

### ⑤ screenshot-01

```text
Wide interior scene: a concrete stairwell of an industrial building, metal railing, scattered shell casings on the steps, one hard light from above. No people, no weapons in frame. Gunmetal and pale steel, painterly and crisp, no fog. No text.
```

### ⑥ screenshot-02

```text
Wide scene: a bomb site marked on a concrete floor with a red spray-painted rectangle, cables running to a small device with one blinking orange light, a stack of sandbags at the edge. No people. Hard overhead light, short shadows, no lettering anywhere. Painterly. No text.
```

### ⑦ screenshot-03

```text
Wide interior: a control room with dead monitors, a steel desk, an empty chair pushed back, one orange indicator lit on a panel. Cold dim light from the corridor doorway. No readable characters on any screen — all blank. Gunmetal and dark green, painterly. No text.
```

---

## 2. `half-a-move` 一招半式 · 武侠刀战

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#12141c` 夜蓝黑（底）｜`#2b3348` 靛（中间调）｜`#c9d2dd` 刀刃白（亮）｜`#c25b3a` 灯笼暖红（**强调 6–10%**）｜`#3a3a34` 湿石灰 |
| 主光 | 一盏纸灯笼的低位暖光，从右下打上来；雨丝与湿石反光承担其余亮度 |
| 质感 | 湿青石、黑漆木、油纸、绢、雨 |
| 差异化 | 唯一「夜雨 + 无人」的武侠；刀刃是画面唯一高光，且**不出现对手** |
| 禁止 | 对打姿态、飞檐走壁、汉字招牌/匾额、血溅、飘带乱舞、龙纹 |

### ① icon — 1:1

```text
A minimal emblem: a single straight blade standing point-down in wet stone, its edge catching one thin white highlight, a small paper lantern glowing behind it. Night blue-black and pale steel, one warm red-orange accent, flat painterly shading, bold silhouette, centred, no text.
```

### ② portrait — 2:3

```text
Vertical wuxia key art: a narrow wet stone alley at night, a paper lantern hanging low on the right casting warm light across the ground, a single sheathed blade leaning against the wall, rain falling in fine lines. No people. Deep indigo night, one warm lantern accent, wet reflections. Lantern and blade in the middle band; the top quarter is dark eaves. Painterly, quiet. No text.
```

### ③ header — 3:2（上下会被裁）

```text
Wide night banner: a wet stone courtyard in the rain, a low wooden gate at the right third lit by one hanging lantern, a single blade resting against the door frame. The left half is dark rain-soaked wall with almost no detail — it will carry the title text. Cold indigo with one warm red-orange pool of light. Keep content in the central band. No people, no plaque with characters. No text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: a rain-slick stone bridge at night, a single lantern at the far end, reeds bending in the rain, mist over water. Almost everything in deep indigo and near-black, one small warm light. Compose as a horizontal band; bottom third stays dark. No people, no buildings with signboards. No text.
```

### ⑤ screenshot-01

```text
Wide scene: a rain-soaked stone step street at night, water running between the stones, a paper lantern hanging from an eave on the right, a single blade leaning by a doorway. No people. Indigo and wet grey, one warm accent. Painterly, atmospheric. All signage blank. No text.
```

### ⑥ screenshot-02

```text
Wide interior: a bare room with a wooden table, two cups, a sheathed blade across the table, a paper lantern on the floor. Rain visible through the open window. No people, no writing on the paper screens. Warm low light from the lantern, cold blue from the window. Painterly, quiet. No text.
```

### ⑦ screenshot-03

```text
Wide scene: a bamboo grove at night in light rain, a narrow path, one lantern far down the path, blade glint reflected on a puddle. No people. Deep green-black and indigo, single warm accent. Painterly, soft edges. No text.
```

---

## 3. `proxy-signature` 代签人 · 叙事互动

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#0f1418` 深灰蓝（底）｜`#2a3b45` 冷灰（中间调）｜`#cfd8de` 临床白（亮）｜`#6fd3c7` 青绿指示（**强调 8–12%**）｜`#b08a5a` 木色 |
| 主光 | 冷白办公室顶光 + 一束斜窗光；几何硬边、无柔和过渡 |
| 质感 | 磨砂玻璃、混凝土、厚纸、印章、指印、金属边框 |
| 差异化 | 唯一「现代办公 / 无自然景观」；核心是**签名的痕迹**——笔迹、手印、印章，但纸面必须空白 |
| 禁止 | 机器人脸、电路板、裸露仿生结构、任何文字/签名笔迹、UI 弹窗 |

### ① icon — 1:1

```text
A minimal emblem: a single sheet of thick paper with a blank signature line, a fountain pen resting across it, one small teal indicator light at the corner. Clinical white paper against dark blue-grey, flat painterly shading, bold simple silhouette, perfectly centred, no writing of any kind.
```

### ② portrait — 2:3

```text
Vertical narrative key art: an empty modern office at night seen through frosted glass, a desk with a blank document and a pen, one warm desk lamp, cold city light through the window blinds. No people. Clinical white and cold grey with one teal indicator. Hard geometric light edges. The desk sits in the middle band; the top quarter is dark ceiling. Painterly but precise, no writing on the paper. No text.
```

### ③ header — 3:2（上下会被裁）

```text
Wide banner: a frosted glass partition in a modern office, a desk edge at the right third with a blank document and a pen under a small teal desk light, corridor light beyond. The left half is a flat pale wall with almost no detail — it will carry the title text. Cold clinical light, hard edges, deep blue-grey shadows. Painterly. Keep content in the central band. No people, no text on the glass. No text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: an empty waiting room at night, a row of metal chairs, one teal indicator light above a closed door, polished floor reflecting cold light. Everything desaturated blue-grey except that one small teal point. Compose as a horizontal band; bottom third stays dark. No people, no signage. No text.
```

### ⑤ screenshot-01

```text
Wide interior: a desk close-up, a blank contract page, a fountain pen, a round stamp pad, one handprint faint on the glass tabletop. No people. Cold clinical light from the left, hard shadow. Paper completely blank, no writing. Painterly and precise. No text.
```

### ⑥ screenshot-02

```text
Wide scene: an office corridor with glass walls, one door ajar at the end with teal light spilling out, reflections on the polished floor. No people. Blue-grey and clinical white, single teal accent. Hard geometric edges. Painterly. No lettering on any sign. No text.
```

### ⑦ screenshot-03

```text
Wide interior: a small interview room, two chairs facing each other across a bare table, a recording device with one teal light, cold overhead light, blinds casting hard stripes on the wall. No people. Clinical palette. Painterly, still, uneasy. No text.
```

---

## 4. `accomplice` 同谋 · 18+ 恋爱悬疑（**无露骨内容**）

> 这一款的边界写死在提示词里：只有雨、街灯、两个人的距离，**没有任何亲密动作、身体特写或暗示性画面**。

**视觉锚点**

| 项 | 内容 |
|---|---|
| 色板 | `#141a1e` 雨夜青黑（底）｜`#2c3f46` 湿墙青（中间调）｜`#dfe6e3` 雨光白（亮）｜`#d99a4e` 钠灯暖黄（**强调 8–12%**）｜`#7a5a4a` 木褐 |
| 主光 | 一盏街灯，钠黄色，从上方斜下；雨幕与湿地面反光补齐层次 |
| 质感 | 湿沥青、玻璃、雨伞、呢子大衣、门廊瓷砖 |
| 差异化 | 唯一「同框但分离」的一款——两个人各在一侧、一明一暗，**从不同框对视** |
| 禁止（硬性） | 裸露、亲密接触、拥抱接吻、床、身体特写、酒精、烟雾、红色唇部特写、任何性暗示 |

### ① icon — 1:1

```text
A minimal emblem: a single closed umbrella standing against a wet wall under a street lamp, one thin band of warm sodium light across it. Rain-dark teal and one warm yellow accent, flat painterly shading, bold simple silhouette, perfectly centred, no people, no text.
```

### ② portrait — 2:3

```text
Vertical rainy-night key art: a narrow street door under a sodium street lamp, wet tiles, one closed umbrella leaning by the door, warm light falling across rain. No people visible. Teal-black night with one warm yellow pool. Rain streaks catch the light. The door and lamp sit in the middle band; the top quarter is dark wall. Painterly, restrained, cinematic. No figures, no text.
```

### ③ header — 3:2（上下会被裁）

```text
Wide night banner: a rain-soaked street corner, one sodium street lamp at the right third casting warm light through rain onto wet asphalt, a single lit window above. The left half is dark wet wall with almost no detail — it will carry the title text. Teal-black with one warm accent, strong reflections. Keep content in the central band. No people, no signage with letters. No text.
```

### ④ library-hero — 3:2（裁成很窄的横条）

```text
An ultra-wide quiet background meant to be cropped into a thin strip: an empty rain-soaked street at night, one street lamp far at the right, wet asphalt mirroring the light, closed shutters along the left. Everything deep teal-black except the lamp's warm pool. Compose as a horizontal band; bottom third stays dark. No people, no text.
```

### ⑤ screenshot-01

```text
Wide scene in rain: two separate umbrellas far apart on the same wet street at night, one under the lamp and one in shadow, their reflections meeting on the asphalt but the people hidden beneath the umbrellas. No faces, no bodies, no contact. Teal night, one warm light. Painterly, restrained. No text.
```

### ⑥ screenshot-02

```text
Wide interior: a small apartment entryway at night, a wet coat on a hook, two pairs of shoes by the door, one dim warm lamp, rain on the window. No people, no bedroom, no bed. Teal and warm amber, painterly, still. No text.
```

### ⑦ screenshot-03

```text
Wide scene: a rain-streaked window at night seen from inside, blurred street lamp beyond, a single handprint fading on the glass, an empty chair. No people visible. Deep teal with warm bokeh outside. Painterly, quiet, ambiguous. No text.
```

---

## 5. 尺寸与投递

| 素材 | 你出的比例 | 我交付的尺寸 |
|---|---|---|
| icon | 1:1 | 64×64 |
| portrait | 2:3（**尽量原生竖构图**，别用横图裁） | 600×900 |
| header | 3:2（**主体留中间带**） | 920×430 |
| library-hero | 3:2（**只保留中间横条**） | 1920×620 |
| screenshot-01~03 | 16:9 | 1280×720 |

**上一批的教训**：B 批有两张 portrait 是从 16:9 横图裁出来的，构图能用但不是原生竖构图。**这一批请务必对 portrait 明确要求 2:3 竖版输出**，每个 prompt 里已经写了 `Vertical`，但生成时仍要确认比例是竖的。

**存放**：

```
art-inbox\
├─ clutch-protocol\   icon · portrait · header · library-hero · screenshot-01~03
├─ half-a-move\
├─ proxy-signature\
└─ accomplice\
```

logo 不用生成（英文副标：`CLUTCH PROTOCOL` / `HALF A MOVE` / `PROXY SIGNATURE` / `ACCOMPLICE`）。

## 6. 收图清单（28 张）

| 游戏 | icon | portrait | header | hero | ss-01 | ss-02 | ss-03 |
|---|---|---|---|---|---|---|---|
| 残局守则 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 一招半式 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 代签人 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 同谋 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## 7. 出图后自己先过这四条

1. **有没有文字**——这一批比前两批更危险：钢门、控制面板、合同纸、门上招牌、窗户，全是出字位
2. **portrait 是不是竖的**——不是竖版的原生构图就用横图裁，会丢主体
3. **同谋有没有越过红线**——出现任何亲密动作、身体特写、床、酒或烟，这张作废重出
4. **和 A/B 批并排像不像一家做的**——特别是残局守则别画成照片，一招半式别画成游戏海报

不达标的重生成。宁要构图普通，也不要留文字。
