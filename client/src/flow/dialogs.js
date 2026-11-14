// 通用弹窗：安装确认（§5.3）与本地个人卡（§8.1）
'use strict';
import { getState, APP_VERSION, sendGift, refillWallet, GIFT_TIERS, WALLET_START, setAdultGate } from '../state/store.js';
import { fmtSize, fmtLaunchDate } from '../utils.js';
import { BADGES } from '../data/badges.js';

// 模拟可用空间（固定值 256 GB，恒大于全部虚构游戏体积，§5.3）
const FREE_SPACE_MB = 262144;
// 虚拟安装位置：固定示例路径，不允许选择或访问真实目录
const installPath = (g) => `C:\\Games\\不玩游戏\\common\\${g.id}\\`;

function setOpen(id, open) {
  const el = document.getElementById(id);
  if (el) el.hidden = !open;
}

/* ================= 安装确认弹窗（§5.3） ================= */

let pendingConfirm = null;

export function openInstallDialog(game, onConfirm) {
  const body = document.getElementById('install-body');
  if (!body || !game) return;
  body.innerHTML = `
    <div class="dialog__game">
      <span class="dialog__game-ico" style="background:linear-gradient(135deg, ${game.gradient.join(',')})">${game.emoji}</span>
      <div>
        <div class="dialog__game-name">${game.name}</div>
        <div class="dialog__game-size">体积：${fmtSize(game.sizeMB)}</div>
      </div>
    </div>
    <div class="dialog__rows">
      <div class="dialog__row"><span>安装位置</span><b>${installPath(game)}</b></div>
      <div class="dialog__row"><span>可用空间</span><b>${fmtSize(FREE_SPACE_MB)}（模拟数据）</b></div>
    </div>`;
  pendingConfirm = typeof onConfirm === 'function' ? onConfirm : null;
  setOpen('install-dialog', true);
}

export function closeInstallDialog() {
  pendingConfirm = null;
  setOpen('install-dialog', false);
}

export function initInstallDialog() {
  const root = document.getElementById('install-dialog');
  if (!root) return;
  document.getElementById('install-cancel')?.addEventListener('click', closeInstallDialog);
  document.getElementById('install-confirm')?.addEventListener('click', () => {
    const cb = pendingConfirm;
    closeInstallDialog();
    if (cb) cb();
  });
  // 点击遮罩取消（不误触确认）
  root.addEventListener('click', (e) => { if (e.target === root) closeInstallDialog(); });
}

/* ================= 本地个人卡（§8.1） ================= */

function fmtWait(ms) {
  const total = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
}

export function openProfileCard() {
  const body = document.getElementById('profile-body');
  if (!body) return;
  const s = getState();
  const ownedCount = Object.keys(s.library).length;
  const badges = (s.profile.badges || [])
    .map(b => BADGES[b.badgeId]).filter(Boolean);
  body.innerHTML = `
    <div class="profilecard__avatar">客</div>
    <div class="profilecard__rows">
      <div class="dialog__row"><span>名称</span><b>本地访客</b></div>
      <div class="dialog__row"><span>拥有游戏</span><b>${ownedCount} 款</b></div>
      <div class="dialog__row"><span>完成下载</span><b>${s.profile.stats.completedDownloads} 次</b></div>
      <div class="dialog__row"><span>累计伪启动</span><b>${s.profile.stats.launchTotal} 次</b></div>
      <div class="dialog__row"><span>累计模拟等待</span><b>${fmtWait(s.profile.stats.simulatedWaitMs)}</b></div>
      <div class="dialog__row"><span>拥有者类型</span><b>${s.profile.ownerType || '尚未生成'}</b></div>
    </div>
    <div class="profilecard__badges">
      <div class="profilecard__badges-title">已解锁徽章</div>
      ${badges.length === 0
        ? '<div class="profilecard__badge profilecard__badge--empty">暂无徽章 · 完成第一款游戏的下载与安装后解锁</div>'
        : badges.map(b => `
          <div class="profilecard__badge">
            <span class="profilecard__badge-ico">&#127942;</span>
            <span><b>${b.name}</b><br><small>${b.desc}</small></span>
          </div>`).join('')}
    </div>`;
  setOpen('profile-card', true);
}

export function initProfileCard() {
  const root = document.getElementById('profile-card');
  if (!root) return;
  document.getElementById('profile-close')?.addEventListener('click', () => setOpen('profile-card', false));
  root.addEventListener('click', (e) => { if (e.target === root) setOpen('profile-card', false); });
}

