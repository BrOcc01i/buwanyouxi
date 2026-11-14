// 批次 1 自动化测试：v2 状态模型、v1→v2 迁移、引擎调度、业务 API（node:test）
// 运行：cd client && node --test tests/state.test.js
//（注意：Windows 下 `node --test tests/` 目录形式会把目录当单个测试目标而报错，必须指定文件）
// 说明：
//   - 必须先安装 localStorage shim 再动态 import（store.js 模块加载时即读 localStorage）
//   - global.location.search 提供downloadScale=0.02 加速引擎（engine 模块加载时解析一次）
//   - 「重启恢复」用 localStorage 预置 + 带查询串的动态 import 模拟重新 normalize
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
const { getState, STORAGE_KEY } = store;
const { pickActiveTask } = engine;

/* ---------- 工具 ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(fn, timeout = 8000, interval = 20) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    let v = false;
    try { v = fn(); } catch (e) { v = false; }
    if (v) return true;
    await sleep(interval);
  }
  return false;
}
const seed = obj => localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
const lastEvent = (name) => [...getState().events].reverse().find(e => e.event === name) || null;

/* ================= 状态基础 ================= */

test('初始为 v3 空状态（含心意钱包与礼物）', () => {
  const s = getState();
  assert.equal(s.version, 3);
  assert.deepEqual(s.wallet, { balance: 66, spent: 0 });
  assert.deepEqual(s.gifts, []);
  assert.deepEqual(s.library, {});
  assert.deepEqual(s.downloads, []);
  assert.equal(s.settings.reducedMotion, false);
  assert.equal(s.settings.soundEnabled, true);
  assert.equal(s.settings.notificationsEnabled, true);
  assert.equal(s.settings.defaultRoute, '#/store');
  assert.equal(s.profile.welcomeSeen, false);
  assert.deepEqual(s.profile.stats, { completedDownloads: 0, launchTotal: 0, simulatedWaitMs: 0 });
  assert.equal(s.survey, null);
  assert.deepEqual(s.events, []);
});

test('startDownload 创建任务 + acquire 事件 + 收藏唯一真源', () => {
  const id = engine.startDownload('stardust-miner');
  assert.ok(id);
  let s = getState();
  assert.equal(s.downloads.length, 1);
  const t = s.downloads[0];
  assert.equal(t.stage, 'QUEUED');
  assert.equal(t.paused, false);
  assert.equal(t.resumeStage, null);
  assert.equal(t.progress, 0);
  assert.equal(t.completedAt, null);
  assert.equal(s.library['stardust-miner'].status, 'downloading');
  assert.equal(lastEvent('acquire').gameId, 'stardust-miner');

  // 收藏：写入 library[x].favorite，不再有顶层 favorites
  assert.equal(store.toggleFavorite('stardust-miner'), true);
  s = getState();
  assert.equal(s.library['stardust-miner'].favorite, true);
  assert.equal(s.favorites, undefined);
  assert.equal(lastEvent('favorite_change').extra.favorite, true);
  assert.equal(store.toggleFavorite('stardust-miner'), false);
  assert.equal(getState().library['stardust-miner'].favorite, false);
  // 未在库中的 gameId → null，不产生收藏
  assert.equal(store.toggleFavorite('corridor-seven'), null);
  assert.equal(getState().library['corridor-seven'], undefined);
});

/* ================= 引擎调度（§7.2） ================= */

