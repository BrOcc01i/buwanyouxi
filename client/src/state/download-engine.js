// 下载队列与状态机（v1.0 批次 1：paused/resumeStage 新语义）
// 队列：一次只跑一个活动任务，其余排队；暂停任务不推进、不参与调度；取消可作用于排队/活动任务
// 暂停模型：paused:true + resumeStage（暂停前的活动阶段，QUEUED 时为 null），stage 保留原值
// 调度（§7.2）：暂停活动任务后下一个未暂停排队任务自动开始；恢复不中断当前活动任务（进队首等待）
// 重启（§7.3）：活动任务保留 stage/progress/阶段耗时；暂停任务保持暂停；排队顺序不变
// 加速：URL 查询参数 ?downloadScale=0.01（默认 1，只影响时长、不改变阶段顺序）
'use strict';
import { getState, dispatch, pushEvent } from './store.js';
import { GAME_MAP } from '../data/games.js';

const TICK = 100; // ms
const ORDER = ['PREPARING', 'DOWNLOADING', 'VERIFYING', 'INSTALLING', 'SHORTCUT', 'COMPLETED'];
const ACTIVE = ['PREPARING', 'DOWNLOADING', 'VERIFYING', 'INSTALLING', 'SHORTCUT'];

export const INSTALL_STEPS = [
  '解压资源包 (1/7)', '解压资源包 (2/7)', '解压资源包 (3/7)', '解压资源包 (4/7)',
  '解压资源包 (5/7)', '写入配置…', '注册组件…',
];
export const PREPARING_LINES = ['正在连接服务器…', '已分配节点 CDN-07', '协商下载计划…'];

const stageStartAt = new Map(); // taskId -> 当前阶段开始时间戳（引擎内部，不持久化）
const stageDurAt = new Map();   // taskId -> 当前阶段固定时长（进入阶段时生成一次，避免 tick 时重复 rand 导致进度倒退）

export function parseDownloadScale() {
  try {
    const m = location.search.match(/[?&]downloadScale=([\d.]+)/);
    const v = m ? parseFloat(m[1]) : 1;
    return (Number.isFinite(v) && v > 0) ? v : 1;
  } catch (e) { return 1; }
}
let scale = parseDownloadScale();
export function getScale() { return scale; }

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function durationOf(stage, game) {
  const s = scale;
  switch (stage) {
    case 'PREPARING': return rand(2000, 4000) * s;
    case 'DOWNLOADING': return (game.sizeMB < 6000 ? rand(60000, 80000) : rand(80000, 100000)) * s;
    case 'VERIFYING': return rand(6000, 10000) * s;
    case 'INSTALLING': return rand(12000, 20000) * s;
    case 'SHORTCUT': return rand(2000, 3000) * s;
    default: return 0;
  }
}

let timer = null;

/* ---------- 对外 API ---------- */

// 创建下载任务（防重复：同游戏已有非终态任务则忽略）
export function startDownload(gameId) {
  const state = getState();
  const lib = state.library[gameId];
  if (lib && lib.status === 'installed') return null;              // 已安装
  const dup = state.downloads.find(d => d.gameId === gameId && d.stage !== 'CANCELLED' && d.stage !== 'COMPLETED');
  if (dup) return dup.id;                                          // 已有活动/排队任务

  const task = {
    id: 'dl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    gameId,
    stage: 'QUEUED',
    resumeStage: null,
    progress: 0,
    paused: false,
    stageElapsedMs: 0,
    stageDurationMs: 0,
    totalElapsedMs: 0,
    queuedAt: Date.now(),
    startedAt: null,
    completedAt: null,
    speedMBps: 0,
    etaSec: 0,
  };

  dispatch(s => ({
    ...s,
    downloads: [...s.downloads, task],
    library: {
      ...s.library,
      [gameId]: { gameId, status: 'downloading', ownedAt: s.library[gameId]?.ownedAt || Date.now(), installedAt: null, progress: 0, favorite: s.library[gameId]?.favorite || false, lastLaunchedAt: s.library[gameId]?.lastLaunchedAt || null, launchCount: s.library[gameId]?.launchCount || 0 },
    },
    events: pushEvent(s.events, 'acquire', gameId, { taskId: task.id }),
  }));
  return task.id;
}