/* ================= 关于弹窗（§4.2 帮助菜单） ================= */

export function openAboutDialog() {
  const body = document.getElementById('about-body');
  if (!body) return;
  const nw = window.nwApp || {};
  body.innerHTML = `
    <div class="about__brand">
      <span class="about__logo">不</span>
      <div>
        <div class="about__name">不玩游戏</div>
        <div class="about__ver">客户端 v${nw.version || APP_VERSION}</div>
      </div>
    </div>
    <p class="about__p">「不玩游戏」是一个完全离线的虚拟游戏客户端体验。它不会连接游戏服务器、下载真实文件或启动外部程序；所有游戏、评分与获取人数均为本地虚构常量。</p>
    <p class="about__p">界面中的全部图像素材均为本作品原创生成，不包含任何第三方平台的商标、标识或受版权保护的素材。</p>`;
  setOpen('about-dialog', true);
}

export function initAboutDialog() {
  const root = document.getElementById('about-dialog');
  if (!root) return;
  document.getElementById('about-close')?.addEventListener('click', () => setOpen('about-dialog', false));
  root.addEventListener('click', (e) => { if (e.target === root) setOpen('about-dialog', false); });
}

/* ================= 送心意弹窗（批次 6） ================= */

let pendingGiftGame = null;
let pendingTier = GIFT_TIERS[0];

function paintGiftBody() {
  const body = document.getElementById('gift-body');
  const confirm = document.getElementById('gift-confirm');
  if (!body || !pendingGiftGame) return;
  const { balance } = getState().wallet;
  const g = pendingGiftGame;
  body.innerHTML = `
    <div class="dialog__game">
      <span class="dialog__game-ico" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">${g.emoji}</span>
      <div>
        <div class="dialog__game-name">${g.name}</div>
        <div class="dialog__game-size">送给 ${g.developer}</div>
      </div>
    </div>
    <div class="gift__balance">当前心意 <b>${balance}</b> 点<span class="gift__hint">仅存本机</span></div>
    <div class="gift__tiers">
      ${GIFT_TIERS.map(v => `
        <button class="gift__tier ${v === pendingTier ? 'is-active' : ''}" data-tier="${v}" ${balance < v ? 'disabled' : ''}>
          <b>${v}</b><small>心意</small>
        </button>`).join('')}
    </div>
    ${balance < WALLET_START ? `<button class="btn btn--sm gift__refill" id="gift-refill">补充到 ${WALLET_START} 点</button>` : ''}`;
  body.querySelectorAll('[data-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingTier = Number(btn.dataset.tier);
      body.querySelectorAll('[data-tier]').forEach(b => b.classList.toggle('is-active', Number(b.dataset.tier) === pendingTier));
      if (confirm) { confirm.textContent = `送出 ${pendingTier} 心意`; confirm.disabled = balance < pendingTier; }
    });
  });
  body.querySelector('#gift-refill')?.addEventListener('click', () => {
    refillWallet();
    paintGiftBody();
  });
  if (confirm) { confirm.textContent = `送出 ${pendingTier} 心意`; confirm.disabled = balance < pendingTier; }
}

export function openGiftDialog(game) {
  if (!game || !document.getElementById('gift-body')) return;
  pendingGiftGame = game;
  pendingTier = GIFT_TIERS[0];
  paintGiftBody();
  setOpen('gift-dialog', true);
}

export function closeGiftDialog() {
  pendingGiftGame = null;
  setOpen('gift-dialog', false);
}

export function initGiftDialog() {
  const root = document.getElementById('gift-dialog');
  if (!root) return;
  document.getElementById('gift-cancel')?.addEventListener('click', closeGiftDialog);
  document.getElementById('gift-confirm')?.addEventListener('click', () => {
    if (!pendingGiftGame) return;
    const game = pendingGiftGame;
    const res = sendGift(game.id, pendingTier);
    if (!res.ok) { paintGiftBody(); return; }
    closeGiftDialog();
    if (typeof onGiftSent === 'function') onGiftSent(game, pendingTier);
  });
  root.addEventListener('click', (e) => { if (e.target === root) closeGiftDialog(); });
}

// 由调用方（页面）注入的成功回调，避免 dialogs 反向依赖 shell 的 Toast
let onGiftSent = null;
export function setGiftSentHandler(fn) { onGiftSent = typeof fn === 'function' ? fn : null; }

/* ================= 徽章详情弹窗（批次 6） ================= */