test('暂停活动任务：paused+resumeStage+阶段耗时；暂停期间冻结；直接恢复不回退', async () => {
  engine.startEngine();
  try {
    // 引擎启动首个排队任务（stardust）
    assert.ok(await waitFor(() => {
      const t = getState().downloads.find(d => d.gameId === 'stardust-miner');
      return t && t.stage === 'DOWNLOADING' && t.progress > 0.05;
    }, 8000), '应进入 DOWNLOADING 且有进度');
    const t0 = getState().downloads[0];
    const p1 = t0.progress;

    engine.pauseDownload(t0.id);
    const paused = getState().downloads[0];
    assert.equal(paused.paused, true);
    assert.equal(paused.stage, 'DOWNLOADING');          // stage 保留原值
    assert.equal(paused.resumeStage, 'DOWNLOADING');    // 暂停前阶段
    assert.ok(paused.stageDurationMs > 0, '阶段时长已写入');
    assert.ok(paused.stageElapsedMs >= 0);
    assert.equal(paused.speedMBps, 0);

    await sleep(300); // 暂停期间不推进
    const frozen = getState().downloads[0];
    assert.equal(frozen.progress, p1, '暂停期间进度冻结');
    assert.equal(frozen.totalElapsedMs, t0.totalElapsedMs);

    // 无其他活动任务 → 直接恢复，进度不回退
    engine.resumeDownload(t0.id);
    const resumed = getState().downloads[0];
    assert.equal(resumed.paused, false);
    assert.equal(resumed.stage, 'DOWNLOADING');
    assert.ok(resumed.progress >= p1, '恢复后进度不回退');
    assert.ok(await waitFor(() => getState().downloads[0].progress > p1, 8000), '恢复后继续推进');

    // 事件
    assert.ok(lastEvent('download_pause'));
    assert.ok(lastEvent('download_resume'));
  } finally { /* 引擎在后续用例继续使用 */ }
});

test('恢复时存在活动任务 → 进队首等待（不抢占），队首还原阶段', async () => {
  const stardust = getState().downloads.find(d => d.gameId === 'stardust-miner');
  // 第二款排队
  engine.startDownload('neon-drift');
  // 暂停活动任务 → 下一个未暂停排队任务自动开始
  engine.pauseDownload(stardust.id);
  assert.ok(await waitFor(() => {
    const t = getState().downloads.find(d => d.gameId === 'neon-drift');
    return t && ['PREPARING', 'DOWNLOADING'].includes(t.stage) && !t.paused;
  }, 8000), '暂停后下一个排队任务自动开始');

  // 恢复 stardust：不中断 neon，stardust 进队首等待
  const savedProgress = stardust.progress;
  engine.resumeDownload(stardust.id);
  let s = getState();
  const st = s.downloads.find(d => d.gameId === 'stardust-miner');
  assert.equal(st.paused, false);
  assert.equal(st.stage, 'QUEUED');
  assert.equal(st.resumeStage, 'DOWNLOADING', '保留 resumeStage');
  assert.ok(st.progress >= savedProgress, '保留进度');
  const firstQueued = s.downloads.find(d => d.stage === 'QUEUED' && !d.paused);
  assert.equal(firstQueued.gameId, 'stardust-miner', '排在队首');

  // 取消活动任务（neon）→ stardust 被引擎启动且还原到暂停前阶段，进度不回退
  const neon = s.downloads.find(d => d.gameId === 'neon-drift');
  engine.cancelDownload(neon.id);
  assert.ok(await waitFor(() => {
    const t = getState().downloads.find(d => d.gameId === 'stardust-miner');
    return t && t.stage === 'DOWNLOADING' && !t.paused;
  }, 8000), '取消后下一任务启动并还原阶段');
  const restored = getState().downloads.find(d => d.gameId === 'stardust-miner');
  assert.ok(restored.progress >= savedProgress, '还原阶段后进度不回退');
  assert.ok(await waitFor(() => getState().library['neon-drift'] === undefined, 3000), '取消任务的游戏移出库');
});

