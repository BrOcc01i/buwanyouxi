// 徽章解锁判定（纯函数）：只读状态，返回「当前已满足」的全部徽章，不判断是否已解锁
// 由 store.dispatch 统一去重后写入，避免在订阅回调里再次 dispatch 造成重入
'use strict';
import { GAMES } from '../data/games.js';

const TOTAL_GAMES = GAMES.length;
const SAFE = { badges: [], library: {}, gifts: [], stats: {}, profile: {} };

const num = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

// 取最早安装完成的游戏作为事件归属（动态区要能显示）
function firstInstalledGame(library) {
  let best = null;
  let bestAt = Infinity;
  for (const [id, entry] of Object.entries(library || {})) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.status !== 'installed' && typeof entry.installedAt !== 'number') continue;
    const at = typeof entry.installedAt === 'number' ? entry.installedAt : Number.MAX_SAFE_INTEGER;
    if (at < bestAt) { bestAt = at; best = id; }
  }
  return best;
}

/**
 * @param {object} state 完整或部分状态
 * @returns {Array<{ id: string, gameId: string|null }>} 已满足条件的徽章
 */
export function evaluateBadges(state) {
  const s = state && typeof state === 'object' ? state : SAFE;
  const profile = s.profile && typeof s.profile === 'object' ? s.profile : SAFE.profile;
  const stats = profile.stats && typeof profile.stats === 'object' ? profile.stats : SAFE.stats;
  const library = s.library && typeof s.library === 'object' ? s.library : SAFE.library;
  const gifts = Array.isArray(s.gifts) ? s.gifts : SAFE.gifts;
  const ownedCount = Object.keys(library).length;

  const hit = [];
  const add = (id, gameId = null) => hit.push({ id, gameId });

  if (num(stats.completedDownloads) >= 1) add('first_download', firstInstalledGame(library));
  if (num(stats.launchTotal) >= 1) add('first_launch');
  if (profile.revealSeen === true) add('first_reveal', typeof profile.firstRevealGameId === 'string' ? profile.firstRevealGameId : null);
  if (gifts.length >= 1) add('first_gift', typeof gifts[0].gameId === 'string' ? gifts[0].gameId : null);
  if (ownedCount >= 3) add('shelf_three');
  if (num(stats.launchTotal) >= 10) add('launch_ten');
  if (s.survey && typeof s.survey === 'object' && typeof s.survey.ownerType === 'string') add('survey_done');
  if (ownedCount >= TOTAL_GAMES) add('shelf_all');

  return hit;
}

export { TOTAL_GAMES };
