// 结果卡纯逻辑（§3.8）：与 DOM 解耦，便于自动化测试
'use strict';
import { GAME_MAP } from '../data/games.js';
import { BADGES } from '../data/badges.js';

export function formatWaitMs(ms) {
  const total = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
}

// 汇总结果卡字段；survey 未提交时返回 null
export function buildResultSummary(state) {
  const survey = state && state.survey;
  if (!survey) return null;
  const firstGameId = state.profile.firstRevealGameId;
  // 本次模拟等待时间：优先取首款完成任务的累计耗时（记录被清除时回退累计值）
  const firstTask = state.downloads.find(d => d.stage === 'COMPLETED' && d.gameId === firstGameId);
  const waitMs = firstTask
    ? Math.round(firstTask.totalElapsedMs || 0)
    : (state.profile.stats.simulatedWaitMs || 0);
  return {
    ownerType: survey.ownerType,
    firstGameId,
    firstGameName: (firstGameId && GAME_MAP[firstGameId] && GAME_MAP[firstGameId].name) || firstGameId || '—',
    waitMs,
    waitText: formatWaitMs(waitMs),
    ownedCount: Object.keys(state.library).length,
    launchTotal: (state.profile.stats.launchTotal || 0),
    badge: state.profile.badges.some(b => b.badgeId === 'first_download')
      ? BADGES.first_download
      : null,
  };
}

// 复制用结果文案（§3.8：不自动分享、不生成公开链接、不传输数据）
export function buildResultText(summary) {
  if (!summary) return '';
  return [
    '【不玩游戏】我的拥有者类型：' + summary.ownerType,
    '首款完成的游戏：《' + summary.firstGameName + '》',
    '本次模拟等待：' + summary.waitText,
    '当前拥有：' + summary.ownedCount + ' 款游戏',
    '累计伪启动：' + summary.launchTotal + ' 次',
    summary.badge ? '已解锁徽章：' + summary.badge.name : '',
    '—— 一种关于期待与拥有的体验（完全离线，数据仅保存在本机）',
  ].filter(Boolean).join('\n');
}