test('moveDownload：上移/下移/边界/活动任务不可移动', async () => {
  engine.stopEngine();
  store.resetAllData();
  // 三个排队任务（引擎已停，保持 QUEUED）
  engine.startDownload('corridor-seven');
  engine.startDownload('orbit-market');
  engine.startDownload('echo-archive');
  const order = () => getState().downloads.map(d => d.gameId);
  assert.deepEqual(order(), ['corridor-seven', 'orbit-market', 'echo-archive']);

  // 下移第一个
  let c = getState().downloads[0];
  engine.moveDownload(c.id, 'down');
  assert.deepEqual(order(), ['orbit-market', 'corridor-seven', 'echo-archive']);
  // 上移最后一个（与相邻最近排队任务交换）
  let e = getState().downloads[2];
  engine.moveDownload(e.id, 'up');
  assert.deepEqual(order(), ['orbit-market', 'echo-archive', 'corridor-seven']);
  // 边界：首个上移 / 末个下移 → no-op
  engine.moveDownload(getState().downloads[0].id, 'up');
  assert.deepEqual(order(), ['orbit-market', 'echo-archive', 'corridor-seven']);
  engine.moveDownload(getState().downloads[2].id, 'down');
  assert.deepEqual(order(), ['orbit-market', 'echo-archive', 'corridor-seven']);

  // 活动任务不可移动：引擎启动首个排队任务后，尝试下移应 no-op
  engine.startEngine();
  assert.ok(await waitFor(() => {
    const t = getState().downloads[0];
    return ['PREPARING', 'DOWNLOADING'].includes(t.stage);
  }, 8000), '首个排队任务启动');
  const active = getState().downloads[0];
  assert.equal(active.gameId, 'orbit-market');
  engine.moveDownload(active.id, 'down');
  assert.equal(getState().downloads[0].gameId, 'orbit-market', '活动任务不被移动');

  // 暂停任务不可移动
  engine.pauseDownload(active.id);
  const pausedTask = getState().downloads.find(d => d.paused);
  const before = getState().downloads.map(d => d.gameId).join(',');
  engine.moveDownload(pausedTask.id, 'down');
  assert.equal(getState().downloads.map(d => d.gameId).join(','), before, '暂停任务不被移动');
});

test('clearFinishedDownloads 清除已完成/已取消记录', () => {
  // 延续上一用例状态：orbit 暂停中 + 其余排队/取消混合，制造终态记录
  const s0 = getState();
  const queued = s0.downloads.filter(d => d.stage === 'QUEUED');
  queued.forEach(d => engine.cancelDownload(d.id));
  engine.clearFinishedDownloads();
  const s1 = getState();
  assert.ok(s1.downloads.every(d => d.stage !== 'COMPLETED' && d.stage !== 'CANCELLED'), '终态记录被清除');
  assert.ok(s1.downloads.some(d => d.paused), '暂停任务保留');
});

test('④ pickActiveTask：暂停活动任务后返回新启动的活动任务，仅暂停时返回暂停任务', async () => {
  store.resetAllData();
  engine.startDownload('stardust-miner'); // A
  engine.startDownload('neon-drift');     // B 排队
  assert.ok(await waitFor(() => {
    const a = getState().downloads.find(d => d.gameId === 'stardust-miner');
    return a && ['PREPARING', 'DOWNLOADING'].includes(a.stage) && !a.paused;
  }, 8000), 'A 成为活动任务');
  const a = getState().downloads.find(d => d.gameId === 'stardust-miner');
  engine.pauseDownload(a.id); // A 暂停 → 引擎自动启动 B
  assert.ok(await waitFor(() => {
    const b = getState().downloads.find(d => d.gameId === 'neon-drift');
    return b && ['PREPARING', 'DOWNLOADING'].includes(b.stage) && !b.paused;
  }, 8000), 'B 自动启动（PREPARING/DOWNLOADING）');
  const picked = pickActiveTask(getState());
  assert.equal(picked.gameId, 'neon-drift', 'pickActiveTask 优先返回活动任务 B，而非暂停的 A');
  assert.equal(picked.paused, false);
  // 取消 B → 队列空，仅剩暂停的 A → 返回 A
  const b = getState().downloads.find(d => d.gameId === 'neon-drift');
  engine.cancelDownload(b.id);
  const picked2 = pickActiveTask(getState());
  assert.equal(picked2.gameId, 'stardust-miner', '仅剩暂停任务时返回 A');
  assert.equal(picked2.paused, true);
  store.resetAllData();
});

