// 全局状态、订阅与持久化（v1.0 批次 1：v2 状态模型 + v1→v2 迁移；批次 6：v3 增加心意钱包与礼物）
// 存储 key：nw_client_state_v1（键不变，内部 version: 3）
// 安全处理：localStorage 不可用 / JSON 损坏 / 缺字段 / 迁移失败 → 降级为空状态，页面不崩溃
'use strict';
import { evaluateBadges } from './badge-rules.js';

const STORAGE_KEY = 'nw_client_state_v1';
// 应用版本（批次 5 P2-1 / 关卡 A 返修 P0-2）：唯一兜底常量；Electron 注入 nwApp.version 时优先
// 与 package.json / electron/preload.js / 根 README / RELEASE_CHECKLIST 保持 1.0.0 一致（守卫：tests/migration.test.js）
export const APP_VERSION = '1.0.0';
const LIB_STATUSES = ['owned', 'downloading', 'installed'];
const ACTIVE_STAGES = ['PREPARING', 'DOWNLOADING', 'VERIFYING', 'INSTALLING', 'SHORTCUT'];
const VALID_STAGES = ['QUEUED', ...ACTIVE_STAGES, 'COMPLETED', 'CANCELLED'];
const VALID_ROUTES = ['#/store', '#/library'];
const isRoute = v => typeof v === 'string' && VALID_ROUTES.includes(v);
const Q2_OPTIONS = ['没什么感觉', '选择并获取游戏', '看着下载进度推进', '安装完成', '点击开始游戏'];
const OWNER_BY_Q2 = {
  '选择并获取游戏': '期待收藏家',
  '看着下载进度推进': '过程观察者',
  '安装完成': '拥有确认者',
  '点击开始游戏': '启动仪式派',
  '没什么感觉': '清醒观察者',
};
const MAX_EVENTS = 500;
// 心意（本地虚拟货币）：三档固定面额与初始余额，纯离线，不涉及任何真实支付
export const GIFT_TIERS = [6, 18, 66];
export const WALLET_START = 66;
// Q3 选填开放文本：仅接受字符串，超长截断到 200（安全降级，不阻塞提交）
const MAX_Q3 = 200;
const normQ3 = v => (typeof v === 'string' ? v.slice(0, MAX_Q3) : null);

export function emptyState() {
  return {
    version: 3,
    library: {},    // { gameId: { gameId, status, ownedAt, installedAt, progress, favorite, lastLaunchedAt, launchCount } }
    downloads: [],  // [{ id, gameId, stage, resumeStage, progress, paused, stageElapsedMs, stageDurationMs, totalElapsedMs, queuedAt, startedAt, completedAt, speedMBps, etaSec }]
    settings: { reducedMotion: false, soundEnabled: true, notificationsEnabled: true, defaultRoute: '#/store' },
    profile: {
      welcomeSeen: false, revealSeen: false, firstRevealGameId: null, ownerType: null,
      badges: [],   // [{ badgeId, unlockedAt }]
      stats: { completedDownloads: 0, launchTotal: 0, simulatedWaitMs: 0 },
    },
    wallet: { balance: WALLET_START, spent: 0 },  // 心意余额与累计送出
    gifts: [],      // [{ gameId, amount, at }]
    survey: null,   // { q1, q2, ownerType, submittedAt }
    events: [],     // [{ ts, event, gameId, extra }] 上限 500 条
  };
}

// 事件追加：超过上限从最旧裁剪
export function pushEvent(events, event, gameId, extra) {
  const arr = [...events, { ts: Date.now(), event, gameId: gameId || null, extra: extra === undefined ? null : extra }];
  return arr.length > MAX_EVENTS ? arr.slice(arr.length - MAX_EVENTS) : arr;
}

// 加载 + 规范化：任何异常/损坏/缺字段都降级为空状态，不让页面崩溃
function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

const numOr = (v, def) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : def);
const clamp01 = v => Math.max(0, Math.min(1, v));

function normalizeLibraryEntry(id, entry, legacyFavs) {
  const status = LIB_STATUSES.includes(entry.status) ? entry.status : 'owned';
  return {
    gameId: typeof entry.gameId === 'string' ? entry.gameId : id,
    status,
    ownedAt: typeof entry.ownedAt === 'number' ? entry.ownedAt : Date.now(),
    installedAt: typeof entry.installedAt === 'number' ? entry.installedAt : null,
    progress: typeof entry.progress === 'number' && Number.isFinite(entry.progress)
      ? clamp01(entry.progress)
      : (status === 'installed' ? 1 : 0),
    // 收藏唯一真源：library[x].favorite；v1 顶层 favorites 数组迁移进来
    favorite: !!entry.favorite || legacyFavs.includes(id),
    lastLaunchedAt: typeof entry.lastLaunchedAt === 'number' ? entry.lastLaunchedAt : null,
    launchCount: numOr(entry.launchCount, 0),
  };
}

