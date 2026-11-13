// 我的库 —— Steam 风格双模式（C1 高保真细化，对照截图 1/2）：
//   未选中  → 库主页（品牌横幅 + 最近游戏卡片）
//   选中后  → 游戏页（主视觉 + 分段按钮/圆形按钮组/三字段元数据行/五页签/动态分享框+时间轴/玩过的好友面板；
//             下载中态：暂停/恢复 + 内联进度 + hero 底部进度条）
// 数据逻辑：D1 静态元数据（games.js）、D2 收藏（library[x].favorite）、D4 真暂停（download-engine）
'use strict';
import { GAME_MAP } from '../data/games.js';
import { getState, subscribe, toggleFavorite, uninstallGame } from '../state/store.js';
import { getSelectedGame, setSelectedGame, subscribeSelection } from '../state/ui.js';
import { fmtSize, artImg, artFallbackHTML, fmtLaunchDate } from '../utils.js';
import { startDownload, pauseDownload, resumeDownload, PREPARING_LINES } from '../state/download-engine.js';
import { pickUpNext } from '../state/lib-rules.js';
import { openInstallDialog } from '../flow/dialogs.js';
import { startLaunchFlow, launchDestination } from '../flow/launch.js';
import { BADGES } from '../data/badges.js';
import { showToast } from '../shell.js';

