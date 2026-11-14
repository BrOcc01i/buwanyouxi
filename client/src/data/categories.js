// 商店分类枚举（唯一真源）：新增/调整分类只改这里，页面不得硬编码中文文案
export const CATEGORIES = [
  { key: 'rpg', label: '角色扮演', order: 1 },
  { key: 'shooter', label: '射击', order: 2 },
  { key: 'action', label: '动作', order: 3 },
  { key: 'strategy', label: '策略', order: 4 },
  { key: 'simulation', label: '模拟', order: 5 },
  { key: 'casual', label: '休闲', order: 6 },
  { key: 'horror', label: '恐怖', order: 7 },
  { key: 'tools', label: '工具', order: 8 },
];

export const CATEGORY_KEYS = CATEGORIES.map(c => c.key);
export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

// 校验：分类值必须落在枚举内（数据契约测试使用）
export const isCategoryKey = key => CATEGORY_KEYS.includes(key);

// 给页面用的标签；未知分类降级为「未分类」，不抛异常
export function categoryLabel(key) {
  return (CATEGORY_MAP[key] && CATEGORY_MAP[key].label) || '未分类';
}
