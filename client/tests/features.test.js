// 批次 6 自动化测试：徽章规则与心意礼物（node:test）
// 运行：cd client && node --test tests/features.test.js
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
const rules = await import('../src/state/badge-rules.js');
const { getState } = store;
const reset = () => store.resetAllData();
const ids = hits => hits.map(h => h.id);

/* ================= 徽章判定（纯函数） ================= */

test('evaluateBadges：空状态无任何徽章', () => {
  assert.deepEqual(rules.evaluateBadges(store.emptyState()), []);
});

test('evaluateBadges：下载完成 → first_download，并归属到已安装游戏', () => {
  const s = store.emptyState();
  s.profile.stats.completedDownloads = 1;
  s.library['stardust-miner'] = {
    gameId: 'stardust-miner', status: 'installed', ownedAt: 1, installedAt: 2,
    progress: 1, favorite: false, lastLaunchedAt: null, launchCount: 0,
  };
  const hits = rules.evaluateBadges(s);
  assert.ok(ids(hits).includes('first_download'));
  assert.equal(hits.find(h => h.id === 'first_download').gameId, 'stardust-miner');
});

test('evaluateBadges：启动 1 次 → first_launch；10 次 → 追加 launch_ten', () => {
  const s = store.emptyState();
  s.profile.stats.launchTotal = 1;
  assert.deepEqual(ids(rules.evaluateBadges(s)), ['first_launch']);
  s.profile.stats.launchTotal = 10;
  assert.deepEqual(ids(rules.evaluateBadges(s)), ['first_launch', 'launch_ten']);
});

test('evaluateBadges：库内 3 款 → shelf_three；集齐全部（TOTAL_GAMES）→ shelf_all', () => {
  const s = store.emptyState();
  const entry = id => ({ gameId: id, status: 'owned', ownedAt: 1, installedAt: null, progress: 0, favorite: false, lastLaunchedAt: null, launchCount: 0 });
  ['a', 'b', 'c'].forEach(id => { s.library[id] = entry(id); });
  assert.deepEqual(ids(rules.evaluateBadges(s)), ['shelf_three']);
  // 目录规模随批次增长：这里按当前 TOTAL_GAMES 填满，避免把「6 款」写死
  for (let i = 3; i < rules.TOTAL_GAMES; i++) s.library['g' + i] = entry('g' + i);
  assert.deepEqual(ids(rules.evaluateBadges(s)), ['shelf_three', 'shelf_all']);
});

test('evaluateBadges：揭示 / 问卷 / 礼物分别对应 first_reveal、survey_done、first_gift', () => {
  const s = store.emptyState();
  s.profile.revealSeen = true;
  s.profile.firstRevealGameId = 'cloud-bakery';
  assert.deepEqual(ids(rules.evaluateBadges(s)), ['first_reveal']);

  s.survey = { q1: 4, q2: '安装完成', ownerType: '拥有确认者', submittedAt: 1 };
  s.gifts = [{ gameId: 'neon-drift', amount: 6, at: 1 }];
  const hits = ids(rules.evaluateBadges(s));
  assert.ok(hits.includes('survey_done'));
  assert.ok(hits.includes('first_gift'));
});

test('evaluateBadges：脏输入不抛异常', () => {
  for (const bad of [null, undefined, 42, 'x', {}, { library: null, profile: null, gifts: null }]) {
    assert.deepEqual(rules.evaluateBadges(bad), []);
  }
});

/* ================= 心意礼物 ================= */

test('sendGift 成功：扣减余额、记录礼物与事件、自动解锁 first_gift', () => {
  reset();
  const before = getState().wallet.balance;
  const res = store.sendGift('stardust-miner', 18);
  assert.deepEqual(res, { ok: true, balance: before - 18 });
  const s = getState();
  assert.equal(s.wallet.balance, before - 18);
  assert.equal(s.wallet.spent, 18);
  assert.equal(s.gifts.length, 1);
  assert.deepEqual({ gameId: s.gifts[0].gameId, amount: s.gifts[0].amount }, { gameId: 'stardust-miner', amount: 18 });
  assert.equal(s.events.filter(e => e.event === 'gift_send').length, 1);
  assert.ok(s.profile.badges.some(b => b.badgeId === 'first_gift'), '首次送礼应解锁徽章');
});