function normalizeTask(d, legacy) {
  let stage;
  let paused = false;
  let resumeStage = null;

  if (d.stage === 'PAUSED') {
    // v1 的暂停态（stage=PAUSED + pausedFrom）→ v2：paused:true + resumeStage，stage 保留暂停前阶段
    // 必须在 VALID_STAGES 规整之前特判，否则 'PAUSED' 会被改成 'QUEUED'
    paused = true;
    const from = (typeof d.pausedFrom === 'string' && ACTIVE_STAGES.includes(d.pausedFrom)) ? d.pausedFrom : null;
    resumeStage = from;
    stage = from || 'QUEUED';
  } else {
    stage = (typeof d.stage === 'string' && VALID_STAGES.includes(d.stage)) ? d.stage : 'QUEUED';
    paused = !!d.paused;
    if (paused) {
      resumeStage = (typeof d.resumeStage === 'string' && ACTIVE_STAGES.includes(d.resumeStage)) ? d.resumeStage : null;
    } else if (stage === 'QUEUED') {
      // 未暂停的 QUEUED 任务可带 resumeStage（恢复后排队等待还原阶段）
      resumeStage = (typeof d.resumeStage === 'string' && ACTIVE_STAGES.includes(d.resumeStage)) ? d.resumeStage : null;
    }
    // 活动阶段（未暂停）resumeStage 恒为 null（正在运行）
  }
  if (stage === 'COMPLETED' || stage === 'CANCELLED') {
    paused = false;
    resumeStage = null;
  }

  // 重启恢复语义（§7.3）：活动任务保留 stage + progress + 阶段耗时，不再重置为 QUEUED
  let progress;
  if (stage === 'COMPLETED') progress = 1;
  else if (stage === 'CANCELLED') progress = 0;
  else if (stage === 'QUEUED' && !resumeStage) progress = 0;
  else progress = (typeof d.progress === 'number' && Number.isFinite(d.progress)) ? clamp01(d.progress) : 0;

  return {
    id: (typeof d.id === 'string' && d.id) ? d.id : ('dl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
    gameId: d.gameId,
    stage,
    resumeStage,
    progress,
    paused,
    stageElapsedMs: numOr(d.stageElapsedMs, 0),
    stageDurationMs: numOr(d.stageDurationMs, 0),
    totalElapsedMs: numOr(d.totalElapsedMs, legacy ? numOr(d.elapsedMs, 0) : 0),
    queuedAt: typeof d.queuedAt === 'number' ? d.queuedAt : Date.now(),
    startedAt: typeof d.startedAt === 'number' ? d.startedAt : null,
    completedAt: stage === 'COMPLETED' ? (typeof d.completedAt === 'number' ? d.completedAt : Date.now()) : null,
    // 运行时瞬态字段（引擎每 tick 重算），持久化为 0
    speedMBps: 0,
    etaSec: 0,
  };
}

function normalize(input) {
  const out = emptyState();
  if (!input || typeof input !== 'object') return out;
  // v1 = 无 version 或 version:1；v2/v3 均为现行结构（v3 只新增 wallet/gifts，字段向后兼容）
  const legacy = input.version !== 2 && input.version !== 3;

  // library（含 v1 favorites → favorite 迁移）
  const legacyFavs = legacy && Array.isArray(input.favorites)
    ? input.favorites.filter(x => typeof x === 'string')
    : [];
  if (input.library && typeof input.library === 'object') {
    for (const [id, entry] of Object.entries(input.library)) {
      if (!entry || typeof entry !== 'object') continue;
      out.library[id] = normalizeLibraryEntry(id, entry, legacyFavs);
    }
  }

  // downloads：v1→v2 字段迁移；活动任务保留 stage/progress（§7.3），暂停任务保持 paused
  if (Array.isArray(input.downloads)) {
    out.downloads = input.downloads
      .filter(d => d && typeof d === 'object' && typeof d.gameId === 'string')
      .map(d => normalizeTask(d, legacy));
  }

  // settings
  if (input.settings && typeof input.settings === 'object') {
    const s = input.settings;
    if (typeof s.reducedMotion === 'boolean') out.settings.reducedMotion = s.reducedMotion;
    if (typeof s.soundEnabled === 'boolean') out.settings.soundEnabled = s.soundEnabled;
    if (typeof s.notificationsEnabled === 'boolean') out.settings.notificationsEnabled = s.notificationsEnabled;
    if (isRoute(s.defaultRoute)) out.settings.defaultRoute = s.defaultRoute;
  }

  // profile
  if (input.profile && typeof input.profile === 'object') {
    const p = input.profile;
    if (typeof p.welcomeSeen === 'boolean') out.profile.welcomeSeen = p.welcomeSeen;
    if (typeof p.revealSeen === 'boolean') out.profile.revealSeen = p.revealSeen;
    if (typeof p.firstRevealGameId === 'string') out.profile.firstRevealGameId = p.firstRevealGameId;
    if (typeof p.ownerType === 'string') out.profile.ownerType = p.ownerType;
    if (Array.isArray(p.badges)) {
      out.profile.badges = p.badges
        .filter(b => b && typeof b === 'object' && typeof b.badgeId === 'string')
        .map(b => ({ badgeId: b.badgeId, unlockedAt: typeof b.unlockedAt === 'number' ? b.unlockedAt : Date.now() }));
    }
    if (p.stats && typeof p.stats === 'object') {
      out.profile.stats = {
        completedDownloads: numOr(p.stats.completedDownloads, 0),
        launchTotal: numOr(p.stats.launchTotal, 0),
        simulatedWaitMs: numOr(p.stats.simulatedWaitMs, 0),
      };
    }
  }

  // wallet（v3 新增）：缺失时补初始余额，丢弃非法值
  if (input.wallet && typeof input.wallet === 'object') {
    const balance = typeof input.wallet.balance === 'number' && Number.isFinite(input.wallet.balance)
      ? Math.max(0, Math.floor(input.wallet.balance)) : WALLET_START;
    out.wallet = { balance, spent: numOr(input.wallet.spent, 0) };
  }

  // gifts（v3 新增）：只保留结构完整的记录
  if (Array.isArray(input.gifts)) {
    out.gifts = input.gifts
      .filter(g => g && typeof g === 'object' && typeof g.gameId === 'string' && GIFT_TIERS.includes(g.amount))
      .map(g => ({ gameId: g.gameId, amount: g.amount, at: typeof g.at === 'number' ? g.at : Date.now() }));
  }

  // survey
  if (input.survey && typeof input.survey === 'object'
    && Number.isInteger(input.survey.q1) && input.survey.q1 >= 1 && input.survey.q1 <= 5
    && typeof input.survey.q2 === 'string' && Q2_OPTIONS.includes(input.survey.q2)) {
    out.survey = { ...input.survey, q3: normQ3(input.survey.q3), submittedAt: typeof input.survey.submittedAt === 'number' ? input.survey.submittedAt : Date.now() };
  }

  // events
  if (Array.isArray(input.events)) {
    out.events = input.events
      .filter(e => e && typeof e === 'object' && typeof e.event === 'string' && typeof e.ts === 'number')
      .map(e => ({ ts: e.ts, event: e.event, gameId: typeof e.gameId === 'string' ? e.gameId : null, extra: e.extra === undefined ? null : e.extra }))
      .slice(-MAX_EVENTS);
  }

  return out;
}

let state = normalize(loadRaw());
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* localStorage 不可用：仅内存态 */ }
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// 自动徽章：每次状态变更后统一评估，只补「条件已满足但尚未解锁」的，天然幂等
// 放在 dispatch 内而非订阅回调里，避免 dispatch → 订阅 → dispatch 的重入
function withAutoBadges(s) {
  let hits;
  try { hits = evaluateBadges(s); } catch (e) { return s; }
  if (!hits || !hits.length) return s;
  const owned = new Set(s.profile.badges.map(b => b.badgeId));
  const fresh = hits.filter(h => !owned.has(h.id));
  if (!fresh.length) return s;
  const now = Date.now();
  let events = s.events;
  for (const h of fresh) events = pushEvent(events, 'badge_unlock', h.gameId || null, { badgeId: h.id });
  return {
    ...s,
    profile: {
      ...s.profile,
      badges: [...s.profile.badges, ...fresh.map(h => ({ badgeId: h.id, unlockedAt: now }))],
    },
    events,
  };
}

