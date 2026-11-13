// 不玩游戏 客户端 —— renderer 主入口
import { register, start } from './router.js';
import { renderStore } from './pages/store.js';
import { renderLibrary } from './pages/library.js';
import { renderDownloads } from './pages/downloads.js';
import { renderSettings } from './pages/settings.js';
import { renderDetail } from './pages/detail.js';
import { renderReveal } from './pages/reveal.js';
import { startEngine } from './state/download-engine.js';
import { getState, recordAppOpen, subscribe, markWelcomeSeen } from './state/store.js';
import { planCompletionFx } from './state/completion.js';
import { GAME_MAP } from './data/games.js';
import { initShell, showToast } from './shell.js';
import { playComplete } from './sound.js';
import { initInstallDialog, initProfileCard, initAboutDialog } from './flow/dialogs.js';

// 调试暴露（供自动化验收读取状态，不影响生产逻辑）
window.__debug = { getState };

// 注册路由
register('/store', renderStore);
register('/library', renderLibrary);
register('/downloads', renderDownloads);
register('/settings', renderSettings);
register('/detail', renderDetail);
register('/reveal', renderReveal);

// 启动下载引擎（队列调度 + 状态机 tick）
startEngine();

// 初始化全局壳层（窗口控制 / 左侧游戏栏 / 底部状态栏）
initShell();

/* ============ 减少动态效果（规格②） ============ */
function applyReducedMotion(settings) {
  const mql = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const on = !!(settings && settings.reducedMotion) || (mql && mql.matches);
  document.documentElement.classList.toggle('reduced-motion', on);
}
applyReducedMotion(getState().settings);
try {
  const mql = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mql && mql.addEventListener) mql.addEventListener('change', () => applyReducedMotion(getState().settings));
} catch (e) { /* 忽略 */ }

/* ============ 下载完成：声音 + 通知（规格②） ============ */
const nw = window.nwApp || {};
let knownCompleted = new Set(getState().downloads.filter(d => d.stage === 'COMPLETED').map(d => d.id));
subscribe(() => {
  const state = getState();
  applyReducedMotion(state.settings);
  const completedNow = state.downloads.filter(d => d.stage === 'COMPLETED');
  const nowIds = new Set(completedNow.map(d => d.id));
  // 仅对「新进入 COMPLETED」的任务触发（不重放历史已完成记录）
  for (const t of completedNow) {
    if (!knownCompleted.has(t.id)) {
      const focused = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
      const fx = planCompletionFx(state.settings, focused);
      const name = (GAME_MAP[t.gameId] && GAME_MAP[t.gameId].name) || t.gameId;
      // 界面 Toast：无条件必显示（前台/后台、通知开关均不影响），使用游戏中文名
      if (fx.toast) { try { showToast('《' + name + '》下载完成'); } catch (e) { /* 静默 */ } }
      // 声音：仅受 soundEnabled 控制
      if (fx.sound) { try { playComplete(); } catch (e) { /* 静默 */ } }
      // Windows 通知：仅失焦且 notificationsEnabled=true；失败静默，不影响 Toast、不弹错误框
      if (fx.notify) {
        try { if (typeof nw.notify === 'function') nw.notify('下载完成', '《' + name + '》已安装完成'); } catch (e) { /* 静默 */ }
      }
    }
  }
  knownCompleted = nowIds;
});

/* ============ 默认启动页面（规格②） ============ */
if (!location.hash) {
  const route = getState().settings.defaultRoute;
  location.hash = (route === '#/library') ? '#/library' : '#/store';
}

// 启动路由
start();

// 记录启动事件（每次应用启动一次）
recordAppOpen();

/* ============ 欢迎弹窗（§3.1） ============ */
// 可见性由订阅驱动：welcomeSeen=false 时显示（首次启动与「清除全部数据」后重显都覆盖）
function initWelcome() {
  const el = document.getElementById('welcome');
  if (!el) return;
  const btn = document.getElementById('welcome-enter');
  btn?.addEventListener('click', () => {
    markWelcomeSeen();            // 先记录 welcomeSeen + welcome_accept 事件
    el.hidden = true;
    // 再明确进入商店（欢迎流程终点固定 #/store；正常启动仍由 defaultRoute 决定）
    if (location.hash !== '#/store') location.hash = '#/store';
  });
  const sync = () => { el.hidden = !!getState().profile.welcomeSeen; };
  subscribe(sync);
  sync();
}
initWelcome();

// 安装确认弹窗 + 本地个人卡 + 关于弹窗（§5.3 / §8.1 / §4.2）
initInstallDialog();
initProfileCard();
initAboutDialog();
