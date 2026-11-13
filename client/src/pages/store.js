import { GAMES, pickFeatured } from '../data/games.js';
import { fmtSize, artImg } from '../utils.js';
import { getState, subscribe } from '../state/store.js';

export function renderStore(view) {
  const featured = pickFeatured(GAMES);

  view.innerHTML = `
    <div class="page page--store">
      <div class="page__head">
        <h2>商店</h2>
        <p class="page__sub">6 款虚构游戏 · 全部本地数据，不会真实下载任何东西</p>
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
    </div>`;

  view.querySelector('#store-hero')?.addEventListener('click', () => { location.hash = '#/detail/' + featured.id; });

  const grid = view.querySelector('#store-grid');
  const statusRefs = new Map(); // gameId -> 状态徽标元素

  GAMES.forEach(g => {
    const card = document.createElement('button');
    card.className = 'card';
    card.setAttribute('aria-label', g.name);
    // 修订①：竖版卡片封面使用 portrait.webp；header.webp 仅用于上方焦点推荐区
    card.innerHTML = `
      <div class="card__cover" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">
        ${artImg(g, 'portrait', 'card__img', g.name)}
        <span class="card__rating">&#9733; ${g.rating.toFixed(1)}</span>
        <span class="card__size">${fmtSize(g.sizeMB)}</span>
        <span class="card__status"></span>
      </div>
      <div class="card__body">
        <div class="card__name">${g.name}</div>
        <div class="card__hook">${g.hook}</div>
        <div class="card__tags">${g.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>`;
    card.addEventListener('click', () => { location.hash = '#/detail/' + g.id; });
    grid.appendChild(card);
    statusRefs.set(g.id, card.querySelector('.card__status'));
  });

  // 状态徽标随 store 订阅刷新（下载进度变化即时反映）
  const unsubscribe = subscribe(updateStatus);
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

  // 搜索过滤
  const search = document.getElementById('search-input');
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    grid.querySelectorAll('.card').forEach((card, i) => {
      const g = GAMES[i];
      const hit = !q || g.name.toLowerCase().includes(q)
        || g.tags.some(t => t.toLowerCase().includes(q))
        || g.publisher.toLowerCase().includes(q);
      card.style.display = hit ? '' : 'none';
    });
  };

  return {
    onLeave() { search.oninput = null; unsubscribe(); },
  };
}
