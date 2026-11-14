// 设置页 —— Steam 设置页风格：
//   左侧分类列表（系统选中，其余为演示占位）+ 右侧内容面板
//   数据区（规格②）：减少动态效果 / 界面声音 / 下载完成通知 / 默认启动页面 —— 真实控件 + 真实接线
//   数据：导出本地数据（exportLocalData）+ 清除本地数据（§8.4 模态确认弹窗 → resetAllData + reload）
'use strict';
import { showToast } from '../shell.js';
import { resetAllData, exportLocalData, getState, subscribe, updateSettings, setShowAdult, STORAGE_KEY, APP_VERSION } from '../state/store.js';
import { openAdultGateDialog } from '../flow/dialogs.js';

export function renderSettings(view) {
  const nw = window.nwApp || {};

  view.innerHTML = `
    <div class="setpage">
      <div class="setpage__cats">
        <div class="setpage__cat setpage__cat--active" data-cat="system">&#9881; 系统</div>
        <div class="setpage__cat setpage__cat--disabled" data-offline aria-disabled="true" title="本版本未启用">界面</div>
        <div class="setpage__cat setpage__cat--disabled" data-offline aria-disabled="true" title="本版本未启用">下载</div>
      </div>
      <div class="setpage__panel">
        <div class="setpage__title">系统</div>
        <div class="setpage__rows">
          <div class="setpage__row"><span class="setpage__row-label">应用版本</span><span class="setpage__row-value" id="set-version">—</span></div>
          <div class="setpage__row"><span class="setpage__row-label">Electron</span><span class="setpage__row-value" id="set-electron">—</span></div>
          <div class="setpage__row"><span class="setpage__row-label">Node.js</span><span class="setpage__row-value" id="set-node">—</span></div>
          <div class="setpage__row"><span class="setpage__row-label">运行平台</span><span class="setpage__row-value" id="set-platform">—</span></div>
          <div class="setpage__row"><span class="setpage__row-label">运行模式</span><span class="setpage__row-value" id="set-mode">—</span></div>
          <div class="setpage__row"><span class="setpage__row-label">数据来源</span><span class="setpage__row-value">本地 mock · 无后端</span></div>
        </div>
        <div class="setpage__subtitle">体验</div>
        <div class="setpage__rows">
          <div class="setpage__row">
            <span class="setpage__row-label">减少动态效果</span>
            <label class="set-toggle"><input type="checkbox" id="set-reduced" /><span class="set-toggle__track"></span></label>
          </div>
          <div class="setpage__row">
            <span class="setpage__row-label">界面声音（下载完成提示音）</span>
            <label class="set-toggle"><input type="checkbox" id="set-sound" /><span class="set-toggle__track"></span></label>
          </div>
          <div class="setpage__row">
            <span class="setpage__row-label">下载完成通知</span>
            <label class="set-toggle"><input type="checkbox" id="set-notify" /><span class="set-toggle__track"></span></label>
          </div>
          <div class="setpage__row">
            <span class="setpage__row-label">默认启动页面</span>
            <select class="set-select" id="set-route">
              <option value="#/store">商店</option>
              <option value="#/library">游戏库</option>
            </select>
          </div>
          <div class="setpage__row setpage__row--adult">
            <span class="setpage__row-label">成人内容（18+）</span>
            <span class="setpage__row-value" id="set-adult-state">—</span>
            <button class="btn btn--ghost btn--sm" id="set-adult-verify">验证</button>
          </div>
          <div class="setpage__row setpage__row--note">
            <span class="setpage__row-label">仅本机记录，不采集生日，不上传任何信息。未满 18 岁将隐藏成人条目。</span>
          </div>
        </div>
        <div class="setpage__subtitle">数据</div>
        <div class="setpage__rows">
          <div class="setpage__row">
            <span class="setpage__row-label">导出本地数据（JSON 文件）</span>
            <button class="btn btn--ghost btn--sm" id="export-data">导出本地数据</button>
          </div>
          <div class="setpage__row">
            <span class="setpage__row-label">本地存储（${STORAGE_KEY}）· <i data-lib-count style="font-style:normal">—</i></span>
            <button class="btn btn--ghost btn--sm" id="reset-data">清除本地数据</button>
          </div>
        </div>
        <p class="setpage__foot">
          本客户端不接入账号、支付、真实下载或外部游戏文件。所有游戏数据均为虚构。
        </p>
      </div>
    </div>`;

  // 运行信息（与旧版字段一致）
  const set = (id, val) => { const el = view.querySelector(id); if (el) el.textContent = val; };
  set('#set-version', nw.version || APP_VERSION);
  set('#set-electron', nw.electron || '—');
  set('#set-node', nw.node || '—');
  set('#set-platform', nw.platform || '—');
  set('#set-mode', nw.isDev ? '开发 (dev)' : '生产 (production)');

  // 未启用分类（批次 5 P2-2）：明确禁用态，无「敬请期待」占位
  view.querySelectorAll('[data-offline]').forEach(el => {
    el.addEventListener('click', () => showToast('本版本未启用'));
  });

  // 设置控件：真实读写（store 为唯一真源，main.js 订阅后落实真实效果）
  const s0 = getState().settings;
  const reducedEl = view.querySelector('#set-reduced');
  const soundEl = view.querySelector('#set-sound');
  const notifyEl = view.querySelector('#set-notify');
  const routeEl = view.querySelector('#set-route');
  if (reducedEl) reducedEl.checked = !!s0.reducedMotion;
  if (soundEl) soundEl.checked = !!s0.soundEnabled;
  if (notifyEl) notifyEl.checked = !!s0.notificationsEnabled;
  if (routeEl) routeEl.value = (s0.defaultRoute === '#/library') ? '#/library' : '#/store';

  reducedEl?.addEventListener('change', () => {
    updateSettings({ reducedMotion: reducedEl.checked });
  });
  soundEl?.addEventListener('change', () => {
    updateSettings({ soundEnabled: soundEl.checked });
    showToast(soundEl.checked ? '已开启界面声音' : '已关闭界面声音');
  });
  notifyEl?.addEventListener('change', () => {
    updateSettings({ notificationsEnabled: notifyEl.checked });
    showToast(notifyEl.checked ? '已开启下载完成通知' : '已关闭下载完成通知');
  });
  routeEl?.addEventListener('change', () => {
    updateSettings({ defaultRoute: routeEl.value });
    showToast('默认启动页面已更新');
  });

  /* ---- 成人内容行（批次 6）：三态显示 + 重新确认 ---- */
  const adultState = view.querySelector('#set-adult-state');
  const adultBtn = view.querySelector('#set-adult-verify');
  const ADULT_TEXT = { unset: '未确认', passed: '已通过', declined: '已限制（未满 18）' };
  function paintAdult() {
    const s = getState().settings;
    if (adultState) adultState.textContent = ADULT_TEXT[s.adultGate] || '未确认';
    if (adultBtn) adultBtn.textContent = s.adultGate === 'passed' ? '重新确认' : '验证';
  }
  paintAdult();
  adultBtn?.addEventListener('click', () => {
    openAdultGateDialog(null,
      () => { paintAdult(); setShowAdult(true); showToast('已确认成年 · 成人条目恢复显示'); },
      () => { paintAdult(); showToast('已按未满 18 岁处理'); });
  });

  // 导出本地数据（§10.4）：仅用户主动点击触发
  view.querySelector('#export-data')?.addEventListener('click', () => {
    try {
      exportLocalData();
      showToast('已导出本地数据 JSON 文件');
    } catch (e) {
      showToast('导出失败：当前环境不支持文件下载');
    }
  });

  // 清除本地数据：§8.4 明确确认弹窗（覆盖遮罩 + 确认/取消 + Esc/点遮罩取消）
  view.querySelector('#reset-data')?.addEventListener('click', () => showResetModal());

  // 库数据行随重置/下载变化实时刷新
  function libCountText() {
    return `库内 ${Object.keys(getState().library).length} 款游戏`;
  }
  const unsubscribe = subscribe(() => {
    const label = view.querySelector('[data-lib-count]');
    if (label) label.textContent = libCountText();
    paintAdult();
  });
  const libLabel = view.querySelector('[data-lib-count]');
  if (libLabel) libLabel.textContent = libCountText();

  return { onLeave: unsubscribe };
}