test('ETA 非负且非 NaN（DOWNLOADING 阶段采样）', async () => {
  store.resetAllData();
  engine.startDownload('echo-archive');
  assert.ok(await waitFor(() => {
    const t = getState().downloads.find(d => d.gameId === 'echo-archive');
    return t && t.stage === 'DOWNLOADING';
  }, 8000), '进入 DOWNLOADING');
  for (let i = 0; i < 5; i++) {
    const t = getState().downloads.find(d => d.gameId === 'echo-archive');
    assert.ok(Number.isFinite(t.etaSec), 'etaSec 为有限数');
    assert.ok(t.etaSec >= 0, 'etaSec 非负');
    assert.ok(t.progress >= 0 && t.progress <= 1, 'progress 在 [0,1]');
    await sleep(120);
  }
  const t = getState().downloads.find(d => d.gameId === 'echo-archive');
  engine.cancelDownload(t.id);
});

test('完整下载完成 → uninstall → 重装', async () => {
  store.resetAllData();
  engine.startDownload('echo-archive');
  assert.ok(await waitFor(() => getState().library['echo-archive']?.status === 'installed', 15000), '全阶段完成并安装');
  let s = getState();
  const done = s.downloads.find(d => d.gameId === 'echo-archive');
  assert.equal(done.stage, 'COMPLETED');
  assert.equal(done.progress, 1);
  assert.ok(done.completedAt);
  assert.equal(s.profile.stats.completedDownloads, 1);
  assert.equal(lastEvent('download_complete').gameId, 'echo-archive');

  // 启动统计
  store.recordLaunch('echo-archive');
  s = getState();
  assert.equal(s.library['echo-archive'].launchCount, 1);
  assert.ok(s.library['echo-archive'].lastLaunchedAt);
  assert.equal(s.profile.stats.launchTotal, 1);
  assert.equal(lastEvent('launch').gameId, 'echo-archive');

  // 收藏后卸载：保留 ownedAt/favorite/launchCount/历史记录
  store.toggleFavorite('echo-archive');
  store.uninstallGame('echo-archive');
  s = getState();
  const lib = s.library['echo-archive'];
  assert.equal(lib.status, 'owned');
  assert.equal(lib.installedAt, null);
  assert.equal(lib.progress, 0);
  assert.equal(lib.favorite, true, '卸载保留收藏');
  assert.equal(lib.launchCount, 1, '卸载保留启动统计');
  assert.ok(s.downloads.some(d => d.gameId === 'echo-archive' && d.stage === 'COMPLETED'), '保留历史下载记录');
  assert.equal(lastEvent('uninstall').gameId, 'echo-archive');

  // 重装（owned → 可再次获取）
  const newId = engine.startDownload('echo-archive');
  assert.ok(newId, '卸载后可重新获取');
  engine.cancelDownload(newId);
});

test('unlockBadge 幂等', () => {
  store.resetAllData();
  assert.equal(store.unlockBadge('first_download', 'stardust-miner'), true);
  const count = getState().events.length;
  assert.equal(store.unlockBadge('first_download', 'stardust-miner'), false, '重复解锁返回 false');
  assert.equal(getState().events.length, count, '不重复记事件');
  const b = getState().profile.badges[0];
  assert.equal(b.badgeId, 'first_download');
  assert.ok(b.unlockedAt);
  assert.equal(lastEvent('badge_unlock').extra.badgeId, 'first_download');
});