export function openBadgeDialog(badgeId, record) {
  const b = BADGES[badgeId];
  const body = document.getElementById('badge-body');
  if (!b || !body) return;
  const unlocked = !!record;
  body.innerHTML = `
    <div class="badge-hero ${unlocked ? 'is-on' : 'is-off'}">
      <span class="badge-hero__ico">${unlocked ? b.icon : '🔒'}</span>
      <div>
        <div class="badge-hero__name">${b.name}</div>
        <div class="badge-hero__state">${unlocked ? '已解锁 · ' + (fmtLaunchDate(record.unlockedAt) || '') : '尚未解锁'}</div>
      </div>
    </div>
    <p class="badge-hero__desc">${b.desc}</p>
    <div class="dialog__rows">
      <div class="dialog__row"><span>解锁条件</span><b>${b.cond}</b></div>
      <div class="dialog__row"><span>状态</span><b>${unlocked ? '已获得' : '待完成'}</b></div>
    </div>`;
  setOpen('badge-dialog', true);
}

export function initBadgeDialog() {
  const root = document.getElementById('badge-dialog');
  if (!root) return;
  document.getElementById('badge-close')?.addEventListener('click', () => setOpen('badge-dialog', false));
  root.addEventListener('click', (e) => { if (e.target === root) setOpen('badge-dialog', false); });
}

/* ================= 年龄确认弹窗（批次 6：分级演示） ================= */

let gateGame = null;
let gateOnPass = null;
let gateOnDecline = null;

function gateName() {
  return gateGame ? `《${gateGame.name}》` : '这款作品';
}

function paintGateAsk() {
  const title = document.getElementById('adult-gate-title');
  const body = document.getElementById('adult-gate-body');
  const actions = document.getElementById('adult-gate-actions');
  if (!body || !actions) return;
  if (title) title.textContent = '年龄确认';
  body.innerHTML = `
    <p>${gateName()}是一部 <b>18+ 虚构作品</b>：成人向恋爱悬疑题材，含成人情感关系描写。</p>
    <p>本客户端不提供任何露骨内容，此页仅用于演示分级与年龄门。</p>
    <p>请确认你已年满 18 岁。</p>`;
  actions.innerHTML = `
    <button class="btn btn--primary" id="gate-no">我还未满 18 岁</button>
    <button class="btn" id="gate-yes">我已满 18 岁</button>`;
  // 安全默认：焦点落在「未满 18」，避免误按回车直接放行
  actions.querySelector('#gate-no').addEventListener('click', () => {
    setAdultGate('declined');
    paintGateDeclined();
  });
  actions.querySelector('#gate-yes').addEventListener('click', () => {
    setAdultGate('passed');
    const cb = gateOnPass;
    closeAdultGate();
    if (cb) cb();
  });
}

function paintGateDeclined() {
  const title = document.getElementById('adult-gate-title');
  const body = document.getElementById('adult-gate-body');
  const actions = document.getElementById('adult-gate-actions');
  if (!body || !actions) return;
  if (title) title.textContent = '已按未满 18 岁处理';
  body.innerHTML = `
    <p>${gateName()}的封面、截图与获取入口将不再显示，也不会进入你的下载队列。</p>
    <p>这不是永久记录：你可以在「设置 → 体验 → 成人内容」里重新确认。</p>
    <p>其余作品不受影响。</p>`;
  actions.innerHTML = '<button class="btn btn--primary" id="gate-ok">知道了</button>';
  actions.querySelector('#gate-ok').addEventListener('click', () => {
    const cb = gateOnDecline;
    closeAdultGate();
    if (cb) cb();
  });
  actions.querySelector('#gate-ok').focus();
}

export function openAdultGateDialog(game, onPass, onDecline) {
  if (!document.getElementById('adult-gate-body')) return;
  gateGame = game || null;
  gateOnPass = typeof onPass === 'function' ? onPass : null;
  gateOnDecline = typeof onDecline === 'function' ? onDecline : null;
  paintGateAsk();
  setOpen('adult-gate', true);
  // 必须在 hidden 移除之后再聚焦：隐藏元素无法获得焦点
  document.getElementById('gate-no')?.focus();
}

export function closeAdultGate() {
  gateGame = null;
  gateOnPass = null;
  gateOnDecline = null;
  setOpen('adult-gate', false);
}

export function initAdultGateDialog() {
  const root = document.getElementById('adult-gate');
  if (!root) return;
  // 遮罩 / Esc 关闭 = 未表态：不写任何状态，下次照常询问
  root.addEventListener('click', (e) => { if (e.target === root) closeAdultGate(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root && !root.hidden) closeAdultGate();
  });
}
