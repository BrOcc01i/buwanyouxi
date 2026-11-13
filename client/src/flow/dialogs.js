// 通用弹窗：安装确认（§5.3）与本地个人卡（§8.1）
'use strict';
import { getState, APP_VERSION } from '../state/store.js';
import { fmtSize } from '../utils.js';
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