// 取消任务（排队或活动均可）
export function cancelDownload(taskId) {
  stageStartAt.delete(taskId);
  stageDurAt.delete(taskId);
  dispatch(s => {
    const task = s.downloads.find(d => d.id === taskId);
    if (!task || task.stage === 'CANCELLED' || task.stage === 'COMPLETED') return s;
    const downloads = s.downloads.map(d => d.id === taskId
      ? { ...d, stage: 'CANCELLED', paused: false, resumeStage: null, progress: 0, speedMBps: 0, etaSec: 0, completedAt: null }
      : d);
    // 该游戏若没有其他非终态任务，则从库中移除（回到未获取）
    let library = s.library;
    const stillActive = downloads.some(d => d.gameId === task.gameId && d.stage !== 'CANCELLED' && d.stage !== 'COMPLETED');
    if (!stillActive && library[task.gameId] && library[task.gameId].status !== 'installed') {
      const copy = { ...library };
      delete copy[task.gameId];
      library = copy;
    }
    return { ...s, downloads, library, events: pushEvent(s.events, 'download_cancel', task.gameId, { taskId }) };
  });
}

// 暂停任务（§7.2）：paused:true + resumeStage；活动任务记录阶段耗时；QUEUED 任务 resumeStage=null。
// 暂停后引擎自动启动下一个未暂停排队任务（由 tick 的活动判定实现）。
export function pauseDownload(taskId) {
  dispatch(s => {
    const task = s.downloads.find(d => d.id === taskId);
    if (!task || task.paused || task.stage === 'COMPLETED' || task.stage === 'CANCELLED') return s;
    let downloads;
    if (task.stage === 'QUEUED') {
      downloads = s.downloads.map(d => d.id === taskId
        ? { ...d, paused: true, resumeStage: null, speedMBps: 0, etaSec: 0 }
        : d);
    } else {
      const dur = stageDurAt.get(taskId) || task.stageDurationMs || 0;
      const elapsed = dur ? clamp(Date.now() - (stageStartAt.get(taskId) || Date.now()), 0, dur) : (task.stageElapsedMs || 0);
      downloads = s.downloads.map(d => d.id === taskId
        ? { ...d, paused: true, resumeStage: d.stage, speedMBps: 0, etaSec: 0, stageElapsedMs: elapsed, stageDurationMs: dur }
        : d);
    }
    return { ...s, downloads, events: pushEvent(s.events, 'download_pause', task.gameId, { taskId }) };
  });
  stageStartAt.delete(taskId); // 暂停即清除阶段计时；恢复/重新排队时按 stageElapsedMs 重建
  stageDurAt.delete(taskId);
}

