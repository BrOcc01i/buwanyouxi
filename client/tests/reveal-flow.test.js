// 批次 2 自动化测试：揭示一次性、首次徽章幂等、启动计数、结果卡汇总（node:test）
// 运行：cd client && node --test tests/reveal-flow.test.js
// （Windows 下 node --test 目录形式会把目录当单个测试目标而报错，必须指定文件）
'use strict';
import { test } from 'node:test';
import assert from 'node:assert/strict';

/* ---------- shims（必须在 import src 前安装） ---------- */
class MemoryStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(String(k)) ? this.m.get(String(k)) : null; }
  setItem(k, v) { this.m.set(String(k), String(v)); }
  removeItem(k) { this.m.delete(String(k)); }
  clear() { this.m.clear(); }
}
global.localStorage = new MemoryStorage();
global.location = { search: '?downloadScale=0.02' };

const store = await import('../src/state/store.js');
const engine = await import('../src/state/download-engine.js');
const launch = await import('../src/flow/launch.js');
const resultCard = await import('../src/flow/result-card.js');
const { getState, STORAGE_KEY } = store;

/* ---------- 工具 ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, timeout = 10000, interval = 20) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    let v = false;
    try { v = fn(); } catch (e) { v = false; }
    if (v) return true;
    await sleep(interval);
  }
  return false;
}
const eventsNamed = (name) => getState().events.filter(e => e.event === name);
const reset = () => { store.resetAllData(); engine.stopEngine(); };

/* ================= 揭示一次性（§3.6） ================= */

test('markRevealSeen 幂等：重复调用只记一次 reveal 事件，firstRevealGameId 不被覆盖', () => {
  reset();
  store.markRevealSeen('stardust-miner');
  store.markRevealSeen('cloud-bakery');
  store.markRevealSeen('stardust-miner');
  const s = getState();
  assert.equal(s.profile.revealSeen, true);
  assert.equal(s.profile.firstRevealGameId, 'stardust-miner');
  assert.equal(eventsNamed('reveal').length, 1);
});

/* ================= 首次下载徽章 + 等待时长（§3.4） ================= */

test('首次 COMPLETED 解锁 first_download 徽章（幂等）；第二枚下载不重复解锁且等待时长累计', async () => {
  reset();
  engine.startEngine();
  engine.startDownload('stardust-miner');
  assert.ok(await waitFor(() => getState().library['stardust-miner']?.status === 'installed'), '第一枚应在时限内完成');

  let s = getState();
  assert.equal(s.profile.badges.length, 1);
  assert.equal(s.profile.badges[0].badgeId, 'first_download');
  assert.equal(eventsNamed('badge_unlock').length, 1);
  const wait1 = s.profile.stats.simulatedWaitMs;
  assert.ok(wait1 > 0, '首次完成应累计模拟等待时长');
  assert.equal(s.profile.stats.completedDownloads, 1);

  // 第二枚：徽章不重复、事件不重复、等待时长继续累计
  engine.startDownload('cloud-bakery');
  assert.ok(await waitFor(() => getState().library['cloud-bakery']?.status === 'installed'), '第二枚应在时限内完成');
  s = getState();
  assert.equal(s.profile.badges.length, 1, '徽章只解锁一次');
  assert.equal(eventsNamed('badge_unlock').length, 1, 'badge_unlock 事件只记一次');
  assert.equal(s.profile.stats.completedDownloads, 2);
  assert.ok(s.profile.stats.simulatedWaitMs > wait1, '等待时长应单调累计');
  engine.stopEngine();
});

/* ================= 伪启动计数与去向（§3.9） ================= */

test('recordLaunch：仅已安装游戏计数；launchCount 与 launchTotal 同步累计', () => {
  reset();
  // 直接构造 installed 与 owned 两种库内状态（store 层守卫验证）
  store.dispatch(s => ({
    ...s,
    library: {
      'stardust-miner': { gameId: 'stardust-miner', status: 'installed', ownedAt: Date.now(), installedAt: Date.now(), progress: 1, favorite: false, lastLaunchedAt: null, launchCount: 0 },
      'cloud-bakery': { gameId: 'cloud-bakery', status: 'owned', ownedAt: Date.now(), installedAt: null, progress: 0, favorite: false, lastLaunchedAt: null, launchCount: 0 },
    },
  }));
  store.recordLaunch('cloud-bakery');            // owned → 忽略
  assert.equal(getState().profile.stats.launchTotal, 0);

  store.recordLaunch('stardust-miner');
  store.recordLaunch('stardust-miner');
  store.recordLaunch('unknown-game');            // 未知 → 忽略
  const s = getState();
  assert.equal(s.library['stardust-miner'].launchCount, 2);
  assert.equal(s.profile.stats.launchTotal, 2);
  assert.ok(s.library['stardust-miner'].lastLaunchedAt > 0);
  assert.equal(eventsNamed('launch').length, 2);
});

test('launchDestination：未揭示 → #/reveal/:id；已揭示 → #/library', () => {
  reset();
  const s0 = getState();
  assert.equal(launch.launchDestination(s0, 'stardust-miner'), '#/reveal/stardust-miner');
  store.markRevealSeen('stardust-miner');
  assert.equal(launch.launchDestination(getState(), 'stardust-miner'), '#/library');
});