// dispatch：传入 (state) => nextState 的纯更新函数，返回新对象则提交
function dispatch(updater) {
  const next = updater(state);
  if (!next || next === state) return;
  state = withAutoBadges(next);
  persist();
  listeners.forEach(fn => { try { fn(state); } catch (e) { /* 忽略订阅回调异常 */ } });
}

/* ================= 业务操作接口（规格 §10.5） ================= */

// 事件记录：通用入口（引擎等外部模块使用；main.js 的 app_open 也走这里）
export function recordEvent(event, gameId = null, extra = null) {
  dispatch(s => ({ ...s, events: pushEvent(s.events, event, gameId, extra) }));
}
export function recordAppOpen() {
  recordEvent('app_open');
}

// 卸载（§6.4）：仅 installed 可卸载 → owned；保留 ownedAt/favorite/启动统计与历史下载记录
export function uninstallGame(gameId) {
  dispatch(s => {
    const lib = s.library[gameId];
    if (!lib || lib.status !== 'installed') return s;
    return {
      ...s,
      library: { ...s.library, [gameId]: { ...lib, status: 'owned', installedAt: null, progress: 0 } },
      events: pushEvent(s.events, 'uninstall', gameId, null),
    };
  });
}

// 设置更新：浅合并 + 持久化
export function updateSettings(patch) {
  if (!patch || typeof patch !== 'object') return getState().settings;
  dispatch(s => {
    const next = { ...s.settings };
    if (typeof patch.reducedMotion === 'boolean') next.reducedMotion = patch.reducedMotion;
    if (typeof patch.soundEnabled === 'boolean') next.soundEnabled = patch.soundEnabled;
    if (typeof patch.notificationsEnabled === 'boolean') next.notificationsEnabled = patch.notificationsEnabled;
    if (patch.defaultRoute !== undefined) {
      next.defaultRoute = isRoute(patch.defaultRoute) ? patch.defaultRoute : '#/store';
    }
    return { ...s, settings: next };
  });
  return getState().settings;
}