// 恢复任务（§7.2）：仅 paused 任务可恢复。
// 若存在其他活动任务 → 不中断：stage 置 QUEUED 排到队首等待，保留 resumeStage/progress/阶段耗时；
// 若无活动任务 → 直接恢复：stage=resumeStage，按 stageElapsedMs 折算阶段起点，进度不回退。
export function resumeDownload(taskId) {
  const s0 = getState();
  const task = s0.downloads.find(d => d.id === taskId);
  if (!task || !task.paused) return;
  const hasActive = s0.downloads.some(d => d.id !== taskId && ACTIVE.includes(d.stage) && !d.paused);

  dispatch(s => {
    const t = s.downloads.find(d => d.id === taskId);
    if (!t || !t.paused) return s;
    const events = pushEvent(s.events, 'download_resume', t.gameId, { taskId });

    if (hasActive) {
      // 排到队首等待（活动任务之后、其余排队任务之前）
      const rest = s.downloads.filter(d => d.id !== taskId);
      let insertAt = rest.findIndex(d => d.stage === 'QUEUED');
      if (insertAt < 0) insertAt = rest.length;
      const copy = [...rest];
      copy.splice(insertAt, 0, { ...t, paused: false, stage: 'QUEUED', speedMBps: 0, etaSec: 0 });
      return { ...s, downloads: copy, events };
    }

    const stage = (t.resumeStage && ACTIVE.includes(t.resumeStage)) ? t.resumeStage : 'QUEUED';
    if (stage === 'QUEUED') {
      // 原本就是排队中被暂停 → 回到排队
      return {
        ...s,
        downloads: s.downloads.map(d => d.id === taskId ? { ...d, paused: false, stage: 'QUEUED', speedMBps: 0, etaSec: 0 } : d),
        events,
      };
    }
    // 直接恢复该阶段
    const game = GAME_MAP[t.gameId];
    if (!game) return s;
    const dur = (t.stageDurationMs > 0) ? t.stageDurationMs : durationOf(stage, game);
    const elapsed = clamp(t.stageElapsedMs || 0, 0, dur);
    stageStartAt.set(taskId, Date.now() - elapsed);
    stageDurAt.set(taskId, dur);
    return {
      ...s,
      downloads: s.downloads.map(d => d.id === taskId
        ? { ...d, paused: false, stage, speedMBps: 0, etaSec: 0, stageDurationMs: dur, stageElapsedMs: elapsed }
        : d),
      events,
    };
  });
}

// 队列提升（D5）：把排队任务移到队首（成为活动任务结束后的下一个启动项）
// 只重排 downloads 数组顺序，不改变任何任务状态；对非排队任务调用无效果
export function promoteDownload(taskId) {
  dispatch(s => {
    const idx = s.downloads.findIndex(d => d.id === taskId);
    if (idx < 0 || s.downloads[idx].stage !== 'QUEUED') return s;
    const task = s.downloads[idx];
    const rest = s.downloads.filter(d => d.id !== taskId);
    // 插入到第一个「排队」任务之前（即所有非排队任务之后）= 队首
    let insertAt = rest.length;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i].stage === 'QUEUED') { insertAt = i; break; }
    }
    rest.splice(insertAt, 0, task);
    return { ...s, downloads: rest };
  });
}

// 上移/下移（§7.1/§7.2）：只对未暂停的 QUEUED 任务生效，与相邻最近的排队任务交换位置
export function moveDownload(taskId, direction) {
  dispatch(s => {
    const idx = s.downloads.findIndex(d => d.id === taskId);
    if (idx < 0) return s;
    const task = s.downloads[idx];
    if (task.stage !== 'QUEUED' || task.paused) return s;
    const step = direction === 'up' ? -1 : 1;
    let j = idx + step;
    while (j >= 0 && j < s.downloads.length) {
      const other = s.downloads[j];
      if (other.stage === 'QUEUED' && !other.paused) {
        const downloads = [...s.downloads];
        downloads[idx] = other;
        downloads[j] = task;
        return { ...s, downloads };
      }
      j += step;
    }
    return s;
  });
}

// 清除已完成/已取消记录（§7.1）
export function clearFinishedDownloads() {
  dispatch(s => ({
    ...s,
    downloads: s.downloads.filter(d => d.stage !== 'COMPLETED' && d.stage !== 'CANCELLED'),
  }));
}

/* ---------- 引擎 ---------- */

// 活动任务优选（§7.3/规格④）：优先 ACTIVE 且未暂停；否则第一个暂停任务；都没有返回 null
// 统一规则，downloads.js hero 与 shell.js 状态栏 mini 共用，禁止各自手写 find
export function pickActiveTask(state) {
  const active = state.downloads.find(d => ACTIVE.includes(d.stage) && !d.paused);
  if (active) return active;
  const paused = state.downloads.find(d => d.paused);
  if (paused) return paused;
  return null;
}

