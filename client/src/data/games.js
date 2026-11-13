// 6 款虚构游戏数据（与 虚拟下载体验/app.js 保持一致，独立为 ES module）
// C1（D1 决策）：新增静态虚构元数据 developer/releaseDate/playtimeHrs/lastPlayed，
//   随数据文件分发、不入 localStorage；installed 后在库页元数据行与详情事实表中展示。
// 批次 3（§9）：新增 assets 字段指向原创素材 webp/svg（Vite 静态资源管线）；
//   emoji + gradient 降级为「素材加载失败」占位（见 utils.js artFallback / shell.js 错误捕获）。
const assetUrl = (id, file) =>
  new URL(`../assets/games/${id}/${file}`, import.meta.url).href;

const withAssets = (list) => list.map((g) => ({
  ...g,
  assets: {
    icon: assetUrl(g.id, 'icon.webp'),
    portrait: assetUrl(g.id, 'portrait.webp'),
    header: assetUrl(g.id, 'header.webp'),
    hero: assetUrl(g.id, 'library-hero.webp'),
    logo: assetUrl(g.id, 'logo.svg'),
    screenshots: [1, 2, 3].map(i => assetUrl(g.id, `screenshot-0${i}.webp`)),
  },
}));

export const GAMES = withAssets([
  {
    id: 'stardust-miner', name: '星尘矿工', emoji: '⛏️',
    gradient: ['#1a2a6c', '#b21f1f'],
    hook: '在废弃星系里挖到宇宙尽头',
    desc: '像素风 roguelike 采矿。每一颗星星下面，都埋着上一个矿工的遗言。',
    tags: ['Roguelike', '像素', '孤独'],
    sizeMB: 2400, rating: 4.7, owners: 12804, publisher: 'NEBULA WORKS',
    developer: 'NEBULA WORKS', releaseDate: '2025年3月14日',
    playtimeHrs: 11.3, lastPlayed: '2026年8月30日',
  },
  {
    id: 'cloud-bakery', name: '云朵烘焙坊', emoji: '🧁',
    gradient: ['#f6d365', '#fda085'],
    hook: '在天空之城烤一块会呼吸的蛋糕',
    desc: '治愈系经营。客人都是云朵，它们只买刚出炉的、还带着温度的东西。',
    tags: ['治愈', '经营', '轻松'],
    sizeMB: 1200, rating: 4.9, owners: 21033, publisher: 'CLOUDHIVE STUDIO',
    developer: 'CLOUDHIVE STUDIO', releaseDate: '2024年11月2日',
    playtimeHrs: 26.5, lastPlayed: '2026年9月1日',
  },
  {
    id: 'neon-drift', name: '霓虹漂移', emoji: '🏎️',
    gradient: ['#0f0c29', '#302b63', '#24243e'],
    hook: '在雨夜霓虹里追上最后一班地铁',
    desc: '街机竞速。城市永远在下雨，你的轮胎烧出一条紫色的线。',
    tags: ['竞速', '霓虹', '街机'],
    sizeMB: 5800, rating: 4.5, owners: 15678, publisher: 'AFTERGLOW GAMES',
    developer: 'AFTERGLOW GAMES', releaseDate: '2025年6月20日',
    playtimeHrs: 3.2, lastPlayed: '2026年7月18日',
  },
  {
    id: 'corridor-seven', name: '第七走廊', emoji: '🕯️',
    gradient: ['#2c061f', '#5d1340', '#a63a50'],
    hook: '电梯只到 7 楼，而 7 楼不是这栋楼',
    desc: '第一人称恐怖解谜。你每天走同一条走廊，直到某天它多了一扇门。',
    tags: ['恐怖', '解谜', '沉浸'],
    sizeMB: 12000, rating: 4.2, owners: 8721, publisher: 'BLACK ANTENNA',
    developer: 'BLACK ANTENNA', releaseDate: '2024年10月31日',
    playtimeHrs: 8.9, lastPlayed: '2026年6月5日',
  },
  {
    id: 'orbit-market', name: '轨道市集', emoji: '🛰️',
    gradient: ['#0b3d91', '#1d976c'],
    hook: '把整个银河系，摆进你的货架',
    desc: '太空贸易模拟。凌晨四点的空间站，只有你在给下一个星区补货。',
    tags: ['经营', '模拟', '科幻'],
    sizeMB: 24000, rating: 4.3, owners: 9834, publisher: 'LOW-ORBIT LABS',
    developer: 'LOW-ORBIT LABS', releaseDate: '2025年9月9日',
    playtimeHrs: 42.7, lastPlayed: '2026年8月12日',
  },
  {
    id: 'echo-archive', name: '回声档案馆', emoji: '🗝️',
    gradient: ['#232526', '#414345', '#8e2de2'],
    hook: '每一段记忆，都要凭票才能取回',
    desc: '叙事解谜。你在一座存放旧声音的档案馆值夜班，今晚有人调走了 1998 年的雨。',
    tags: ['解谜', '叙事', '悬疑'],
    sizeMB: 48000, rating: 4.8, owners: 6420, publisher: 'SIGNAL VAULT',
    developer: 'SIGNAL VAULT', releaseDate: '2024年12月24日',
    playtimeHrs: 5.1, lastPlayed: '2026年5月30日',
  },
]);

export const GAME_MAP = Object.fromEntries(GAMES.map(g => [g.id, g]));

/**
 * 商店焦点推荐（§5.1，纯函数便于测试）：评分最高者，平手取声明序靠前
 * 焦点区底图使用 header.webp（修订①：portrait.webp 仅用于竖版卡片）
 */
export function pickFeatured(games) {
  let best = null;
  for (const g of games) {
    if (!best || g.rating > best.rating) best = g;
  }
  return best;
}