/* ================= 结果卡纯逻辑（§3.8） ================= */

test('buildResultSummary：问卷未提交返回 null；提交后字段完整、等待时长优先取首款任务', () => {
  reset();
  assert.equal(resultCard.buildResultSummary(getState()), null);

  // 构造：首款完成游戏 + 已揭示 + 徽章 + 问卷
  store.dispatch(s => ({
    ...s,
    library: {
      'stardust-miner': { gameId: 'stardust-miner', status: 'installed', ownedAt: Date.now(), installedAt: Date.now(), progress: 1, favorite: false, lastLaunchedAt: null, launchCount: 1 },
    },
    downloads: [{
      id: 'dl_x', gameId: 'stardust-miner', stage: 'COMPLETED', resumeStage: null, progress: 1, paused: false,
      stageElapsedMs: 0, stageDurationMs: 0, totalElapsedMs: 102000, queuedAt: Date.now(), startedAt: Date.now(), completedAt: Date.now(),
    }],
    profile: {
      ...s.profile,
      revealSeen: true, firstRevealGameId: 'stardust-miner',
      badges: [{ badgeId: 'first_download', unlockedAt: Date.now() }],
      stats: { completedDownloads: 1, launchTotal: 1, simulatedWaitMs: 102000 },
    },
  }));
  const res = store.submitSurvey({ q1: 4, q2: '选择并获取游戏' });
  assert.equal(res.ok, true);
  assert.equal(res.ownerType, '期待收藏家');

  const sm = resultCard.buildResultSummary(getState());
  assert.equal(sm.ownerType, '期待收藏家');
  assert.equal(sm.firstGameName, '星尘矿工');
  assert.equal(sm.waitMs, 102000);
  assert.equal(sm.waitText, '1 分 42 秒');
  assert.equal(sm.ownedCount, 1);
  assert.equal(sm.launchTotal, 1);
  assert.equal(sm.badge.id, 'first_download');

  const text = resultCard.buildResultText(sm);
  assert.ok(text.includes('期待收藏家'));
  assert.ok(text.includes('《星尘矿工》'));
  assert.ok(text.includes('首次下载'));
});

test('buildResultSummary：下载记录被清除时回退到累计等待时长', () => {
  reset();
  // 批次 6 起徽章由状态自动派生：completedDownloads=0 时 first_download 不会被自动补发，
  // 才能走到「结果卡徽章为空」这条分支
  store.dispatch(s => ({
    ...s,
    profile: {
      ...s.profile,
      revealSeen: true, firstRevealGameId: 'stardust-miner',
      stats: { completedDownloads: 0, launchTotal: 1, simulatedWaitMs: 45000 },
    },
  }));
  store.submitSurvey({ q1: 2, q2: '看着下载进度推进' }); // Q1≤2 → 清醒观察者
  const sm = resultCard.buildResultSummary(getState());
  assert.equal(sm.ownerType, '清醒观察者');
  assert.equal(sm.waitMs, 45000, '无完成记录 → 回退 simulatedWaitMs');
  assert.equal(sm.badge, null, '无徽章时结果卡徽章为空');
});

/* ================= Q3 持久化（返修①） ================= */

test('Q3：提交后保存；normalize（模拟重启）后仍能读到；超长截断 200、非字符串降级 null', () => {
  reset();
  // 正常提交
  const r1 = store.submitSurvey({ q1: 4, q2: '安装完成', q3: '安装完成那一刻最开心。' });
  assert.equal(r1.ok, true);
  assert.equal(getState().survey.q3, '安装完成那一刻最开心。');

  // 模拟重启：localStorage 已持久化 → normalize 重新加载后 q3 保留
  const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(persisted.survey.q3, '安装完成那一刻最开心。');
  const reloaded = store.normalize(persisted);
  assert.equal(reloaded.survey.q3, '安装完成那一刻最开心。');

  // 超长 q3：安全截断到 200，提交不失败
  reset();
  const long = 'x'.repeat(300);
  const r2 = store.submitSurvey({ q1: 3, q2: '看着下载进度推进', q3: long });
  assert.equal(r2.ok, true);
  assert.equal(getState().survey.q3.length, 200);
  assert.equal(store.normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))).survey.q3.length, 200);

  // 非字符串 q3：安全降级为 null，提交不失败
  reset();
  const r3 = store.submitSurvey({ q1: 5, q2: '点击开始游戏', q3: 12345 });
  assert.equal(r3.ok, true);
  assert.equal(getState().survey.q3, null);

  // 空字符串 q3：允许
  reset();
  const r4 = store.submitSurvey({ q1: 2, q2: '没什么感觉', q3: '' });
  assert.equal(r4.ok, true);
  assert.equal(getState().survey.q3, '');

  // normalize 对持久化中的非法 q3（对象/数字）降级为 null，不崩
  const bad = { version: 2, survey: { q1: 4, q2: '安装完成', q3: { hack: true }, submittedAt: Date.now() } };
  assert.equal(store.normalize(bad).survey.q3, null);
  const bad2 = { version: 2, survey: { q1: 4, q2: '安装完成', q3: 999, submittedAt: Date.now() } };
  assert.equal(store.normalize(bad2).survey.q3, null);
});