// 伪启动（规格 §3.9）：仅已安装游戏可启动；owned/downloading/未知 gameId 直接忽略（无状态变化、无事件）
export function recordLaunch(gameId) {
  dispatch(s => {
    const lib = s.library[gameId];
    if (!lib || lib.status !== 'installed') return s;
    return {
      ...s,
      library: { ...s.library, [gameId]: { ...lib, launchCount: (lib.launchCount || 0) + 1, lastLaunchedAt: Date.now() } },
      profile: { ...s.profile, stats: { ...s.profile.stats, launchTotal: (s.profile.stats.launchTotal || 0) + 1 } },
      events: pushEvent(s.events, 'launch', gameId, null),
    };
  });
}

// 徽章解锁：幂等，已存在返回 false
export function unlockBadge(badgeId, gameId) {
  let added = false;
  dispatch(s => {
    if (s.profile.badges.some(b => b.badgeId === badgeId)) return s;
    added = true;
    return {
      ...s,
      profile: { ...s.profile, badges: [...s.profile.badges, { badgeId, unlockedAt: Date.now() }] },
      events: pushEvent(s.events, 'badge_unlock', gameId || null, { badgeId }),
    };
  });
  return added;
}

// 送心意（批次 6）：三档固定面额，余额不足或档位非法直接拒绝，不改状态
// 纯本地模拟，不涉及支付通道、不产生任何网络请求
export function sendGift(gameId, amount) {
  const value = Number(amount);
  if (!GIFT_TIERS.includes(value)) return { ok: false, reason: '心意档位无效' };
  if (typeof gameId !== 'string' || !gameId) return { ok: false, reason: '未指定游戏' };
  const wallet = getState().wallet;
  if (wallet.balance < value) return { ok: false, reason: '心意余额不足，可先补充' };
  dispatch(s => ({
    ...s,
    wallet: { balance: s.wallet.balance - value, spent: s.wallet.spent + value },
    gifts: [...s.gifts, { gameId, amount: value, at: Date.now() }],
    events: pushEvent(s.events, 'gift_send', gameId, { amount: value }),
  }));
  return { ok: true, balance: getState().wallet.balance };
}

