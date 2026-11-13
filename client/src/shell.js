// 全局壳层：窗口控制、导航辅助、左侧游戏栏（收藏夹/未分类/搜索/下载%后缀）、底部状态栏（下载 mini）、Toast
// 壳层只负责「框架 UI」，中央内容仍由 router/pages 渲染到 #view
'use strict';
import { GAMES, GAME_MAP } from './data/games.js';
import { getState, subscribe } from './state/store.js';
import { pickActiveTask } from './state/download-engine.js';
import { getSelectedGame, setSelectedGame, subscribeSelection, getSidebarFilter, getSidebarSort, setSidebarFilter, setSidebarSort, subscribeSidebar } from './state/ui.js';
import { openProfileCard, openAboutDialog } from './flow/dialogs.js';
import { artFallbackHTML, artImg } from './utils.js';
import { sortLibraryIds, applyStatusFilter } from './state/lib-rules.js';

let toastTimer = null;
export function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
}

function currentPath() {
  return location.hash.replace(/^#/, '') || '/store';
}

// 引擎阶段常量（与 download-engine 对齐；暂停任务（paused）也展示为进行中样式）
const DL_LIVE = ['PREPARING', 'DOWNLOADING', 'VERIFYING', 'INSTALLING', 'SHORTCUT'];
const dlPct = t => Math.round((t && typeof t.progress === 'number' ? t.progress : 0) * 100);

export function initShell() {
  const nw = window.nwApp || {};

  /* ---- 标题栏窗口控制（frameless + IPC） ---- */
  document.getElementById('win-min')?.addEventListener('click', () => nw.windowControls?.('minimize'));
  document.getElementById('win-max')?.addEventListener('click', () => nw.windowControls?.('maximize'));
  document.getElementById('win-close')?.addEventListener('click', () => nw.windowControls?.('close'));

  /* ---- 主导航辅助按钮 ---- */
  document.getElementById('nav-back')?.addEventListener('click', () => history.back());
  document.getElementById('nav-fwd')?.addEventListener('click', () => history.forward());
  document.getElementById('nav-downloads')?.addEventListener('click', () => { location.hash = '#/downloads'; });
  document.getElementById('nav-settings')?.addEventListener('click', () => { location.hash = '#/settings'; });
  document.getElementById('nav-community')?.addEventListener('click', () => showToast('离线体验不可用'));

  /* ---- 本地个人卡（§8.1）：右上角「本地访客」打开 ---- */
  document.getElementById('user-area')?.addEventListener('click', openProfileCard);

  /* ---- 顶部菜单（§4.2）：查看/游戏下拉 + 好友禁用态 + 帮助关于弹窗 ---- */
  const menuDefs = [
    { btn: 'menu-view', dd: 'menu-view-dd' },
    { btn: 'menu-game', dd: 'menu-game-dd' },
  ];
  function closeAllMenus(except = null) {
    menuDefs.forEach(({ btn, dd }) => {
      if (dd === except) return;
      document.getElementById(dd)?.setAttribute('hidden', '');
      document.getElementById(btn)?.setAttribute('aria-expanded', 'false');
    });
  }
  menuDefs.forEach(({ btn, dd }) => {
    const b = document.getElementById(btn);
    const d = document.getElementById(dd);
    if (!b || !d) return;
    b.addEventListener('click', () => {
      const willOpen = d.hidden;
      closeAllMenus(dd);
      d.hidden = !willOpen;
      b.setAttribute('aria-expanded', String(willOpen));
    });
    // 菜单项：本地导航后收起菜单
    d.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', () => {
        closeAllMenus();
        location.hash = item.dataset.nav;
      });
    });
  });
  // 退出：走窗口关闭（与标题栏 ✕ 相同 IPC 通道），不启动外部进程
  document.getElementById('menu-quit')?.addEventListener('click', () => {
    closeAllMenus();
    nw.windowControls?.('close') ?? window.close();
  });
  // 点击外部关闭 + Esc 关闭
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('.tmenu-wrap')) closeAllMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
  });
  // 好友（标题栏菜单）：禁用态，提示与社区/底部好友统一
  document.getElementById('menu-friends')?.addEventListener('click', () => showToast('离线体验不可用'));
  // 帮助：打开「关于不玩游戏」弹窗
  document.getElementById('menu-help')?.addEventListener('click', openAboutDialog);

  /* ---- 底部状态栏 ---- */
  document.getElementById('sb-add')?.addEventListener('click', () => { location.hash = '#/store'; });
  document.getElementById('sb-downloads')?.addEventListener('click', () => { location.hash = '#/downloads'; });
  document.getElementById('sb-friends')?.addEventListener('click', () => showToast('离线体验不可用'));

  /* ---- 批次 3（§9）：素材一次性降级 ----
     error 事件不冒泡，用捕获监听；img 替换为 emoji+渐变占位后即脱离 DOM，天然只降级一次 */
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (!el || el.tagName !== 'IMG' || !el.dataset.fb) return;
    const g = GAME_MAP[el.dataset.fb];
    if (!g) return;
    el.outerHTML = artFallbackHTML(g, 'art-fb--inline');
  }, true);

  /* ---- 左侧栏筛选/排序控件（§4.3） ---- */
  const filterSel = document.getElementById('rail-filter');
  const sortSel = document.getElementById('rail-sort');
  filterSel?.addEventListener('change', () => setSidebarFilter(filterSel.value));
  sortSel?.addEventListener('change', () => setSidebarSort(sortSel.value));
  subscribeSidebar(() => renderList(getState()));

  /* ---- 左侧游戏栏 ---- */
  const favListEl = document.getElementById('rail-fav-list');
  const favCountEl = document.getElementById('rail-fav');
  const listEl = document.getElementById('rail-list');
  const uncatEl = document.getElementById('rail-uncat');
  const homeBtn = document.getElementById('rail-home');
  const gridBtn = document.getElementById('rail-grid');
  const searchEl = document.getElementById('search-input');
  let filter = '';

  // 返修①：左侧栏仅在 #/library 显示；商店/下载/设置/揭示等其他路由隐藏
  const railEl = document.querySelector('.rail');
  function updateRailVisibility() {
    if (railEl) railEl.hidden = !currentPath().startsWith('/library');
  }
  window.addEventListener('hashchange', updateRailVisibility);
  updateRailVisibility();

  homeBtn?.addEventListener('click', () => {
    setSelectedGame(null);
    if (currentPath() !== '/library') location.hash = '#/library';
  });
  gridBtn?.addEventListener('click', () => showToast('视图切换为演示占位'));

  // 注意：store.js 通过 oninput 绑定商店过滤，这里用 addEventListener 互不覆盖
  searchEl?.addEventListener('input', () => {
    filter = searchEl.value.trim().toLowerCase();
    renderList(getState());
  });

  function matchFilter(g) {
    return !filter || g.name.toLowerCase().includes(filter)
      || g.tags.some(t => t.toLowerCase().includes(filter));
  }

  // §4.3 状态筛选与排序规则见 state/lib-rules.js（纯函数，测试覆盖）
  function sortGames(ids, state) {
    return sortLibraryIds(ids, state.library, getSidebarSort());
  }

  function renderItem(container, g, state) {
    const lib = state.library[g.id];
    const li = document.createElement('li');
    li.className = 'rail__item';
    li.dataset.gameId = g.id;
    li.title = g.hook;
    if (lib && lib.status === 'downloading') li.classList.add('rail__item--dl');
    else if (!lib) li.classList.add('rail__item--dim');
    // C1（截图 2）：下载中的条目名后缀「 - N%」
    const name = (lib && lib.status === 'downloading')
      ? `${g.name} - ${dlPct(lib.progress)}%`
      : g.name;
    li.innerHTML = `
      <span class="rail__swatch" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">${artImg(g, 'icon', 'rail__swatch-img', g.name)}</span>
      <span class="rail__itembody">
        <span class="rail__name">${name}</span>
        ${lib && lib.status === 'downloading' ? `<span class="rail__mini"><span class="rail__minifill" style="width:${dlPct(lib.progress)}%"></span></span>` : ''}
      </span>`;
    li.addEventListener('click', () => {
      setSelectedGame(g.id);
      location.hash = '#/library';
    });
    container.appendChild(li);
  }

  function renderList(state) {
    if (!listEl) return;
    // 收藏唯一真源：library[x].favorite；搜索 ∩ 状态筛选 ∩ 排序 组合（规则见 lib-rules.js）
    const pool = applyStatusFilter(
      GAMES.filter(g => matchFilter(g)).map(g => g.id),
      state.library, getSidebarFilter());
    const ordered = sortGames(pool, state);
    const favSet = new Set(Object.keys(state.library).filter(id => state.library[id].favorite));
    const favShown = ordered.filter(id => favSet.has(id)).map(id => GAME_MAP[id]);
    const restShown = ordered.filter(id => !favSet.has(id)).map(id => GAME_MAP[id]);

    if (favListEl) {
      favListEl.innerHTML = '';
      favShown.forEach(g => renderItem(favListEl, g, state));
    }
    if (favCountEl) favCountEl.textContent = `(${favShown.length})`;

    listEl.innerHTML = '';
    restShown.forEach(g => renderItem(listEl, g, state));
    if (uncatEl) uncatEl.textContent = `(${restShown.length})`;
    markSelected();
  }

  function markSelected() {
    const sel = getSelectedGame();
    document.querySelectorAll('.rail__item').forEach(el => {
      el.classList.toggle('rail__item--active', el.dataset.gameId === sel);
    });
    homeBtn?.classList.toggle('rail__home--active', !sel);
  }

  // 下载中：仅更新 mini 进度条宽度与名称后缀（不重建列表）
  function updateMini(state) {
    document.querySelectorAll('.rail__item--dl').forEach(el => {
      const lib = state.library[el.dataset.gameId];
      const fill = el.querySelector('.rail__minifill');
      if (!lib) return;
      if (fill) fill.style.width = dlPct(lib.progress) + '%';
      const nameEl = el.querySelector('.rail__name');
      const g = GAME_MAP[el.dataset.gameId];
      if (nameEl && g) nameEl.textContent = `${g.name} - ${dlPct(lib.progress)}%`;
    });
  }

  /* ---- 状态栏下载 mini（C1 截图 2：图标 + 名称 + 进度条 + %） ---- */
  const sbDlBtn = document.getElementById('sb-downloads');
  const SB_DL_DEFAULT = '<span class="sb-ico">&#x2B07;</span> 管理下载';
  let miniKey = null;

  function liveTask(state) {
    return pickActiveTask(state); // 规格④：统一优选规则（ACTIVE&&!paused → 第一个 paused）
  }

  function renderMini(state) {
    if (!sbDlBtn) return;
    const t = liveTask(state);
    // C2（截图 3）：「正在下载 N 项中的 M 项」——N=待完成总数，M=当前活动项位次
    const pend = t ? state.downloads.filter(d => d.stage !== 'CANCELLED' && d.stage !== 'COMPLETED') : [];
    const idx = t ? pend.findIndex(d => d.id === t.id) : -1;
    // key 含 paused/stage/progress/id：暂停切换、进度推进、阶段变化都需重渲染 mini
    const key = t ? t.id + ':' + t.stage + ':' + (t.paused ? 'p' : 'r') + ':' + Math.round((t.progress || 0) * 100) + ':' + pend.length + ':' + idx : 'idle';
    if (key !== miniKey) {
      miniKey = key;
      if (!t || !GAME_MAP[t.gameId]) {
        sbDlBtn.innerHTML = SB_DL_DEFAULT;
      } else {
        const g = GAME_MAP[t.gameId];
        const label = idx >= 0 ? `正在下载 ${pend.length} 项中的 ${idx + 1} 项` : g.name;
        sbDlBtn.innerHTML = `
          <span class="sb-dl">
            <span class="sb-dl__swatch" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">${artImg(g, 'icon', 'sb-dl__swatch-img', g.name)}</span>
            <span class="sb-dl__name">${label}</span>
            <span class="sb-dl__bar"><i id="sb-dl-fill" style="width:${dlPct(t)}%"></i></span>
            <span class="sb-dl__pct" id="sb-dl-pct">${dlPct(t)}%</span>
          </span>`;
      }
    }
    if (t) {
      const fill = document.getElementById('sb-dl-fill');
      const pctEl = document.getElementById('sb-dl-pct');
      if (fill) fill.style.width = dlPct(t) + '%';
      if (pctEl) pctEl.textContent = dlPct(t) + '%';
    }
  }

  let lastStruct = null;
  function onState(state) {
    const struct = Object.keys(state.library).map(id => id + ':' + state.library[id].status + (state.library[id].favorite ? ':fav' : '')).join('|')
      + '|dl:' + state.downloads.map(d => d.id + ':' + d.stage + ':' + (d.paused ? 'p' : 'r')).join(',');
    if (struct !== lastStruct) {
      lastStruct = struct;
      renderList(state);
    } else {
      updateMini(state);
    }
    renderMini(state);
  }

  subscribe(onState);
  subscribeSelection(() => markSelected());
  lastStruct = '';
  onState(getState());
}