export function startEngine() {
  if (timer) return;
  // 重启恢复（§7.3）：startEngine 时扫描全部任务，对 ACTIVE && !paused 任务重建阶段计时基准，
  // 避免 advance() 里 stageStartAt.get(id) 为空 → dt 从 0 重算 → 进度长期停在旧值（假冻结）。
  // 仅用持久化的 stageDurationMs / stageElapsedMs / progress 折算，不动 store 里保存的 stageElapsedMs。
  const state = getState();
  for (const task of state.downloads) {
    if (task.stage && ACTIVE.includes(task.stage) && !task.paused) {
      const game = GAME_MAP[task.gameId];
      const dur = (task.stageDurationMs > 0) ? task.stageDurationMs : (game ? durationOf(task.stage, game) : 0);
      stageDurAt.set(task.id, dur);
      const fallback = (task.progress || 0) * dur;
      const elapsed = (task.stage === 'DOWNLOADING' || task.stage === 'INSTALLING')
        ? Math.max(task.stageElapsedMs || 0, fallback)
        : (task.stageElapsedMs || 0);
      stageStartAt.set(task.id, Date.now() - elapsed); // 保证与已保存 progress 一致、进度单调向上
    }
  }
  timer = setInterval(tick, TICK);
}

export function stopEngine() {
  if (timer) { clearInterval(timer); timer = null; }
}

function tick() {
  const state = getState();
  // 活动判定：stage ∈ ACTIVE 且未暂停（暂停任务不推进、不阻塞下一个排队任务启动）
  const active = state.downloads.find(d => ACTIVE.includes(d.stage) && !d.paused);
  if (active) {
    advance(active);
    return;
  }
  // 无活动任务 → 启动第一个未暂停排队任务
  const queued = state.downloads.find(d => d.stage === 'QUEUED' && !d.paused);
  if (queued) beginTask(queued.id);
}

function beginTask(taskId) {
  const state = getState();
  const task = state.downloads.find(d => d.id === taskId);
  if (!task) return;
  const game = GAME_MAP[task.gameId];
  if (!game) return;

  // 带 resumeStage 的任务（恢复后曾排队等待）→ 还原到暂停前的阶段，进度不回退
  if (task.resumeStage && ACTIVE.includes(task.resumeStage)) {
    const dur = task.stageDurationMs > 0 ? task.stageDurationMs : durationOf(task.resumeStage, game);
    const elapsed = clamp(task.stageElapsedMs || 0, 0, dur);
    stageStartAt.set(taskId, Date.now() - elapsed);
    stageDurAt.set(taskId, dur);
    dispatch(s => ({
      ...s,
      downloads: s.downloads.map(d => d.id === taskId
        ? { ...d, stage: d.resumeStage, stageElapsedMs: elapsed, stageDurationMs: dur, startedAt: d.startedAt || Date.now() }
        : d),
    }));
    return;
  }

  const dur = durationOf('PREPARING', game);
  stageStartAt.set(taskId, Date.now());
  stageDurAt.set(taskId, dur);
  dispatch(s => ({
    ...s,
    downloads: s.downloads.map(d => d.id === taskId
      ? { ...d, stage: 'PREPARING', progress: 0, startedAt: Date.now(), stageElapsedMs: 0, stageDurationMs: dur }
      : d),
  }));
}

function advance(task) {
  const now = Date.now();
  const start = stageStartAt.get(task.id) || now;
  const dt = now - start;
  const game = GAME_MAP[task.gameId];
  if (!game) return;
  // 复用阶段固定时长（未生成则生成一次并缓存）
  let dur = stageDurAt.get(task.id);
  if (!dur) {
    dur = durationOf(task.stage, game);
    stageDurAt.set(task.id, dur);
  }

  if (dt >= dur) {
    nextStage(task);
  } else {
    updateProgress(task, dt, dur, game);
  }
}