// 补满心意：仅当余额低于初始值时才补，避免无意义的空写入
export function refillWallet() {
  const { balance } = getState().wallet;
  if (balance >= WALLET_START) return { ok: false, reason: '心意已满' };
  dispatch(s => ({
    ...s,
    wallet: { ...s.wallet, balance: WALLET_START },
    events: pushEvent(s.events, 'wallet_refill', null, null),
  }));
  return { ok: true, balance: WALLET_START };
}

// 某款游戏累计收到的心意（0 表示没送过）
export function giftTotalFor(gameId) {
  return getState().gifts
    .filter(g => g.gameId === gameId)
    .reduce((sum, g) => sum + g.amount, 0);
}

// 问卷提交（§3.8）：Q1(1-5) 必填、Q2 必填单选、Q3 选填（字符串≤200，允许空）；失败不改状态
export function submitSurvey(payload) {
  const q1 = payload ? Number(payload.q1) : NaN;
  const q2 = payload ? payload.q2 : undefined;
  if (!Number.isInteger(q1) || q1 < 1 || q1 > 5) return { ok: false, reason: 'Q1 必须为 1-5 的整数' };
  if (typeof q2 !== 'string' || !Q2_OPTIONS.includes(q2)) return { ok: false, reason: 'Q2 必填且为有效选项' };
  const q3 = normQ3(payload && payload.q3 !== undefined ? payload.q3 : null);
  const ownerType = (q1 <= 2 || q2 === '没什么感觉') ? '清醒观察者' : OWNER_BY_Q2[q2];
  dispatch(s => ({
    ...s,
    profile: { ...s.profile, ownerType },
    survey: { q1, q2, q3, ownerType, submittedAt: Date.now() },
    events: pushEvent(s.events, 'survey_submit', null, { ownerType }),
  }));
  return { ok: true, ownerType };
}

// 导出载荷（纯函数，供测试）：不触发下载
export function buildExportPayload() {
  const s = state;
  const appVersion = (typeof window !== 'undefined' && window.nwApp && typeof window.nwApp.version === 'string')
    ? window.nwApp.version : APP_VERSION;
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion,
    profile: s.profile,
    wallet: s.wallet,
    gifts: s.gifts,
    library: s.library,
    downloads: s.downloads,
    settings: s.settings,
    survey: s.survey,
    events: s.events,
  };
}

// 数据导出（§10.4）：仅由用户点击触发；Blob + a[download]
export function exportLocalData() {
  const payload = buildExportPayload();
  dispatch(s => ({ ...s, events: pushEvent(s.events, 'data_export', null, null) }));
  const d = new Date();
  const p2 = n => String(n).padStart(2, '0');
  const name = `bu-wan-you-xi-data-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}

// 清除全部数据（§8.4）：v2 空状态 + 持久化 + 通知订阅者；保留 resetState 别名
export function resetAllData() {
  state = emptyState();
  state.events = [{ ts: Date.now(), event: 'data_reset', gameId: null, extra: null }];
  persist();
  listeners.forEach(fn => { try { fn(state); } catch (e) {} });
}
export function resetState() { resetAllData(); }

// 欢迎弹窗确认（§3.1）：首次进入标记 welcomeSeen，并记 welcome_accept 事件（不重置其余状态）
export function markWelcomeSeen() {
  dispatch(s => {
    if (s.profile.welcomeSeen) return s;
    return {
      ...s,
      profile: { ...s.profile, welcomeSeen: true },
      events: pushEvent(s.events, 'welcome_accept', null, null),
    };
  });
}

// 揭示一次性记录（§3.6）：revealSeen + firstRevealGameId + reveal 事件；重复调用幂等
export function markRevealSeen(gameId) {
  dispatch(s => {
    if (s.profile.revealSeen) return s;
    return {
      ...s,
      profile: { ...s.profile, revealSeen: true, firstRevealGameId: gameId || null },
      events: pushEvent(s.events, 'reveal', gameId || null, null),
    };
  });
}

// 收藏（§6.3）：唯一真源 library[x].favorite；仅已获取（在库中）游戏可收藏
export function toggleFavorite(gameId) {
  let added = null;
  dispatch(s => {
    const lib = s.library[gameId];
    if (!lib) return s; // 未在库中：不产生收藏
    added = !lib.favorite;
    return {
      ...s,
      library: { ...s.library, [gameId]: { ...lib, favorite: !lib.favorite } },
      events: pushEvent(s.events, 'favorite_change', gameId, { favorite: !lib.favorite }),
    };
  });
  return added; // null = 不在库中
}

export { STORAGE_KEY, dispatch, normalize };