test('sendGift 校验：非法档位 / 缺游戏 / 余额不足 一律拒绝且不改状态', () => {
  reset();
  const before = JSON.stringify(getState());
  assert.equal(store.sendGift('stardust-miner', 7).ok, false, '非三档面额应拒绝');
  assert.equal(store.sendGift('', 6).ok, false, '缺 gameId 应拒绝');
  assert.equal(JSON.stringify(getState()), before, '非法请求不得改状态');

  store.sendGift('stardust-miner', 66);                     // 花光
  const after = JSON.stringify(getState());
  assert.equal(store.sendGift('cloud-bakery', 6).ok, false, '余额不足应拒绝');
  assert.equal(JSON.stringify(getState()), after, '余额不足不得改状态');
});

test('sendGift 幂等性边界：余额恰好等于档位可送出，送出后余额为 0', () => {
  reset();
  const res = store.sendGift('neon-drift', 66);
  assert.equal(res.ok, true);
  assert.equal(getState().wallet.balance, 0);
});

test('refillWallet：低于初始值可补满一次，之后返回 false', () => {
  reset();
  store.sendGift('neon-drift', 18);
  assert.equal(getState().wallet.balance, 48);
  assert.deepEqual(store.refillWallet(), { ok: true, balance: 66 });
  assert.equal(getState().wallet.balance, 66);
  assert.deepEqual(store.refillWallet(), { ok: false, reason: '心意已满' });
});

test('giftTotalFor：按游戏累计，未送过返回 0', () => {
  reset();
  store.sendGift('stardust-miner', 6);
  store.sendGift('stardust-miner', 18);      // 余额 66 → 42
  store.refillWallet();                       // 补满，才能再送 66
  store.sendGift('cloud-bakery', 66);
  assert.equal(store.giftTotalFor('stardust-miner'), 24);
  assert.equal(store.giftTotalFor('cloud-bakery'), 66);
  assert.equal(store.giftTotalFor('echo-archive'), 0);
});

/* ================= 迁移与持久化 ================= */

test('v2 状态升 v3：保留原字段，钱包补初始值、礼物补空数组', () => {
  const v2 = {
    version: 2,
    library: { 'stardust-miner': { gameId: 'stardust-miner', status: 'installed', progress: 1 } },
    profile: { welcomeSeen: true, badges: [{ badgeId: 'first_download', unlockedAt: 5 }], stats: { completedDownloads: 1, launchTotal: 0, simulatedWaitMs: 100 } },
  };
  const out = store.normalize(v2);
  assert.equal(out.version, 3);
  assert.equal(out.library['stardust-miner'].status, 'installed');
  assert.deepEqual(out.profile.badges, [{ badgeId: 'first_download', unlockedAt: 5 }]);
  assert.deepEqual(out.wallet, { balance: 66, spent: 0 });
  assert.deepEqual(out.gifts, []);
});

test('钱包与礼物的脏数据降级：负数余额归零、非法面额礼物丢弃', () => {
  const out = store.normalize({
    version: 3,
    wallet: { balance: -20, spent: 'x' },
    gifts: [
      { gameId: 'a', amount: 6, at: 1 },
      { gameId: 'b', amount: 7, at: 1 },   // 非法面额 → 丢弃
      { amount: 6 },                        // 缺 gameId → 丢弃
      null,
    ],
  });
  assert.equal(out.wallet.balance, 0);
  assert.equal(out.wallet.spent, 0);
  assert.equal(out.gifts.length, 1);
  assert.equal(out.gifts[0].gameId, 'a');
});
