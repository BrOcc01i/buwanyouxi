# 给 GPT 的出图指令 · A 批 4 款

> 用途：把这份文档里的内容一条一条发给 GPT（ChatGPT / GPT-4o 图像），生成 28 张图。
> 规格来源：`design/art/A批素材PromptPack.md`（美术已核过尺寸与裁切）。本文件只是把它改成「可直接粘贴」的形态。

---

## 使用说明（30 秒）

1. **新开一个对话**，先把下面「开场设定」整段贴进去，只贴一次。
2. 之后**一张图一条消息**，只发每个小节代码块里的英文内容。GPT 会保持风格连续。
3. 出图后按每节的「存成」改名，丢进 `E:\wb-project\不玩游戏\art-inbox\<gameId>\`。
4. **4 个 logo 不要生成**（第 29 节），模型画文字必出伪字形，我手写矢量。
5. 静帧（stillframe）的 5 张**单独开一个对话**生成，别和另外三款混在一起——它没有主体，混着生成会被带跑偏。

---

## 开场设定（贴一次）

```text
You are making cover art for a fictional offline game client. All art will be shown in a dark UI (page background #171a21) at small sizes: 64px icons, 140px tall cards, and 300px tall banners.

Apply these rules to every image:

1. ONE light source only, high angle 30–45°, from the left or right third. The shadow side must be cold — tinted toward deep blue-teal, never neutral black.
2. Two value zones only. Keep the base dark, roughly between 10% and 32% luminance. Do NOT use mid-grey (35–60%) as a base — it reads amateur. One accent hue only, covering 8–15% of the frame, and it should be the only saturated thing.
3. Put the subject off-centre, around 55–70% across. Leave one continuous, low-detail area of at least 25% of the frame for UI text to sit on.
4. Hand-painted digital illustration: visible brush edges, fine line work, paper grain, some soft focus. No photorealism, no 3D render, no plastic highlights, no flat vector, no glossy CGI.
5. Absolutely NO text anywhere. No letters, numbers, words, captions, signage, labels, plates, watermarks or logos. Any sign, poster, map, screen, notebook or package must be completely blank.

Output wide landscape 3:2 unless the message says otherwise. I will crop it myself.
```

---

## 生成顺序

| 轮次 | 内容 | 说明 |
|---|---|---|
| 第 1 轮 | rail-end 全部 7 张 | 先跑通风格 |
| 第 2 轮 | grey-line 全部 7 张 | 冷调，与上一款拉开 |
| 第 3 轮 | coin-laundry 全部 7 张 | 暖调，但靠人工光源区分 |
| 第 4 轮 | **新开对话** → stillframe 5 张 | 无主体，必须单独一轮 |

---

## 1. `rail-end` · 铁轨尽头 · icon

**存成**：`art-inbox/rail-end/icon.png` ｜ **比例**：1:1 正方形

```text
A minimal game icon emblem: a single iron rail spur ending abruptly in cracked dry earth, seen from directly above. Deep umber ground, one brass rim-light running along the rail head. Flat painterly shading, bold simple silhouette, perfectly centred, generous empty margin on all four sides, no text.
```

## 2. `rail-end` · portrait

**存成**：`art-inbox/rail-end/portrait.png` ｜ **比例**：2:3 竖版

```text
Vertical western key art: a dust-caked steam locomotive stalled on unfinished track at dusk, a low amber sun behind it throwing long shadows toward the viewer, pale empty sky filling the upper quarter, drifting alkali dust. Muted earth palette, painterly oil illustration. The locomotive sits in the middle band vertically — the top quarter is empty sky and the bottom edge is dark ground, both may be cropped. No people, no text.
```

## 3. `rail-end` · header（焦点横幅）

**存成**：`art-inbox/rail-end/header.png` ｜ **比例**：3:2 横版，**上下会被裁掉，主体留在中间带**

```text
Wide cinematic banner: rusted rails running in from the lower left toward a bleached horizon on the right third, one small rider silhouette facing away in the distance, low sun glow at upper right. The left half is a calm dark dust haze with almost no detail — it will carry the title text. Painterly, muted brown and dull brass. Keep all content inside the central 60% vertically; top and bottom will be cropped. No text.
```

## 4. `rail-end` · library-hero（库详情背景）

**存成**：`art-inbox/rail-end/library-hero.png` ｜ **比例**：3:2 横版，**会裁成很窄的横条，只保留中间横带**

```text
An ultra-wide quiet background meant to be cropped into a thin horizontal strip: inside an abandoned rail depot at night, cold moonlight falling through broken roof slats, a single warm lantern deep in the frame. Deep shadow across the lower third, empty wall on the left, matte painterly texture, desaturated umber and slate. Compose everything as one horizontal band across the middle; the bottom third must stay dark and empty. No people, no text.
```

## 5. `rail-end` · screenshot-01

**存成**：`art-inbox/rail-end/screenshot-01.png` ｜ **比例**：16:9 横版

```text
Wide in-world scene: an empty main street of a wooden frontier town at noon, heat shimmer above the boards, one hitching post and a water trough, long hard shadows. No people. Muted dust palette, painterly illustration, flat cinematic framing. Every signboard is blank weathered wood. No text.
```

## 6. `rail-end` · screenshot-02

**存成**：`art-inbox/rail-end/screenshot-02.png` ｜ **比例**：16:9 横版

```text
Wide night scene: a small campfire beside an overloaded pack mule, a bedroll and a tin cup on the ground. Warm firelight on the near side, cold blue distance behind, sage brush silhouettes. No people — the fire is burning and whoever lit it is elsewhere. Painterly, low saturation, quiet. No text.
```

## 7. `rail-end` · screenshot-03

**存成**：`art-inbox/rail-end/screenshot-03.png` ｜ **比例**：16:9 横版

```text
Wide dusk scene: a stopped freight train on a trestle above a dry riverbed, seen from far away at a low angle, one lantern moving along the cars, dust in the air. Amber and slate palette, painterly. The bridge crosses the frame in the middle band; the upper third is clean empty sky. No people, no violence, no text.
```

---

## 8. `grey-line` · 灰线 · icon

**存成**：`art-inbox/grey-line/icon.png` ｜ **比例**：1:1 正方形

```text
A minimal military-map emblem: a thin pale supply-route line cutting diagonally across dark olive terrain seen from above, one small ember-orange dot resting on the line. Dense flat fog. The line must stay clearly visible at very small sizes — make it a bold stroke. Painterly minimal shading, centred, no text.
```

## 9. `grey-line` · portrait

**存成**：`art-inbox/grey-line/portrait.png` ｜ **比例**：2:3 竖版

```text
Vertical military key art: six soldiers in rain-soaked gear walking away down a flooded supply road at first light, seen from behind, heavy fog swallowing the far distance. Flat cold overcast light, faces completely hidden. Muted olive and graphite, painterly illustration. The group sits in the middle band vertically, heads below the top quarter. No gore, no flags, no text.
```

## 10. `grey-line` · header（焦点横幅）

**存成**：`art-inbox/grey-line/header.png` ｜ **比例**：3:2 横版，**上下会被裁掉**

```text
Wide banner: a mud-covered supply truck stopped on a rutted road at the right third, dim headlights lost in fog, aiming back toward the left. An empty grey field and low cloud fill the left half with almost no detail — it will carry the title text. Overcast flat light, cold desaturated olive, painterly matte. Keep the truck inside the central band vertically. Anything resembling a license plate must be blank. No text.
```

## 11. `grey-line` · library-hero（库详情背景）

**存成**：`art-inbox/grey-line/library-hero.png` ｜ **比例**：3:2 横版，**裁成窄横条**

```text
An ultra-wide quiet background meant to be cropped into a thin horizontal strip: an empty roadside checkpoint at night, rain on wet concrete, one small red signal lamp far down the road, vast fog on the left. Deep shadow across the lower third, cold graphite and olive tones, painterly. Keep everything in the central horizontal band; the lamp is the only saturated point and should be tiny. No people, no barriers with lettering, no text.
```

## 12. `grey-line` · screenshot-01

**存成**：`art-inbox/grey-line/screenshot-01.png` ｜ **比例**：16:9 横版

```text
Wide in-world scene: a paved supply road in heavy fog, a canvas-covered truck half in frame at the right edge, wet asphalt reflecting diffuse sky, telegraph poles fading into white. Cold olive palette, painterly. No people, no city, no text.
```

## 13. `grey-line` · screenshot-02

**存成**：`art-inbox/grey-line/screenshot-02.png` ｜ **比例**：16:9 横版

```text
Wide interior at night: inside a truck cab, a completely blank unmarked map spread on the dash, lit by one small dome light. Rain streaking the windshield, dark hills beyond, worn canvas and scratched metal. The map and every label on the dash must be blank paper and blank plastic. Painterly, muted. No hands, no glowing screens, no text.
```

## 14. `grey-line` · screenshot-03

**存成**：`art-inbox/grey-line/screenshot-03.png` ｜ **比例**：16:9 横版

```text
Wide scene in rain: four soldiers resting under a stretched tarp beside a ditch, heads down so no faces are visible, gear stacked nearby, grey water dripping. No wounds, no combat. Flat overcast light, cold olive and rust palette, painterly, quiet. No text.
```

---

## 15. `coin-laundry` · 投币洗衣房 · icon

**存成**：`art-inbox/coin-laundry/icon.png` ｜ **比例**：1:1 正方形

```text
A minimal emblem: a front-loading washing machine porthole seen straight on, dark glass, one small amber coin resting against the rim. Cool fluorescent rim light from the upper left. Flat painterly shading, bold circular silhouette, perfectly centred. No brand labels, no bubbles, no text.
```

## 16. `coin-laundry` · portrait

**存成**：`art-inbox/coin-laundry/portrait.png` ｜ **比例**：2:3 竖版

```text
Vertical key art: a small coin laundry at two in the morning, one customer asleep on a plastic chair beside a spinning drum, a warm amber bulb over the counter, cold fluorescent tubes above, wet linoleum reflections on the floor. The sleeper's face is turned away and unreadable. Painterly, muted. Figure and drum sit in the middle band vertically; the top quarter is ceiling and tubes. No neon, no text.
```

## 17. `coin-laundry` · header（焦点横幅）

**存成**：`art-inbox/coin-laundry/header.png` ｜ **比例**：3:2 横版，**上下会被裁掉**

```text
Wide banner: a row of front-loading washers glowing at the right third of a dim laundromat, stacked plastic baskets beside them, one hanging amber bulb. The left half is a dark quiet wall with a blank payphone — it will carry the title text. Warm amber against cool grey, painterly, night. Keep the washers inside the central band vertically. No neon, no lettering on the machines, no text.
```

## 18. `coin-laundry` · library-hero（库详情背景）

**存成**：`art-inbox/coin-laundry/library-hero.png` ｜ **比例**：3:2 横版，**裁成窄横条**

```text
An ultra-wide quiet background meant to be cropped into a thin horizontal strip: an empty laundromat after closing, one fluorescent tube over the folding table, deep shadow across the lower third, worn tile and chrome. Warm amber against cold grey, painterly. Nobody in the frame, but traces of people everywhere. Keep the table in the central band; the left third is bare tiled wall. No graffiti, no text.
```

## 19. `coin-laundry` · screenshot-01

**存成**：`art-inbox/coin-laundry/screenshot-01.png` ｜ **比例**：16:9 横版

```text
Wide interior scene: a folding table under a fluorescent tube, a plastic basket of warm towels, one coin tray with scattered coins, worn tile floor, night. Warm and cold mixed light. No people. The coins are the brightest small points in the frame. Painterly. No price tags, no cash register with digits, no text.
```

## 20. `coin-laundry` · screenshot-02

**存成**：`art-inbox/coin-laundry/screenshot-02.png` ｜ **比例**：16:9 横版

```text
Wide counter scene: a worn laminate counter at night, an open notebook with completely blank pages, a ballpoint pen, a small radio, a chipped mug. Amber bulb light from the upper left casting a hard shadow. No people. Painterly, muted. The notebook page must be pure blank paper. No text.
```

## 21. `coin-laundry` · screenshot-03

**存成**：`art-inbox/coin-laundry/screenshot-03.png` ｜ **比例**：16:9 横版

```text
Wide dawn scene: the laundromat window seen from inside, pale blue morning light outside blown out to almost white with no street detail, one empty chair with a folded jacket left on it, floor reflections. Quiet, muted amber and blue, painterly. No people, no text.
```

---

## 22–28. `stillframe` · 静帧（**新开一个对话**）

先在新对话里重新贴一次「开场设定」，并且在开场设定后面追加这一段：

```text
This set is different: these are ambient wallpapers, not game covers. There is NO subject, NO character, NO building, NO vehicle, NO animal. The image is mostly empty air, water and light. Keep contrast low and saturation very low — this must be comfortable to stare at for a long time. Do not add anything to fill the emptiness.
```

## 22. `stillframe` · icon

**存成**：`art-inbox/stillframe/icon.png` ｜ **比例**：1:1 正方形

```text
A minimal emblem: a soft-edged rectangular window filled with a slow dusk gradient, a thin pale frame, one faint horizon line inside. Flat minimal shading, calm, perfectly centred with generous margin. It should read as "a rectangle of sky", not as software. No interface elements, no play button, no cursor, no text.
```

## 23. `stillframe` · portrait

**存成**：`art-inbox/stillframe/portrait.png` ｜ **比例**：2:3 竖版

```text
Vertical ambient landscape: layered mountain ridges dissolving into pale mist, a flat dusk sky filling the upper half. No focal object, no figures, extremely soft edges, low saturation teal and warm sand, painterly haze. Horizon around the middle of the frame; three or four ridge layers, each fainter than the last. Nothing may be added to the empty sky. No text.
```

## 24. `stillframe` · header（焦点横幅）

**存成**：`art-inbox/stillframe/header.png` ｜ **比例**：3:2 横版，**上下会被裁掉**

```text
Wide panoramic landscape: a still lake at dusk, flat mirror water filling the left half, one distant reed bank at the right, hairline horizon, soft gradient sky. No subject, no figures. Muted teal and pale amber, painterly minimal. The left 48% must be only water and gradient — it will carry the title text. Keep all content in the central band vertically. No text.
```

## 25. `stillframe` · library-hero（库详情背景）

**存成**：`art-inbox/stillframe/library-hero.png` ｜ **比例**：3:2 横版，**裁成窄横条**

```text
An ultra-wide still landscape meant to be cropped into a thin strip: slow clouds over a dark hill line along the bottom edge, a few very faint stars above, one warm ember of light on the horizon at the right. Everything soft and low contrast, deep teal and charcoal, painterly. The hill line hugs the bottom; the upper 60% is deep blue sky with only a handful of faint stars. No moon, no aurora, no city, no text.
```

## 26. `stillframe` · screenshot-01

**存成**：`art-inbox/stillframe/screenshot-01.png` ｜ **比例**：16:9 横版

```text
A still frame: rain running down a dark window pane, blurred warm street light beyond, shallow focus, soft bokeh. No figures, no legible signs, no window sill or interior furniture. Muted teal and amber, painterly, calm. This shows the wallpaper itself, not the software. No text.
```

## 27. `stillframe` · screenshot-02

**存成**：`art-inbox/stillframe/screenshot-02.png` ｜ **比例**：16:9 横版

```text
A still frame: light caustics rippling across the sandy floor of shallow clear water, seen from just above the surface. Slow gradient from pale green to deep blue, no fish, no figures, no coral. Painterly, minimal. Nearly the whole frame is water and light. No text.
```

## 28. `stillframe` · screenshot-03

**存成**：`art-inbox/stillframe/screenshot-03.png` ｜ **比例**：16:9 横版

```text
A still frame: fine snow falling over a dark pine ridge, low cloud moving through the trees, one pale break in the sky at the right. No buildings, no smoke, no figures, no animal tracks. Desaturated blue-grey, painterly, quiet, sparse snow. No text.
```

---

## 29. logo（**不要发给模型**）

4 个 logo 我手写 SVG，同名 6 个现有 logo 已经这么做了。你不需要生成，也不要用模型试——模型画中文必出伪字形，混进去会被并排看出问题。

要用的只是这几个词，别改：

| 游戏 | 英文副标 |
|---|---|
| 铁轨尽头 | `RAIL END` |
| 灰线 | `GREY LINE` |
| 静帧 | `STILLFRAME` |
| 投币洗衣房 | `COIN LAUNDRY` |

---

## 30. 生成后怎么给我

```
art-inbox/
├─ rail-end/          icon.png portrait.png header.png library-hero.png screenshot-01..03.png
├─ grey-line/         同上 7 张
├─ coin-laundry/      同上 7 张
└─ stillframe/        同上 7 张（icon/portrait/header/library-hero/screenshot-01..03）
```

- 出图是 1024 或 1536 长边，**不要自己裁**，给我原图，我按运行时尺寸裁
- 命名对不上没关系，但**别混文件夹**——4 个目录分清楚就行
- 每张出图后自己先看一眼：**有没有冒出来的文字**。有字的重生成，别留着

## 31. 收图清单（28 张）

| 游戏 | icon | portrait | header | hero | ss-01 | ss-02 | ss-03 |
|---|---|---|---|---|---|---|---|
| 铁轨尽头 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 灰线 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 投币洗衣房 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 静帧 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

收齐后我做三件事：统一裁切到运行时尺寸 → 转 webp → 跑一遍明度/饱和度/死黑校验，不合格的会挑出来重生成。