test('submitSurvey：五种映射 + 校验失败不改状态', () => {
  store.resetAllData();
  // Q1 ≤ 2 优先 → 清醒观察者
  assert.deepEqual(store.submitSurvey({ q1: 1, q2: '安装完成' }), { ok: true, ownerType: '清醒观察者' });
  assert.equal(getState().profile.ownerType, '清醒观察者');
  // Q2 = 没什么感觉 → 清醒观察者
  assert.deepEqual(store.submitSurvey({ q1: 4, q2: '没什么感觉' }), { ok: true, ownerType: '清醒观察者' });
  assert.deepEqual(store.submitSurvey({ q1: 3, q2: '选择并获取游戏' }), { ok: true, ownerType: '期待收藏家' });
  assert.deepEqual(store.submitSurvey({ q1: 5, q2: '看着下载进度推进' }), { ok: true, ownerType: '过程观察者' });
  assert.deepEqual(store.submitSurvey({ q1: 3, q2: '安装完成' }), { ok: true, ownerType: '拥有确认者' });
  assert.deepEqual(store.submitSurvey({ q1: 4, q2: '点击开始游戏' }), { ok: true, ownerType: '启动仪式派' });
  const s = getState();
  assert.equal(s.survey.q1, 4);
  assert.equal(s.survey.q2, '点击开始游戏');
  assert.ok(s.survey.submittedAt);
  assert.equal(lastEvent('survey_submit').extra.ownerType, '启动仪式派');

  // 校验失败：不改状态
  const before = JSON.stringify(getState().survey);
  assert.equal(store.submitSurvey({ q2: '安装完成' }).ok, false, '缺 Q1');
  assert.equal(store.submitSurvey({ q1: 6, q2: '安装完成' }).ok, false, 'Q1 越界');
  assert.equal(store.submitSurvey({ q1: 0, q2: '安装完成' }).ok, false, 'Q1 越界');
  assert.equal(store.submitSurvey({ q1: 3 }).ok, false, '缺 Q2');
  assert.equal(store.submitSurvey({ q1: 3, q2: '其他' }).ok, false, 'Q2 非法选项');
  assert.equal(store.submitSurvey(null).ok, false);
  assert.equal(JSON.stringify(getState().survey), before, '失败不改动 survey');
});

test('updateSettings 浅合并并持久化', () => {
  store.updateSettings({ soundEnabled: false, reducedMotion: true, bogus: 'x' });
  const s = getState().settings;
  assert.equal(s.soundEnabled, false);
  assert.equal(s.reducedMotion, true);
  assert.equal(s.notificationsEnabled, true, '未触碰字段不变');
  assert.equal(s.bogus, undefined, '未知字段不写入');
  const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(persisted.settings.soundEnabled, false, '已持久化');
});

test('events 超过 500 条从最旧裁剪', () => {
  store.resetAllData();
  for (let i = 0; i < 520; i++) store.unlockBadge('bulk_' + i);
  const ev = getState().events;
  assert.equal(ev.length, 500);
  assert.ok(!ev.some(e => e.extra && e.extra.badgeId === 'bulk_0'), '最旧记录被裁剪');
  assert.equal(ev[ev.length - 1].extra.badgeId, 'bulk_519', '最新记录保留');
});

test('buildExportPayload 结构（§10.4）', () => {
  const p = store.buildExportPayload();
  assert.equal(p.schemaVersion, 1);
  assert.ok(p.exportedAt);
  assert.equal(p.appVersion, store.APP_VERSION); // Node 环境无 window.nwApp → 回退 APP_VERSION 常量
  assert.ok(p.profile && p.library !== undefined && p.downloads !== undefined);
  assert.ok(p.settings && p.events !== undefined && 'survey' in p);
});

test('resetAllData 后全空（含 data_reset 事件）', () => {
  assert.notEqual(getState().profile.badges.length, 0);
  store.resetAllData();
  const s = getState();
  assert.equal(s.version, 3);
  assert.deepEqual(s.library, {});
  assert.deepEqual(s.downloads, []);
  assert.deepEqual(s.profile.badges, []);
  assert.equal(s.events.length, 1);
  assert.equal(s.events[0].event, 'data_reset');
  const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(persisted.version, 3);
  assert.deepEqual(persisted.downloads, []);
});

/* ================= 迁移与降级（直接对 normalize() 纯函数测试，模拟重启重新规范化） ================= */