/* ============ 清除数据确认弹窗（§8.4） ============ */
function showResetModal() {
  const overlay = document.createElement('div');
  overlay.className = 'set-modal';
  overlay.innerHTML = `
    <div class="set-modal__box" role="dialog" aria-modal="true">
      <div class="set-modal__title">清除本地数据</div>
      <div class="set-modal__body">此操作将删除所有本地游戏数据（库、下载记录、收藏、设置、问卷），且不可撤销。确定要继续吗？</div>
      <div class="set-modal__actions">
        <button class="btn btn--ghost btn--sm" id="reset-cancel">取消</button>
        <button class="btn btn--danger btn--sm" id="reset-confirm">确认清除</button>
      </div>
    </div>`;
  // 任何关闭路径（取消/确认/Esc/点遮罩）都必须移除 keydown 监听，避免累积
  function close() { document.removeEventListener('keydown', onKey); overlay.remove(); }
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  overlay.querySelector('#reset-cancel')?.addEventListener('click', () => { close(); });
  overlay.querySelector('#reset-confirm')?.addEventListener('click', () => {
    close();
    resetAllData();
    // 重置后 reload 自然重新显示欢迎弹窗（welcomeSeen 已归 false），并回到默认路由
    setTimeout(() => { try { location.reload(); } catch (e) { /* 忽略 */ } }, 60);
  });
  document.body.appendChild(overlay);
}
