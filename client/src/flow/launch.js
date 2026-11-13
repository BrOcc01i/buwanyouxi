// 伪启动画面（规格 §3.5 / §3.9）
// - 3～4 秒原创伪启动画面：游戏主题深色背景淡入 + 原创发行商标识（本地虚构常量文字）+ 游戏标题 + 加载点
// - 至少展示 1 秒后才允许跳过（点击或任意键）
// - 减少动态效果（.reduced-motion / prefers-reduced-motion）时只保留淡入淡出（CSS 侧裁剪）
// - 不创建独立进程、不调用 shell、不打开任何真实程序
// - 结束时 recordLaunch（§3.9：伪启动结束后增加启动次数），再由调用方决定去向
'use strict';
import { getState, recordLaunch } from '../state/store.js';

const MIN_MS = 1000;   // 最短展示时长（防误触跳过）
const MIN_TOTAL = 3000;
const MAX_TOTAL = 4000;

let timer = null;
let skipAt = 0;

function reducedMotion() {
  return document.documentElement.classList.contains('reduced-motion');
}

function finish(game, onDone) {
  if (timer === null) return; // 已结束（幂等）
  clearTimeout(timer);
  timer = null;
  document.removeEventListener('keydown', onKey, true);
  const el = document.getElementById('splash');
  if (el) el.hidden = true;
  // §3.9：伪启动结束后增加启动次数（仅已安装游戏有效，store 内有守卫）
  recordLaunch(game.id);
  if (typeof onDone === 'function') onDone(game);
}

function onKey() {
  if (Date.now() >= skipAt) {
    const game = currentGame;
    finish(game, currentOnDone);
  }
}

let currentGame = null;
let currentOnDone = null;

export function isSplashActive() {
  return timer !== null;
}

// 启动伪启动流程。onDone(game) 在画面结束后调用（跳过同样会触发）。
export function startLaunchFlow(game, onDone) {
  if (!game || isSplashActive()) return;
  currentGame = game;
  currentOnDone = onDone;

  const root = document.getElementById('splash');
  const inner = document.getElementById('splash-inner');
  const pubEl = document.getElementById('splash-publisher');
  const titleEl = document.getElementById('splash-title');
  const skipEl = document.getElementById('splash-skip');
  if (!root || !inner || !pubEl || !titleEl) {
    // 覆盖层缺失：直接按即时完成处理，不阻塞流程
    recordLaunch(game.id);
    if (typeof onDone === 'function') onDone(game);
    return;
  }

  // 内容填充（发行商标识 = 本地虚构发行商文字 + "®" 样式装饰；原创、无第三方素材）
  pubEl.textContent = game.publisher;
  titleEl.textContent = game.name;
  inner.style.background = `linear-gradient(135deg, ${game.gradient.join(',')})`;
  skipEl.hidden = true;
  root.hidden = false;
  root.classList.toggle('splash--reduced', reducedMotion());

  const total = MIN_TOTAL + Math.random() * (MAX_TOTAL - MIN_TOTAL);
  skipAt = Date.now() + MIN_MS;

  // 1 秒后才显示跳过提示并武装跳过监听
  setTimeout(() => {
    if (timer === null) return;
    skipEl.hidden = false;
    document.addEventListener('keydown', onKey, true);
  }, MIN_MS);
  root.onclick = () => onKey();

  timer = setTimeout(() => finish(game, onDone), total);
}

// 启动去向（§3.6/§3.9）：首次伪启动 → 揭示页；后续 → 返回该游戏的库页面
export function launchDestination(state, gameId) {
  if (!state.profile.revealSeen) return '#/reveal/' + gameId;
  return '#/library';
}
