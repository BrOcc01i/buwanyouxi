// 商店详情页 —— Steam 商店页风格：
//   主视觉横幅 + 右侧购买栏（获取/启动/下载进度）+ 关于区块 + 右侧事实清单
// 数据逻辑不变：仍走 startDownload / store 状态
'use strict';
import { GAME_MAP } from '../data/games.js';
import { fmtSize, artImg } from '../utils.js';
import { getState, subscribe } from '../state/store.js';
import { setSelectedGame } from '../state/ui.js';
import { startDownload } from '../state/download-engine.js';
import { openInstallDialog, openGiftDialog } from '../flow/dialogs.js';
import { startLaunchFlow, launchDestination } from '../flow/launch.js';

export function renderDetail(view, params) {
  const id = params && params[0];
  const g = id && GAME_MAP[id];
  if (!g) { location.hash = '#/store'; return {}; }

  view.innerHTML = `
    <div class="storedetail">
      <button class="btn btn--ghost storedetail__back" id="back-btn">&#x2190; 返回商店</button>
      <div class="storedetail__hero storedetail__hero--art">
        ${artImg(g, 'header', 'storedetail__hero-bg', g.name)}
        <span class="storedetail__hero-shade"></span>
        <div class="storedetail__hero-text">
          <div class="storedetail__logo">${artImg(g, 'logo', 'storedetail__logo-img', g.name)}</div>
          <div class="storedetail__hook">${g.hook}</div>
        </div>
      </div>
      <div class="storedetail__shots">
        ${g.assets.screenshots.map((src, i) => `
          <span class="storedetail__shot"><img src="${src}" class="storedetail__shot-img" alt="${g.name} 截图 ${i + 1}" data-fb="${g.id}" draggable="false" /></span>`).join('')}
      </div>
      <div class="storedetail__body">
        <div class="storedetail__desccol">
          <div class="storedetail__section-title">关于这款游戏</div>
          <p class="storedetail__desc">${g.desc}</p>
          <div class="storedetail__section-title">标签</div>
          <div class="storedetail__tags">${g.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
        <div class="storedetail__side">
          <div class="storedetail__mini" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">
            ${artImg(g, 'icon', 'storedetail__mini-img', g.name)}
          </div>
          <div class="storedetail__facts">
            <div class="storedetail__fact"><span>评价</span><b>&#9733; ${g.rating.toFixed(1)}</b></div>
            <div class="storedetail__fact"><span>已有获取</span><b>${g.owners.toLocaleString()} 人</b></div>
            <div class="storedetail__fact"><span>发行商</span><b>${g.publisher}</b></div>
            <div class="storedetail__fact"><span>体积</span><b>${fmtSize(g.sizeMB)}</b></div>
          </div>
          <div class="storedetail__actions" id="detail-actions"></div>
          <div class="giftbox" id="gift-box"></div>
          <div class="storedetail__hint">本地虚构数据 · 获取人数与评分均为虚构常量 · 不真实下载</div>
        </div>
      </div>
    </div>`;

  view.querySelector('#back-btn').addEventListener('click', () => { location.hash = '#/store'; });

  let lastStatus = '__none__';
  const unsubscribe = subscribe(update);

  function update() {
    const state = getState();
    const lib = state.library[id];
    const status = lib ? lib.status : null;
    const actions = view.querySelector('#detail-actions');
    if (!actions) return;

    renderGiftBox(state);

    if (status !== lastStatus) {
      lastStatus = status;
      actions.innerHTML = buildActions(status, lib, g);
      bindActions(status, lib, g);
    } else if (status === 'downloading' && lib) {
      const pct = actions.querySelector('#dl-pct');
      if (pct) pct.textContent = Math.round(lib.progress * 100) + '%';
    }
  }

  // 心意区块：余额 + 本作累计，纯本地模拟，任何时候都能送（不要求先获取）
  function renderGiftBox(state) {
    const box = view.querySelector('#gift-box');
    if (!box) return;
    const balance = (state.wallet && state.wallet.balance) || 0;
    const sent = (state.gifts || []).filter(x => x.gameId === g.id).reduce((n, x) => n + x.amount, 0);
    box.innerHTML = `
      <div class="giftbox__head">
        <span class="giftbox__title">💝 心意</span>
        <span class="giftbox__bal">余额 ${balance} 点</span>
      </div>
      <div class="giftbox__sent">本作已收到 ${sent} 点 · 仅存本机，不涉及真实支付</div>
      <button class="btn btn--ghost btn--sm giftbox__btn" id="gift-btn">送一份心意</button>`;
    box.querySelector('#gift-btn')?.addEventListener('click', () => openGiftDialog(g));
  }

  function buildActions(status, lib, g) {
    if (status === 'installed') {
      return `
        <button class="btn btn--primary btn--lg storedetail__buy" id="launch-btn">&#9654; 开始游戏</button>
        <span class="storedetail__owned">已在库中 · 已安装</span>`;
    }
    if (status === 'downloading') {
      return `
        <button class="btn btn--ghost btn--lg storedetail__buy" id="goto-dl-btn">正在下载 <span id="dl-pct">${Math.round((lib ? lib.progress : 0) * 100)}%</span></button>
        <span class="storedetail__owned">点击查看下载进度</span>`;
    }
    if (status === 'owned') {
      return `
        <button class="btn btn--primary btn--lg storedetail__buy" id="acquire-btn">&#11015; 安装</button>
        <span class="storedetail__owned">已在库中 · 未安装</span>`;
    }
    return `
      <button class="btn btn--primary btn--lg storedetail__buy" id="acquire-btn">免费获取</button>
      <span class="storedetail__owned">获取后进入下载队列</span>`;
  }

  function bindActions(status) {
    const actions = view.querySelector('#detail-actions');
    if (status === 'installed') {
      actions.querySelector('#launch-btn')?.addEventListener('click', () => {
        // 伪启动（§3.5）：3～4 秒原创伪启动画面；首次结束进揭示页，后续返回该游戏的库详情页
        startLaunchFlow(GAME_MAP[id], (game) => {
          const dest = launchDestination(getState(), game.id);
          if (dest === '#/library') setSelectedGame(game.id); // 库详情页必须是刚启动的游戏
          location.hash = dest;
        });
      });
    } else if (status === 'downloading') {
      actions.querySelector('#goto-dl-btn')?.addEventListener('click', () => { location.hash = '#/downloads'; });
    } else {
      actions.querySelector('#acquire-btn')?.addEventListener('click', () => {
        // 安装确认弹窗（§5.3）：确认后任务进入下载队列
        openInstallDialog(GAME_MAP[id], () => {
          startDownload(id);
          location.hash = '#/downloads';
        });
      });
    }
  }

  update();
  return { onLeave: unsubscribe };
}
