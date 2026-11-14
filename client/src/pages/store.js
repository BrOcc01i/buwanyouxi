// 商店页 —— 焦点推荐 + 分类 chips + 搜索 + 卡片网格
// 批次 6：分类筛选（真筛选）、页头计数动态化、卡片用 data-game-id 解除下标耦合
import { GAMES, pickFeatured } from '../data/games.js';
import { CATEGORIES } from '../data/categories.js';
import { fmtSize, artImg } from '../utils.js';
import { getState, subscribe, isAdultAllowed } from '../state/store.js';
import { getStoreCategory, setStoreCategory, subscribeStoreCategory } from '../state/ui.js';
import { openAdultGateDialog } from '../flow/dialogs.js';

export function renderStore(view) {
  const featured = pickFeatured(GAMES);

  view.innerHTML = `
    <div class="page page--store">
      <div class="page__head page__head--store">
        <div class="page__headtext">
          <h2>商店</h2>
          <p class="page__sub">${GAMES.length} 款虚构作品 · 全部本地数据，不会真实下载任何东西</p>
        </div>
        <nav class="chips" id="store-chips" aria-label="分类筛选"></nav>
        <input id="store-search" class="store-search" type="search" placeholder="搜索作品或标签" autocomplete="off" aria-label="搜索" />
      </div>
      <button class="storehero" id="store-hero" aria-label="焦点推荐：${featured.name}">
        <span class="storehero__img">${artImg(featured, 'header', 'storehero__bg', featured.name)}</span>
        <span class="storehero__shade"></span>
        <span class="storehero__text">
          <span class="storehero__kicker">焦点推荐</span>
          <span class="storehero__name">${featured.name}</span>
          <span class="storehero__hook">${featured.hook}</span>
          <span class="storehero__meta">&#9733; ${featured.rating.toFixed(1)} · ${fmtSize(featured.sizeMB)} · ${featured.publisher}</span>
        </span>
      </button>
      <div class="grid" id="store-grid"></div>
      <div class="grid__empty" id="store-empty" hidden>
        <p>没有符合条件的作品。你的筛选项比游戏还严格。</p>
        <button class="btn btn--sm" id="store-reset">重置筛选</button>
      </div>
    </div>`;

  view.querySelector('#store-hero')?.addEventListener('click', () => { location.hash = '#/detail/' + featured.id; });

  const grid = view.querySelector('#store-grid');
  const chipsEl = view.querySelector('#store-chips');
  const search = view.querySelector('#store-search');
  const emptyEl = view.querySelector('#store-empty');
  const statusRefs = new Map(); // gameId -> 状态徽标元素

  // 卡片一次性建好并常驻 DOM，筛选只切 hidden —— 保证 statusRefs 与下载进度刷新逻辑不受影响
  GAMES.forEach(g => {
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.gameId = g.id;
    card.setAttribute('aria-label', g.name);
    card.innerHTML = `
      <div class="card__cover" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">
        ${artImg(g, 'portrait', 'card__img', g.name)}
        ${g.isAdult === true ? '<span class="card__adult">18+</span>' : ''}
        <span class="card__rating">&#9733; ${g.rating.toFixed(1)}</span>
        <span class="card__size">${fmtSize(g.sizeMB)}</span>
        <span class="card__status"></span>
      </div>
      <div class="card__body">
        <div class="card__name">${g.name}</div>
        <div class="card__hook">${g.hook}</div>
        <div class="card__tags">${g.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>`;
    card.addEventListener('click', () => {
      if (g.isAdult === true && !isAdultAllowed()) {
        openAdultGateDialog(g, () => { location.hash = '#/detail/' + g.id; });
        return;
      }
      location.hash = '#/detail/' + g.id;
    });
    grid.appendChild(card);
    statusRefs.set(g.id, card.querySelector('.card__status'));
  });

  /* ---- 分类 chips：计数随「分类 + 搜索」实时算，避免点进空页 ---- */
  function matches(g, cat, q) {
    if (g.isAdult === true && !getState().settings.showAdult) return false;   // 已关闭显示 → 全目录隐藏
    if (cat !== 'all' && g.category !== cat) return false;
    if (!q) return true;
    return g.name.toLowerCase().includes(q)
      || g.tags.some(t => t.toLowerCase().includes(q))
      || g.publisher.toLowerCase().includes(q);
  }

  function renderChips() {
    const q = search.value.trim().toLowerCase();
    const total = GAMES.filter(g => matches(g, 'all', q)).length;
    const cat = getStoreCategory();
    // 零条目的分类不渲染（分批扩容期间会出现「动作 0」，点进去是空页 = 死路）；
    // 当前选中的分类即使为 0 也保留，避免筛选被悄悄重置
    const items = [{ key: 'all', label: '全部', n: total }]
      .concat(CATEGORIES
        .map(c => ({ key: c.key, label: c.label, n: GAMES.filter(g => matches(g, c.key, q)).length }))
        .filter(c => c.n > 0 || c.key === cat));
    chipsEl.innerHTML = items.map(c => {
      const active = cat === c.key;
      return `<button class="chip ${active ? 'is-active' : ''}" data-cat="${c.key}" aria-pressed="${active}">${c.label}<span class="chip__n">${c.n}</span></button>`;
    }).join('');
    chipsEl.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => setStoreCategory(btn.dataset.cat));
    });
  }

  function applyFilter() {
    const cat = getStoreCategory();
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    GAMES.forEach(g => {
      const card = grid.querySelector(`.card[data-game-id="${g.id}"]`);
      if (!card) return;
      const hit = matches(g, cat, q);
      card.hidden = !hit;
      if (hit) visible++;
    });
    emptyEl.hidden = visible > 0;
    renderChips();
  }

  // 状态徽标随 store 订阅刷新（只写文本/类名，不碰 hidden）
  const unsubscribeStatus = subscribe(() => { updateStatus(); applyFilter(); });
  function updateStatus() {
    const state = getState();
    GAMES.forEach(g => {
      const el = statusRefs.get(g.id);
      if (!el) return;
      const lib = state.library[g.id];
      if (lib && lib.status === 'installed') {
        el.textContent = '已在库中';
        el.className = 'card__status card__status--ok';
      } else if (lib && lib.status === 'downloading') {
        el.textContent = '下载中 ' + Math.round(lib.progress * 100) + '%';
        el.className = 'card__status card__status--dl';
      } else {
        el.textContent = '';
        el.className = 'card__status';
      }
    });
  }
  updateStatus();

  search.addEventListener('input', applyFilter);
  view.querySelector('#store-reset')?.addEventListener('click', () => {
    search.value = '';
    setStoreCategory('all');
    applyFilter();
  });
  const unsubscribeCat = subscribeStoreCategory(applyFilter);

  applyFilter();

  return {
    onLeave() {
      search.removeEventListener('input', applyFilter);
      unsubscribeStatus();
      unsubscribeCat();
    },
  };
}
