// 极简 hash 路由 —— 零依赖
const routes = new Map();
let current = null;

export function register(path, handler) {
  routes.set(path, handler);
}

function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/store';
  const parts = h.split('/').filter(Boolean);
  const path = '/' + (parts[0] || 'store');
  return { path, params: parts.slice(1) };
}

function render() {
  const { path, params } = parseHash();
  let handler = routes.get(path);
  if (!handler) handler = routes.get('/store');
  const view = document.getElementById('view');
  if (current && typeof current.onLeave === 'function') current.onLeave();
  const result = handler(view, params) || {};
  current = result;
  // 高亮当前导航项
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('nav-item--active', el.dataset.route === path);
  });
  view.scrollTop = 0;
}

export function start() {
  if (!location.hash) location.hash = '#/store';
  window.addEventListener('hashchange', render);
  render();
}

export function go(path) {
  location.hash = '#' + path;
}