export function renderLibrary(view) {
  let lastKey = null;
  const unsubStore = subscribe(() => update());
  const unsubSel = subscribeSelection(() => update(true));

  // 上下文菜单外点关闭（渲染间复用一个 document 监听，离开页面时移除）
  let menuCloser = null;
  function armMenuCloser(getMenu) {
    if (menuCloser) document.removeEventListener('click', menuCloser);
    menuCloser = (e) => {
      const menu = getMenu();
      if (menu && !e.target.closest('.splitbtn')) menu.hidden = true;
    };
    document.addEventListener('click', menuCloser);
  }

  function update(force) {
    const state = getState();
    const sel = getSelectedGame();
    const task = sel ? state.downloads.find(d => d.gameId === sel && d.stage !== 'CANCELLED' && d.stage !== 'COMPLETED') : null;
    const key = (sel || 'home') + '|'
      + Object.keys(state.library).map(id => id + ':' + state.library[id].status + (state.library[id].favorite ? ':fav' : '')).join('|')
      + '|task:' + (task ? task.id + ':' + task.stage + ':' + (task.paused ? 'p' : 'r') : '-')
      + '|taskcount:' + state.downloads.filter(d => d.stage !== 'CANCELLED' && d.stage !== 'COMPLETED').length;
    if (force || key !== lastKey) { lastKey = key; render(state, sel); }
    else updateLive(state, sel);
  }

  function render(state, sel) {
    if (sel && GAME_MAP[sel]) renderGame(state, GAME_MAP[sel]);
    else renderHome(state);
  }

  /* ============ 库主页（§6.1） ============ */
  function renderHome(state) {
    const ids = Object.keys(state.library)
      .sort((a, b) => (state.library[b].ownedAt || 0) - (state.library[a].ownedAt || 0));
    // §3.6：未完成问卷时显示「继续完成体验反馈」入口（已揭示且未提交问卷）
    const continueSurvey = state.profile.revealSeen && !state.survey && state.profile.firstRevealGameId;
    // §3.4：徽章陈列区
    const unlockedBadges = (state.profile.badges || [])
      .map(b => BADGES[b.badgeId]).filter(Boolean);
    // §6.1 接下来畅玩：规则见 state/lib-rules.js（owned/installed、排除下载中、
    // launchCount 升序 0 次优先、gameId 稳定、最多 4 款）
    const upNext = pickUpNext(
      Object.keys(state.library).filter(id => GAME_MAP[id]),
      state.library, 4);

    view.innerHTML = `
      <div class="libhome">
        ${continueSurvey ? `
          <button class="libhome__survey" id="home-continue-survey">
            <span class="libhome__survey-ico">&#9997;</span>
            <span><b>继续完成体验反馈</b><br><small>上次的体验揭示还没有完成问卷，结果卡还在等你。</small></span>
          </button>` : ''}
        <div class="libhome__section">
          <div class="libhome__section-head">
            <span class="libhome__section-title">最近游戏</span>
            <button class="libhome__link" id="home-go-store">去商店获取更多</button>
          </div>
          ${ids.length === 0 ? `
            <div class="libhome__empty">
              <p>库还是空的。前往商店获取你的第一款虚构游戏，安装完成后它会出现在这里。</p>
              <button class="btn btn--primary" id="home-store-btn">去商店看看</button>
            </div>` : `
            <div class="libhome__grid" id="libhome-grid"></div>`}
        </div>
        ${upNext.length > 0 ? `
        <div class="libhome__section">
          <div class="libhome__section-head">
            <span class="libhome__section-title">接下来畅玩</span>
            <span class="libhome__section-hint">已获取但很少启动的游戏</span>
          </div>
          <div class="libhome__upnext" id="libhome-upnext"></div>
        </div>` : ''}
        <div class="libhome__section">
          <div class="libhome__section-head">
            <span class="libhome__section-title">徽章</span>
          </div>
          ${unlockedBadges.length === 0 ? `
            <div class="libhome__badge-empty">暂无徽章 · 完成第一款虚构游戏的下载与安装后解锁「${BADGES.first_download.name}」</div>`
          : `<div class="libhome__badges">
              ${unlockedBadges.map(b => `
                <div class="libhome__badge" title="${b.desc}">
                  <span class="libhome__badge-ico">&#127942;</span>
                  <span><b>${b.name}</b><br><small>${b.desc}</small></span>
                </div>`).join('')}
            </div>`}
        </div>
      </div>`;

    view.querySelector('#home-go-store')?.addEventListener('click', () => { location.hash = '#/store'; });
    view.querySelector('#home-store-btn')?.addEventListener('click', () => { location.hash = '#/store'; });
    view.querySelector('#home-continue-survey')?.addEventListener('click', () => {
      location.hash = '#/reveal/' + state.profile.firstRevealGameId;
    });

    const grid = view.querySelector('#libhome-grid');
    if (grid) {
      ids.forEach(id => {
        const g = GAME_MAP[id];
        const lib = state.library[id];
        if (!g) return;
        const card = document.createElement('button');
        card.className = 'libcard';
        card.dataset.gameId = id;
        card.innerHTML = `
          <span class="libcard__cover">${artImg(g, 'icon', 'libcard__img', g.name)}</span>
          <span class="libcard__name">${g.name}</span>
          <span class="libcard__meta" data-meta="${id}">${metaLine(lib)}</span>`;
        card.addEventListener('click', () => setSelectedGame(id));
        grid.appendChild(card);
      });
    }

    const up = view.querySelector('#libhome-upnext');
    if (up) {
      upNext.forEach(id => {
        const g = GAME_MAP[id];
        const lib = state.library[id];
        const n = lib.launchCount || 0;
        const installed = lib.status === 'installed';
        const el = document.createElement('div');
        el.className = 'upnext-card';
        el.dataset.gameId = id;
        el.innerHTML = `
          <span class="upnext-card__icon">${artImg(g, 'icon', 'upnext-card__img', g.name)}</span>
          <span class="upnext-card__info">
            <b class="upnext-card__name">${g.name}</b>
            <small class="upnext-card__sub">${n === 0 ? '从未启动' : `已启动 ${n} 次`}</small>
          </span>
          <button class="btn btn--sm upnext-card__play">${installed ? '&#9654; 开始游戏' : '&#11015; 安装'}</button>`;
        el.querySelector('.upnext-card__play').addEventListener('click', () => {
          setSelectedGame(id);
          if (installed) {
            startLaunchFlow(g, (game) => {
              const dest = launchDestination(getState(), game.id);
              if (dest === '#/library') setSelectedGame(game.id);
              location.hash = dest;
            });
          } else {
            openInstallDialog(g, () => startDownload(g.id));
          }
        });
        el.addEventListener('click', (e) => {
          if (e.target.closest('.upnext-card__play')) return;
          setSelectedGame(id);
        });
        up.appendChild(el);
      });
    }
  }

  function metaLine(lib) {
    if (!lib) return '未获取';
    if (lib.status === 'installed') return '已安装 · 随时开玩';
    if (lib.status === 'downloading') return `下载中 ${Math.round(lib.progress * 100)}%`;
    return '已获取 · 未安装';
  }

  /* ============ 选中游戏页（§6.2，批次 3 接入原创素材与本地动态区） ============ */
  function renderGame(state, g) {
    const lib = state.library[g.id];
    const status = lib ? lib.status : 'none';
    const task = state.downloads.find(d => d.gameId === g.id && d.stage !== 'CANCELLED' && d.stage !== 'COMPLETED');
    const fav = !!(lib && lib.favorite);
    const lastLaunch = fmtLaunchDate(lib && lib.lastLaunchedAt);

    // §6.2 动态区：只显示当前游戏的本地事件，时间倒序；无事件显示空状态。
    // 不生成任何虚构社区内容。
    const EVT_TEXT = {
      acquire: '开始获取（加入下载队列）',
      download_start: '开始获取（加入下载队列）',
      download_pause: '暂停了下载',
      download_resume: '恢复了下载',
      download_cancel: '取消了下载任务',
      download_complete: '安装完成，已加入游戏库',
      uninstall: '卸载（已保留收藏、启动统计与下载记录）',
      launch: '启动了游戏（伪启动，本地记录）',
      badge_unlock: '解锁徽章',
      survey_submit: '提交了体验反馈问卷',
      reveal: '完成了首次体验揭示',
      welcome_accept: '进入了不玩游戏',
    };
    const events = state.events
      .map((e, i) => ({ ...e, _i: i }))
      .filter(e => e.gameId === g.id)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0) || (b._i - a._i))
      .slice(0, 8);

    view.innerHTML = `
      <div class="libgame">
        <div class="libgame__hero libgame__hero--art">
          ${artImg(g, 'hero', 'libgame__hero-bg', '')}
          <div class="libgame__hero-shade"></div>
          <div class="libgame__hero-text">
            <span class="libgame__logo">${artImg(g, 'logo', 'libgame__logo-img', g.name)}</span>
            <div class="libgame__hook">${g.hook}</div>
          </div>
          <div class="libgame__orbs">
            <button class="orb" id="orb-cog" title="属性">&#x2699;</button>
            <button class="orb" id="orb-info" title="详细信息">&#x2139;</button>
            <button class="orb orb--fav ${fav ? 'orb--on' : ''}" id="orb-fav" title="${fav ? '取消收藏' : '收藏'}">${fav ? '&#9829;' : '&#9825;'}</button>
          </div>
          ${status === 'downloading' ? `
            <div class="libgame__herobar"><i id="hero-fill" style="width:${Math.round((lib ? lib.progress : 0) * 100)}%"></i></div>` : ''}
        </div>
        <div class="libgame__actionbar">
          <span class="libgame__action" id="game-action"></span>
          <div class="libgame__stats">
            <div class="libgame__stat"><span class="libgame__stat-label">需要的空间</span><span class="libgame__stat-value">${fmtSize(g.sizeMB)}</span></div>
            <div class="libgame__stat"><span class="libgame__stat-label">评分</span><span class="libgame__stat-value">${g.rating.toFixed(1)} / 5</span></div>
            <div class="libgame__stat"><span class="libgame__stat-label">发行商</span><span class="libgame__stat-value">${g.publisher}</span></div>
            <div class="libgame__stat"><span class="libgame__stat-label">本地启动次数</span><span class="libgame__stat-value">${(lib && lib.launchCount) || 0} 次</span></div>
            <div class="libgame__stat"><span class="libgame__stat-label">最近启动</span><span class="libgame__stat-value">${lastLaunch || '&#8212;'}</span></div>
          </div>
        </div>
        <div class="libgame__tabs">
          <button class="libgame__tab" id="tab-storepage">商店页面</button>
          <button class="libgame__tab libgame__tab--disabled" data-offline aria-disabled="true">DLC</button>
          <button class="libgame__tab libgame__tab--disabled" data-offline aria-disabled="true">社区中心</button>
          <button class="libgame__tab libgame__tab--disabled" data-offline aria-disabled="true">讨论区</button>
          <button class="libgame__tab libgame__tab--disabled" data-offline aria-disabled="true">指南</button>
        </div>
        <div class="libgame__body2col">
          <div class="libgame__maincol">
            <div class="libgame__section-title">动态</div>
            ${events.length === 0 ? `
              <div class="libgame__tl-empty">暂无本地动态。安装、启动或解锁徽章后会显示在这里（仅本机记录，不连接任何社区）。</div>`
            : `<div class="libgame__tl">
              ${events.map(e => `
                <div class="libgame__tl-item">
                  <div class="libgame__tl-date">${fmtLaunchDate(e.ts) || ''}</div>
                  <div class="libgame__tl-card"><p>${EVT_TEXT[e.event] || e.event}</p></div>
                </div>`).join('')}
            </div>`}
          </div>
          <aside class="libgame__sidecol">
            <div class="libgame__friends">
              <div class="libgame__friends-head">游戏信息</div>
              <div class="libgame__metarow"><span>开发商</span><b>${g.developer}</b></div>
              <div class="libgame__metarow"><span>发行商</span><b>${g.publisher}</b></div>
              <div class="libgame__metarow"><span>发行日期</span><b>${g.releaseDate}</b></div>
              <div class="libgame__metarow"><span>标签</span><b>${g.tags.join('、')}</b></div>
              <div class="libgame__metarow"><span>数据来源</span><b>本地虚构常量</b></div>
            </div>
          </aside>
        </div>
      </div>`;

    view.querySelector('#tab-storepage')?.addEventListener('click', () => { location.hash = '#/detail/' + g.id; });
    view.querySelectorAll('[data-offline]').forEach(b => b.addEventListener('click', () => showToast('离线体验不可用')));
    view.querySelector('#orb-cog')?.addEventListener('click', () => showToast('属性为演示占位（本地虚构数据）'));
    view.querySelector('#orb-info')?.addEventListener('click', () => showToast(g.hook));
    view.querySelector('#orb-fav')?.addEventListener('click', () => {
      const added = toggleFavorite(g.id);
      if (added === null) { showToast('仅已获取的游戏可收藏'); return; }
      showToast(added ? `已收藏《${g.name}》· 可在左栏收藏夹查看` : `已取消收藏《${g.name}》`);
    });

    bindAction(g, status, task);
    armMenuCloser(() => view.querySelector('#act-menu'));
  }

  /* ---- 主操作区：分段按钮（安装 ▾）/ 暂停恢复 / 免费获取 ---- */
  function actionHTML(status, g, task) {
    const ctx = (items) => `
        <button class="btn btn--primary btn--lg splitbtn__arrow" id="act-arrow" aria-label="更多操作">&#x25BE;</button>
        <div class="ctxmenu" id="act-menu" hidden>
          ${items.map(([cmd, label]) => `<button class="ctxmenu__item" data-cmd="${cmd}">${label}</button>`).join('')}
        </div>`;
    if (status === 'installed') {
      return `
        <div class="splitbtn">
          <button class="btn btn--primary btn--lg splitbtn__main" id="act-main">&#9654; 开始游戏</button>
          ${ctx([['uninstall', '卸载…'], ['browse', '浏览本地文件'], ['props', '属性…']])}
        </div>`;
    }
    if (status === 'downloading') {
      const paused = task && task.paused;
      return `
        <button class="btn btn--primary btn--lg" id="act-pause">${paused ? '&#9654; 恢复' : '&#10074;&#10074; 暂停'}</button>
        <span class="libgame__dlinline">
          <span class="libgame__dlinline-stage" id="dl-stage">${task ? stageLine(task) : ''}</span>
          <span class="libgame__dlinline-track"><i id="dl-inline-fill" style="width:${task ? Math.round(task.progress * 100) : 0}%"></i></span>
          <b class="libgame__dlinline-pct" id="dl-pct">${task ? Math.round(task.progress * 100) : 0}%</b>
        </span>`;
    }
    if (status === 'owned') {
      return `
        <div class="splitbtn">
          <button class="btn btn--primary btn--lg splitbtn__main" id="act-main">&#11015; 安装</button>
          ${ctx([['browse', '浏览本地文件'], ['props', '属性…']])}
        </div>`;
    }
    return `<button class="btn btn--primary btn--lg" id="act-free">免费获取</button>`;
  }

  function bindAction(g, status, task) {
    const slot = view.querySelector('#game-action');
    if (!slot) return;
    slot.innerHTML = actionHTML(status, g, task);

    // 分段按钮箭头 → 上下文菜单
    slot.querySelector('#act-arrow')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = slot.querySelector('#act-menu');
      if (menu) menu.hidden = !menu.hidden;
    });
    slot.querySelectorAll('.ctxmenu__item').forEach(btn => btn.addEventListener('click', () => {
      const menu = slot.querySelector('#act-menu');
      // 卸载（§6.4）：两步确认——首次点击武装（菜单保持打开），3 秒内再点确认执行
      if (btn.dataset.cmd === 'uninstall') {
        if (!btn.dataset.armed) {
          btn.dataset.armed = '1';
          btn.textContent = '确认卸载？';
          setTimeout(() => {
            if (btn.dataset.armed) { btn.dataset.armed = ''; btn.textContent = '卸载…'; }
          }, 3000);
          return;
        }
        btn.dataset.armed = '';
        btn.textContent = '卸载…';
        if (menu) menu.hidden = true;
        uninstallGame(g.id);
        showToast(`已卸载《${g.name}》· 已保留收藏、启动统计与下载记录`);
        return;
      }
      if (menu) menu.hidden = true;
      const cmds = {
        browse: '演示占位：本地虚构数据，无真实安装目录',
        props: '演示占位：属性面板筹备中',
      };
      showToast(cmds[btn.dataset.cmd] || '演示占位');
    }));

    slot.querySelector('#act-main')?.addEventListener('click', function () {
      if (status === 'installed') {
        // 伪启动（§3.5）：3～4 秒原创伪启动画面；结束后 recordLaunch 计数，
        // 首次（未揭示）进揭示页，后续返回该游戏的库页面（§3.9）
        startLaunchFlow(g, (game) => {
          const dest = launchDestination(getState(), game.id);
          if (dest === '#/library') setSelectedGame(game.id); // 返回该游戏的库页面
          location.hash = dest;
        });
      } else if (status === 'owned') {
        // 安装确认弹窗（§5.3）：确认后留在库页直接呈现下载中状态
        openInstallDialog(g, () => startDownload(g.id));
      }
    });
    slot.querySelector('#act-pause')?.addEventListener('click', () => {
      if (!task) return;
      if (task.paused) { resumeDownload(task.id); showToast('已恢复下载'); }
      else { pauseDownload(task.id); showToast('已暂停下载'); }
    });
    slot.querySelector('#act-free')?.addEventListener('click', () => {
      // 安装确认弹窗（§5.3）：确认后留在库页观看下载状态
      openInstallDialog(g, () => startDownload(g.id));
    });
  }

  // 阶段文案（与下载页口径一致）
  function stageLine(task) {
    if (task.paused) return '已暂停';
    switch (task.stage) {
      case 'QUEUED': return '排队中';
      case 'PREPARING': {
        const idx = Math.min(PREPARING_LINES.length - 1, Math.floor((task.elapsedMs || 0) / 1000));
        return PREPARING_LINES[idx] || PREPARING_LINES[0];
      }
      case 'DOWNLOADING': return '正在下载数据';
      case 'VERIFYING': return '校验文件完整性…';
      case 'INSTALLING': return '正在安装文件';
      case 'SHORTCUT': return '创建快捷方式…';
      default: return task.stage;
    }
  }

  /* ============ 每 tick 轻量更新（不重建结构） ============ */
  function updateLive(state, sel) {
    if (sel) {
      const task = state.downloads.find(d => d.gameId === sel && d.stage !== 'CANCELLED' && d.stage !== 'COMPLETED');
      const pctText = task ? Math.round(task.progress * 100) + '%' : null;
      const pct = view.querySelector('#dl-pct');
      const fill = view.querySelector('#dl-inline-fill');
      const stageEl = view.querySelector('#dl-stage');
      const heroFill = view.querySelector('#hero-fill');
      if (pct && pctText) pct.textContent = pctText;
      if (fill && task) fill.style.width = Math.round(task.progress * 100) + '%';
      if (stageEl && task) stageEl.textContent = stageLine(task);
      if (heroFill && task) heroFill.style.width = Math.round(task.progress * 100) + '%';
    }
    view.querySelectorAll('.libcard [data-meta]').forEach(el => {
      el.textContent = metaLine(state.library[el.dataset.meta]);
    });
  }

  update(true);
  return {
    onLeave() {
      if (menuCloser) { document.removeEventListener('click', menuCloser); menuCloser = null; }
      unsubStore(); unsubSel();
    },
  };
}
