// 批次 1 返修①：活动下载重启后冻结真 bug
// 独立测试文件（避免与 state.test.js 模块缓存互相污染）：seed localStorage 写入 v2 状态
// → 重新动态 import download-engine 拿到全新模块实例 → startEngine() → 轮询断言真实续跑（progress 单调向上越过旧值）
// 运行：cd client && node --test tests/restart.test.js
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

// seed：一个正在下载、进度 0.42、阶段耗时 8400、阶段时长 20000 的任务（模拟「上次会话进行到一半」）
const seed = {
  version: 2,
  library: {
    'stardust-miner': { gameId: 'stardust-miner', status: 'downloading', ownedAt: 1, installedAt: null, progress: 0.42, favorite: false, lastLaunchedAt: null, launchCount: 0 },
  },
  downloads: [
    { id: 't1', gameId: 'stardust-miner', stage: 'DOWNLOADING', resumeStage: null, progress: 0.42, paused: false, stageElapsedMs: 8400, stageDurationMs: 20000, totalElapsedMs: 0, queuedAt: 1, startedAt: 2, completedAt: null, speedMBps: 0, etaSec: 0 },
  ],
  settings: { reducedMotion: false, soundEnabled: false, notificationsEnabled: false, defaultRoute: '#/store' },
  profile: { welcomeSeen: true, revealSeen: false, firstRevealGameId: null, ownerType: null, badges: [], stats: { completedDownloads: 0, launchTotal: 0, simulatedWaitMs: 0 } },
  survey: null,
  events: [],
};
global.localStorage.setItem('nw_client_state_v1', JSON.stringify(seed));

const store = await import('../src/state/store.js');
const engine = await import('../src/state/download-engine.js');

test('① 重启后活动任务真实续跑（progress 越过保存的旧值，不假冻结）', async () => {
  const t0 = store.getState().downloads.find(d => d.id === 't1');
  assert.equal(t0.stage, 'DOWNLOADING');
  assert.equal(t0.progress, 0.42, '重启前进度应为 0.42');
  assert.equal(t0.stageElapsedMs, 8400, 'store 保留的阶段耗时不应被清零');

  // 全新引擎实例，startEngine 应重建阶段计时基准
  engine.startEngine();

  const deadline = Date.now() + 3500;
  let last = t0.progress;
  while (Date.now() < deadline) {
    const t = store.getState().downloads.find(d => d.id === 't1');
    if (t) last = t.progress;
    if (t && t.progress > 0.42) break;
    await new Promise(r => setTimeout(r, 40));
  }
  assert.ok(last > 0.42, `重启后 progress 应单调向上越过 0.42（实际 ${last}）`);
  engine.stopEngine();
});

test('cleanup：停止引擎', () => {
  engine.stopEngine();
});