test('v1→v2 迁移：favorites→favorite、字段补齐、活动任务保留 stage/progress', () => {
  const s = store.normalize({
    version: 1,
    library: {
      'stardust-miner': { gameId: 'stardust-miner', status: 'installed', ownedAt: 100, installedAt: 200, progress: 1 },
      'cloud-bakery': { gameId: 'cloud-bakery', status: 'downloading', ownedAt: 300, installedAt: null, progress: 0.3 },
    },
    downloads: [
      { id: 't1', gameId: 'cloud-bakery', stage: 'DOWNLOADING', progress: 0.4, queuedAt: 1, startedAt: 2, elapsedMs: 1234 },
      { id: 't2', gameId: 'neon-drift', stage: 'PAUSED', pausedFrom: 'INSTALLING', progress: 0.5, queuedAt: 1 },
    ],
    favorites: ['stardust-miner'],
    settings: { reducedMotion: true },
  });
  assert.equal(s.version, 3);
  assert.equal(s.library['stardust-miner'].favorite, true, 'v1 favorites → favorite');
  assert.equal(s.library['cloud-bakery'].favorite, false);
  assert.equal(s.library['stardust-miner'].lastLaunchedAt, null);
  assert.equal(s.library['stardust-miner'].launchCount, 0);
  assert.equal(s.favorites, undefined, '顶层 favorites 废弃');
  const t1 = s.downloads.find(d => d.id === 't1');
  assert.equal(t1.stage, 'DOWNLOADING');
  assert.equal(t1.progress, 0.4);
  assert.equal(t1.paused, false);
  assert.equal(t1.totalElapsedMs, 1234, 'elapsedMs → totalElapsedMs');
  assert.equal(t1.stageElapsedMs, 0);
  assert.equal(t1.resumeStage, null);
  const t2 = s.downloads.find(d => d.id === 't2');
  assert.equal(t2.paused, true);
  assert.equal(t2.resumeStage, 'INSTALLING');
  assert.equal(t2.stage, 'INSTALLING');
  assert.equal(t2.progress, 0.5);
  assert.equal(s.settings.reducedMotion, true);
  assert.equal(s.settings.soundEnabled, true);
  assert.deepEqual(s.profile.stats, { completedDownloads: 0, launchTotal: 0, simulatedWaitMs: 0 });
  assert.deepEqual(s.events, []);
});

test('损坏/缺字段输入安全降级为空状态', () => {
  const s = store.normalize(undefined);
  assert.equal(s.version, 3);
  assert.deepEqual(s.library, {});
  assert.deepEqual(s.downloads, []);
});

test('重启恢复：v2 活动任务保留阶段/进度/耗时，暂停任务保持暂停，排队顺序不变', () => {
  const s = store.normalize({
    version: 2,
    library: {
      'stardust-miner': { gameId: 'stardust-miner', status: 'downloading', ownedAt: 1, installedAt: null, progress: 0.42, favorite: false, lastLaunchedAt: null, launchCount: 0 },
    },
    downloads: [
      { id: 'a1', gameId: 'stardust-miner', stage: 'DOWNLOADING', resumeStage: null, progress: 0.42, paused: false, stageElapsedMs: 5000, stageDurationMs: 20000, totalElapsedMs: 9000, queuedAt: 1, startedAt: 2, completedAt: null },
      { id: 'a2', gameId: 'cloud-bakery', stage: 'VERIFYING', resumeStage: 'VERIFYING', progress: 0.99, paused: true, stageElapsedMs: 123, stageDurationMs: 7000, totalElapsedMs: 4000, queuedAt: 1, startedAt: 2, completedAt: null },
      { id: 'a3', gameId: 'neon-drift', stage: 'QUEUED', resumeStage: null, progress: 0, paused: true, stageElapsedMs: 0, stageDurationMs: 0, totalElapsedMs: 0, queuedAt: 1, startedAt: null, completedAt: null },
    ],
    settings: { reducedMotion: false, soundEnabled: true, notificationsEnabled: true, defaultRoute: '#/store' },
    profile: { welcomeSeen: false, revealSeen: false, firstRevealGameId: null, ownerType: null, badges: [], stats: { completedDownloads: 0, launchTotal: 0, simulatedWaitMs: 0 } },
    survey: null,
    events: [],
  });
  const a1 = s.downloads.find(d => d.id === 'a1');
  assert.equal(a1.stage, 'DOWNLOADING');
  assert.equal(a1.paused, false);
  assert.equal(a1.progress, 0.42);
  assert.equal(a1.stageElapsedMs, 5000);
  assert.equal(a1.stageDurationMs, 20000);
  const a2 = s.downloads.find(d => d.id === 'a2');
  assert.equal(a2.paused, true);
  assert.equal(a2.stage, 'VERIFYING');
  assert.equal(a2.resumeStage, 'VERIFYING');
  assert.equal(a2.stageElapsedMs, 123);
  assert.equal(a2.stageDurationMs, 7000);
  const a3 = s.downloads.find(d => d.id === 'a3');
  assert.equal(a3.paused, true);
  assert.equal(a3.stage, 'QUEUED');
  assert.equal(a3.resumeStage, null);
  assert.deepEqual(s.downloads.map(d => d.id), ['a1', 'a2', 'a3']);
});

