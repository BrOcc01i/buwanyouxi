# 出图投递目录

按游戏名分目录，把 GPT 生成的**原图**丢进去即可，不用自己裁、不用改格式、不用转 webp。

```
art-inbox/
├─ rail-end/          铁轨尽头      ✅ 已交付
├─ grey-line/         灰线          ✅ 已交付
├─ coin-laundry/      投币洗衣房    ✅ 已交付
├─ stillframe/        静帧          ✅ 已交付
├─ ninth-awakening/   第九次醒来    ⬜ 待出图
├─ staff-mercy/       棍下留人      ⬜ 待出图
├─ threshing-floor/   晒谷场        ⬜ 待出图
└─ one-tile-realm/    一格山河      ⬜ 待出图
```

每个目录 7 个文件：

| 文件名 | 比例 |
|---|---|
| `icon.png` | 1:1 |
| `portrait.png` | 2:3 |
| `header.png` | 3:2（主体留中间带，会裁成 2.14:1） |
| `library-hero.png` | 3:2（只留中间横条，会裁成 3.1:1） |
| `screenshot-01.png` | 16:9 |
| `screenshot-02.png` | 16:9 |
| `screenshot-03.png` | 16:9 |

`logo.svg` 不用出，我手写矢量。

命名能对上最好，对不上但目录放对也能认。出图后请先自己扫一眼有没有冒出来的文字——有字的重生成，别留着。

生成用的提示词：B 批见 `design/art/GPT出图指令-B批.md`，A 批见 `design/art/GPT出图指令.md`。