function nextStage(task) {
  const idx = ORDER.indexOf(task.stage);
  const next = ORDER[idx + 1];
  if (next === 'COMPLETED') {
    stageStartAt.delete(task.id);
    stageDurAt.delete(task.id); // 清理阶段时长缓存，避免长期运行内存累积
    dispatch(s => {
      const fresh = s.downloads.find(d => d.id === task.id);
      const waitMs = Math.round((fresh && fresh.totalElapsedMs) || 0);
      // 首次下载徽章（§3.4）：第一项任务首次 COMPLETED 时解锁，幂等
      const hasBadge = s.profile.badges.some(b => b.badgeId === 'first_download');
      let events = pushEvent(s.events, 'download_complete', task.gameId, { taskId: task.id });
      if (!hasBadge) events = pushEvent(events, 'badge_unlock', task.gameId, { badgeId: 'first_download' });
      const downloads = s.downloads.map(d => d.id === task.id
        ? { ...d, stage: 'COMPLETED', paused: false, resumeStage: null, progress: 1, speedMBps: 0, etaSec: 0, stageElapsedMs: 0, stageDurationMs: 0, completedAt: Date.now() }
        : d);
      const prev = s.library[task.gameId] || { gameId: task.gameId, status: 'owned', ownedAt: Date.now() };
      const library = {
        ...s.library,
        [task.gameId]: { ...prev, status: 'installed', installedAt: Date.now(), progress: 1 },
      };
      const profile = {
        ...s.profile,
        badges: hasBadge ? s.profile.badges : [...s.profile.badges, { badgeId: 'first_download', unlockedAt: Date.now() }],
        stats: {
          ...s.profile.stats,
          completedDownloads: (s.profile.stats.completedDownloads || 0) + 1,
          simulatedWaitMs: (s.profile.stats.simulatedWaitMs || 0) + waitMs,
        },
      };
      return { ...s, downloads, library, profile, events };
    });
  } else {
    const dur = durationOf(next, GAME_MAP[task.gameId]);
    stageStartAt.set(task.id, Date.now());
    stageDurAt.set(task.id, dur);
    dispatch(s => ({
      ...s,
      downloads: s.downloads.map(d => d.id === task.id
        ? { ...d, stage: next, stageElapsedMs: 0, stageDurationMs: dur }
        : d),
    }));
  }
}

function updateProgress(task, dt, dur, game) {
  const t = clamp(dt / dur, 0, 1);
  let progress = task.progress;
  let speed = task.speedMBps;
  let eta = task.etaSec;

  switch (task.stage) {
    case 'PREPARING':
      progress = 0; speed = 0; eta = Math.max(0, (dur - dt) / 1000);
      break;
    case 'DOWNLOADING': {
      progress = Math.max(task.progress, t); // 单调递增（固定 dur + 保险）
      const base = task.speedMBps > 0 ? task.speedMBps : clamp(game.sizeMB / (dur / 1000), 2, 18);
      speed = clamp(base * rand(0.6, 1.4), 2, 18); // 2~18 MB/s 波动
      eta = Math.max(0, (1 - t) * (dur - dt) / 1000); // 恒非负，不会 NaN/∞
      break;
    }
    case 'VERIFYING':
      // 单调：以 t 为基线 + 小抖动，但不得低于上一帧
      progress = Math.min(0.999, Math.max(task.progress, 0.99 + t * 0.009));
      speed = 0; eta = Math.max(0, (dur - dt) / 1000);
      break;
    case 'INSTALLING':
      progress = t; // 安装子进度（0~1，页面据此显示子步骤；主进度保持 100%）
      speed = 0; eta = Math.max(0, (dur - dt) / 1000);
      break;
    case 'SHORTCUT':
      progress = 1; speed = 0; eta = Math.max(0, (dur - dt) / 1000);
      break;
  }

  dispatch(s => ({
    ...s,
    downloads: s.downloads.map(d => d.id === task.id
      ? {
          ...d,
          progress, speedMBps: speed, etaSec: eta,
          stageElapsedMs: Math.min(dt, dur), stageDurationMs: dur,
          totalElapsedMs: (d.totalElapsedMs || 0) + TICK,
        }
      : d),
    library: {
      ...s.library,
      [task.gameId]: {
        ...(s.library[task.gameId] || { gameId: task.gameId, status: 'downloading', ownedAt: Date.now() }),
        status: 'downloading',
        progress,
      },
    },
  }));
}