/* ================= 设置校验与持久化（规格②） ================= */

test('defaultRoute 校验：只接受 #/store、#/library，其余回退 #/store', () => {
  store.updateSettings({ defaultRoute: '#/library' });
  assert.equal(getState().settings.defaultRoute, '#/library');
  store.updateSettings({ defaultRoute: 'javascript:alert(1)' });
  assert.equal(getState().settings.defaultRoute, '#/store', '非法路由回退 #/store');
  store.updateSettings({ defaultRoute: 123 });
  assert.equal(getState().settings.defaultRoute, '#/store', '非字符串回退 #/store');
  const s = store.normalize({ version: 2, settings: { defaultRoute: '/evil' } });
  assert.equal(s.settings.defaultRoute, '#/store', '规范化回退 #/store');
  const s2 = store.normalize({ version: 2, settings: { defaultRoute: '#/library' } });
  assert.equal(s2.settings.defaultRoute, '#/library');
  store.resetAllData();
});

test('设置四项持久化（reducedMotion/soundEnabled/notificationsEnabled/defaultRoute）+ 重启规范化保留', () => {
  store.updateSettings({ reducedMotion: true, soundEnabled: false, notificationsEnabled: false, defaultRoute: '#/library' });
  let s = getState();
  assert.equal(s.settings.reducedMotion, true);
  assert.equal(s.settings.soundEnabled, false);
  assert.equal(s.settings.notificationsEnabled, false);
  assert.equal(s.settings.defaultRoute, '#/library');
  // 模拟重启：读取已持久化的 localStorage 再规范化，仍保留
  const re = store.normalize(JSON.parse(global.localStorage.getItem('nw_client_state_v1')));
  assert.equal(re.settings.reducedMotion, true);
  assert.equal(re.settings.soundEnabled, false);
  assert.equal(re.settings.notificationsEnabled, false);
  assert.equal(re.settings.defaultRoute, '#/library');
  store.resetAllData();
});

/* ================= ⑥ recordLaunch 仅 installed（owned/downloading/未知忽略） ================= */

test('⑥ recordLaunch 只允许 installed（owned/downloading/未知 gameId 均忽略）', async () => {
  store.resetAllData();
  // 未知 gameId
  store.recordLaunch('ghost-game');
  assert.equal(getState().profile.stats.launchTotal, 0, '未知 gameId 不计数');
  assert.equal(lastEvent('launch'), null, '未知 gameId 无 launch 事件');

  // downloading（未安装）
  engine.startDownload('corridor-seven');
  const dSt = getState().downloads.find(x => x.gameId === 'corridor-seven');
  store.recordLaunch('corridor-seven');
  assert.equal(getState().profile.stats.launchTotal, 0, 'downloading 不计数');
  assert.equal(lastEvent('launch'), null);
  engine.cancelDownload(dSt.id);

  // installed：完整下载完成
  engine.startDownload('echo-archive');
  assert.ok(await waitFor(() => getState().library['echo-archive']?.status === 'installed', 15000), '完成安装');
  store.recordLaunch('echo-archive');
  let s = getState();
  assert.equal(s.profile.stats.launchTotal, 1, 'installed 计数 +1');
  assert.equal(s.library['echo-archive'].launchCount, 1);
  assert.ok(lastEvent('launch'));

  // owned（卸载后）：不应再计数
  store.uninstallGame('echo-archive');
  store.recordLaunch('echo-archive');
  const after = getState();
  assert.equal(after.profile.stats.launchTotal, 1, 'owned 不计数');
  assert.equal(after.library['echo-archive'].launchCount, 1, 'owned 不增加启动次数');

  store.resetAllData();
});

test('cleanup：停止引擎（释放 setInterval，便于测试进程退出）', () => {
  engine.stopEngine();
});
