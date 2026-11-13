// 库页面纯逻辑（批次 3，§4.3/§6.1）：排序与「接下来畅玩」选择器
// 抽成纯函数便于 node --test 断言「搜索∩筛选∩排序组合结果稳定」
'use strict';

/**
 * 左栏排序（审核修订②固定规则）
 * @param {string[]} ids 候选 gameId（已过搜索与状态筛选）
 * @param {Record<string, {lastLaunchedAt?:number|null, ownedAt?:number}>} libMap library 映射
 * @param {'default'|'recent'} sort
 * recent：lastLaunchedAt 倒序 → 无记录按 ownedAt 倒序 → gameId 升序稳定
 */
export function sortLibraryIds(ids, libMap, sort) {
  if (sort !== 'recent') return [...ids];
  return [...ids].sort((a, b) => {
    const la = libMap[a] || {}, lb = libMap[b] || {};
    const ra = la.lastLaunchedAt || 0, rb = lb.lastLaunchedAt || 0;
    if (ra !== rb) return rb - ra;
    const oa = la.ownedAt || 0, ob = lb.ownedAt || 0;
    if (oa !== ob) return ob - oa;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/**
 * §6.1 接下来畅玩：只含 owned/installed（排除 downloading/不存在条目），
 * 按 launchCount 升序（0 次优先）→ gameId 升序稳定，最多 limit 款
 * @returns {string[]}
 */
export function pickUpNext(ids, libMap, limit = 4) {
  return ids
    .filter(id => {
      const lib = libMap[id];
      return lib && (lib.status === 'installed' || lib.status === 'owned');
    })
    .sort((a, b) => {
      const ca = libMap[a].launchCount || 0, cb = libMap[b].launchCount || 0;
      if (ca !== cb) return ca - cb;
      return a < b ? -1 : a > b ? 1 : 0;
    })
    .slice(0, limit);
}

/**
 * §4.3 状态筛选（返修②收紧）：候选必须先过 library——
 * 仅保留在库（owned/installed/downloading）的条目，未获取的游戏任何模式下都不出现；
 * installed 仅已安装；notinstalled 在库但未安装（owned/downloading）
 */
const LIB_STATUSES = ['owned', 'installed', 'downloading'];
export function applyStatusFilter(ids, libMap, mode) {
  const inLib = ids.filter(id => {
    const lib = libMap[id];
    return !!lib && LIB_STATUSES.includes(lib.status);
  });
  if (mode === 'installed') return inLib.filter(id => libMap[id].status === 'installed');
  if (mode === 'notinstalled') return inLib.filter(id => libMap[id].status !== 'installed');
  return inLib;
}
