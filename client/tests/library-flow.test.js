// 批次 3 自动化测试：左栏排序稳定性 / 状态筛选 / 接下来畅玩 / 卸载数据保留（node:test）
// 运行：cd client && node --test tests/library-flow.test.js
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
global.location = { search: '' };

const store = await import('../src/state/store.js');
const { sortLibraryIds, pickUpNext, applyStatusFilter } = await import('../src/state/lib-rules.js');
const { getState } = store;

test('排序 recent：lastLaunchedAt 倒序 → ownedAt 倒序回退 → gameId 升序稳定', () => {
  const lib = {
    a: { lastLaunchedAt: 300, ownedAt: 10 },
    b: { lastLaunchedAt: 500, ownedAt: 20 },
    c: { lastLaunchedAt: null, ownedAt: 500 },  // 无启动记录 → ownedAt 倒序排在 a 前
    d: { lastLaunchedAt: null, ownedAt: 500 },  // 与 c 完全平手 → gameId 升序
    e: { lastLaunchedAt: 300, ownedAt: 30 },    // 与 a 同启动时间 → ownedAt 高者在前
  };
  const ids = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(sortLibraryIds(ids, lib, 'recent'), ['b', 'e', 'a', 'c', 'd']);
  // default：原序返回（不改动入参）
  assert.deepEqual(sortLibraryIds(ids, lib, 'default'), ids);
  // 稳定性：重复调用结果一致
  const once = sortLibraryIds(ids, lib, 'recent');
  for (let i = 0; i < 5; i++) assert.deepEqual(sortLibraryIds(ids, lib, 'recent'), once);
});

test('状态筛选：installed / notinstalled / all；组合排序结果稳定', () => {
  const lib = {
    a: { status: 'installed' },
    b: { status: 'owned' },
    c: { status: 'downloading' },
    // d 未拥有（不在库）
  };
  const ids = ['a', 'b', 'c'];
  assert.deepEqual(applyStatusFilter(ids, lib, 'all'), ['a', 'b', 'c']);
  assert.deepEqual(applyStatusFilter(ids, lib, 'installed'), ['a']);
  assert.deepEqual(applyStatusFilter(ids, lib, 'notinstalled'), ['b', 'c']);
  // 未拥有的 d 不出现在任何筛选结果
  const withD = applyStatusFilter(['a', 'b', 'c', 'd'], lib, 'notinstalled');
  assert.ok(!withD.includes('d'));
  // 搜索∩筛选∩排序组合：筛选先行，排序在后，输出确定
  const combo = sortLibraryIds(applyStatusFilter(ids, lib, 'notinstalled'), lib, 'recent');
  assert.deepEqual(combo, ['b', 'c']);
});

test('接下来畅玩：只含 owned/installed，排除 downloading；launchCount 升序 0 次优先；gameId 平手稳定；limit 截断', () => {
  const lib = {
    a: { status: 'installed', launchCount: 3 },
    b: { status: 'owned', launchCount: 0 },
    c: { status: 'downloading', launchCount: 0 },   // 排除
    d: { status: 'installed', launchCount: 1 },
    e: { status: 'owned', launchCount: 0 },          // 与 b 平手 → gameId 升序 b<e
    f: { status: 'installed', launchCount: 9 },
  };
  assert.deepEqual(pickUpNext(['a', 'b', 'c', 'd', 'e', 'f'], lib), ['b', 'e', 'd', 'a']);
  // limit 生效
  assert.deepEqual(pickUpNext(['a', 'b', 'c', 'd', 'e', 'f'], lib, 2), ['b', 'e']);
});

test('卸载（§6.4）：installed→owned，installedAt/进度清除，ownedAt/收藏/启动统计/下载记录保留', () => {
  store.resetAllData();
  // 直接种入已安装状态（含收藏与启动统计）
  store.dispatch(s => ({
    ...s,
    library: {
      ...s.library,
      'stardust-miner': {
        gameId: 'stardust-miner', status: 'installed', ownedAt: 111, installedAt: 222,
        progress: 1, favorite: true, lastLaunchedAt: 333, launchCount: 7,
      },
    },
    events: [...s.events, { ts: 444, event: 'download_complete', gameId: 'stardust-miner', extra: null }],
  }));
  store.uninstallGame('stardust-miner');
  const lib = getState().library['stardust-miner'];
  assert.equal(lib.status, 'owned');
  assert.equal(lib.installedAt, null);
  assert.equal(lib.progress, 0);
  assert.equal(lib.ownedAt, 111);
  assert.equal(lib.favorite, true);
  assert.equal(lib.launchCount, 7);
  assert.equal(lib.lastLaunchedAt, 333);
  assert.ok(getState().events.some(e => e.event === 'download_complete' && e.gameId === 'stardust-miner'));
  assert.ok(getState().events.some(e => e.event === 'uninstall' && e.gameId === 'stardust-miner'));
  // 非 installed 卸载：无变化
  const before = JSON.stringify(getState().library);
  store.uninstallGame('stardust-miner');
  assert.equal(JSON.stringify(getState().library), before);
});

test('素材字段（§9）：六款游戏 assets 齐全且路径指向各自目录', async () => {
  const { GAMES } = await import('../src/data/games.js');
  assert.equal(GAMES.length, 6);
  for (const g of GAMES) {
    const a = g.assets;
    assert.ok(a, g.id + ' 缺 assets');
    for (const key of ['icon', 'portrait', 'header', 'hero', 'logo']) {
      assert.ok(a[key].includes('/assets/games/' + g.id + '/'), `${g.id}.${key} 路径错误: ${a[key]}`);
    }
    assert.equal(a.screenshots.length, 3);
    assert.ok(a.hero.includes('library-hero'));
    // emoji/gradient 降级字段仍保留
    assert.ok(g.emoji && Array.isArray(g.gradient) && g.gradient.length >= 2);
  }
});

/* ================= 批次 3 返修测试 ================= */

test('返修②：all 模式必须排除未拥有条目（候选先过滤 state.library）', () => {
  const lib = {
    'stardust-miner': { status: 'installed', ownedAt: 1 },
    'cloud-bakery':   { status: 'owned',      ownedAt: 2 },
    'neon-drift':     { status: 'downloading', ownedAt: 3 },
    // corridor-seven / orbit-market / echo-archive 未获取 → 不入库
  };
  const ids = ['stardust-miner', 'cloud-bakery', 'neon-drift', 'corridor-seven', 'orbit-market', 'echo-archive'];
  // all：仅库内 owned/installed/downloading
  assert.deepEqual(applyStatusFilter(ids, lib, 'all'), ['stardust-miner', 'cloud-bakery', 'neon-drift']);
  // installed：未拥有不得混入
  assert.deepEqual(applyStatusFilter(ids, lib, 'installed'), ['stardust-miner']);
  // notinstalled：仅库内未安装（owned/downloading），未拥有不得混入
  assert.deepEqual(applyStatusFilter(ids, lib, 'notinstalled'), ['cloud-bakery', 'neon-drift']);
});
