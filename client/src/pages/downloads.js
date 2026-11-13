// 下载页 —— Steam 下载页风格（C2 高保真，对照截图 3）：
//   hero 双栏：左游戏艺术块（渐变+emoji+名+阶段） + 右统计区（网络/峰值/磁盘 + 正在下载数据 MB/正在安装文件 %/估计剩余时间 + 方形暂停按钮）
//   即将进行（排队行 + 「下一个 ▾」提升 + 取消）+ 已完成/已取消
// 数据逻辑：store.downloads / cancelDownload / pauseDownload / resumeDownload / promoteDownload（D4/D5）
'use strict';
import { GAME_MAP } from '../data/games.js';
import { getState, subscribe } from '../state/store.js';
import { cancelDownload, pauseDownload, resumeDownload, promoteDownload, moveDownload, clearFinishedDownloads, pickActiveTask, INSTALL_STEPS, PREPARING_LINES, getScale } from '../state/download-engine.js';
import { fmtSize, fmtSpeed } from '../utils.js';

const ACTIVE = ['PREPARING', 'DOWNLOADING', 'VERIFYING', 'INSTALLING', 'SHORTCUT'];

export function renderDownloads(view) {
  // 注意：初始哨兵用 null 而非 ''——空队列的 struct 恰好是 ''，
  // 若初始为 '' 会导致首次渲染被跳过（视图停留在上一页）
  let lastStruct = null;
  let peak = 0; // 本次页面会话内的峰值速度（仅展示用，不持久化）
  const unsubscribe = subscribe(update);

  function update() {
    const state = getState();
    // struct 必须含 paused/stage/progress/id：暂停切换、进度推进、阶段变化都需触发重渲染
    const struct = state.downloads.map(d => d.id + ':' + d.stage + ':' + (d.paused ? 'p' : 'r') + ':' + Math.round((d.progress || 0) * 100)).join('|');
    if (struct !== lastStruct) {
      lastStruct = struct;
      render(state);
    } else {
      updateLive(state);
    }
  }

  function activeTask(state) {
    // 统一活动任务优选（规格④）：优先 ACTIVE&&!paused，否则第一个 paused，否则 null
    return pickActiveTask(state);
  }

  // 主进度分数（0~1）：正在下载数据行使用；暂停任务按 resumeStage 折算
  function mainFrac(task) {
    if (task.paused) {
      const from = task.resumeStage;
      if (from === 'INSTALLING' || from === 'SHORTCUT') return 1;
      if (from === 'VERIFYING' || from === 'DOWNLOADING') return task.progress;
      return 0;
    }
    switch (task.stage) {
      case 'PREPARING': return 0;
      case 'DOWNLOADING': return task.progress;
      case 'VERIFYING': return task.progress;
      case 'INSTALLING':
      case 'SHORTCUT': return 1;
      default: return 0;
    }
  }

  // 安装子进度分数（0~1）：正在安装文件行使用；非安装阶段为 0
  function installFrac(task) {
    if (task.stage === 'INSTALLING' && !task.paused) return task.progress;
    if (task.paused && task.resumeStage === 'INSTALLING') return task.progress;
    return 0;
  }

  function stageLine(task) {
    if (task.paused) return '已暂停';
    switch (task.stage) {
      case 'QUEUED': return '排队中';
      case 'PREPARING': {
        const idx = Math.min(PREPARING_LINES.length - 1, Math.floor((task.elapsedMs || 0) / 1000));
        return PREPARING_LINES[idx] || PREPARING_LINES[0];
      }
      case 'DOWNLOADING': return '正在下载数据…';
      case 'VERIFYING': return '校验文件完整性 (SHA-256)…';
      case 'INSTALLING': return '正在安装文件…';
      case 'SHORTCUT': return '创建快捷方式…';
      default: return task.stage;
    }
  }

  // 截图口径：估计剩余时间: 04 分 00 秒
  function etaText(sec) {
    if (!Number.isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ' 分 ' + String(s).padStart(2, '0') + ' 秒';
  }

  function render(state) {
    const active = activeTask(state);
    const queued = state.downloads.filter(d => d.stage === 'QUEUED' && !d.paused);
    const finished = state.downloads.filter(d => d.stage === 'COMPLETED' || d.stage === 'CANCELLED');
    const scaleNote = getScale() !== 1 ? ` · 加速 ×${getScale()}` : '';

    view.innerHTML = `
      <div class="dlpage">
        <div class="dlpage__hero" id="dl-hero" ${active ? '' : 'hidden'}>
          <div class="dlpage__hero-art" id="hero-art"></div>
          <div class="dlpage__hero-main">
            <div class="dlpage__statrow">
              <div class="dlpage__stat"><span class="dlpage__stat-icon dlpage__stat-icon--net"></span><div class="dlpage__stat-body"><span class="dlpage__stat-label">网络</span><b id="dl-net">0 B/s</b></div></div>
              <div class="dlpage__stat"><span class="dlpage__stat-icon dlpage__stat-icon--peak"></span><div class="dlpage__stat-body"><span class="dlpage__stat-label">峰值</span><b id="dl-peak">0 B/s</b></div></div>
              <div class="dlpage__stat"><span class="dlpage__stat-icon dlpage__stat-icon--disk"></span><div class="dlpage__stat-body"><span class="dlpage__stat-label">磁盘使用量</span><b id="dl-disk">0 B/s</b></div></div>
              <span class="dlpage__note">本地模拟队列 · 无真实网络${scaleNote}</span>
              <button class="dlpage__gear" id="dl-gear" title="下载设置（演示占位）">&#x2699;</button>
            </div>
            <div class="dlpage__dlrow">
              <div class="dlpage__rowline">
                <span class="dlpage__rowlabel">正在下载数据</span>
                <span class="dlpage__rowvalue" id="dl-mb">0 MB / 0 MB</span>
                <span class="dlpage__dl-ico">&#x2B07;</span>
              </div>
              <div class="progress-track"><div class="progress-bar" id="dl-mb-bar" style="width:0%"></div></div>
              <div class="dlpage__stage" id="dl-stage"></div>
            </div>
            <div class="dlpage__installrow">
              <div class="dlpage__rowline">
                <span class="dlpage__rowlabel">正在安装文件</span>
                <span class="dlpage__rowvalue" id="dl-install-pct">0%</span>
              </div>
              <div class="progress-track progress-track--sub"><div class="progress-bar progress-bar--install" id="dl-install-bar" style="width:0%"></div></div>
            </div>
            <div class="dlpage__etarow">
              <span class="dlpage__eta">估计剩余时间: <b id="dl-eta">00 分 00 秒</b></span>
              <span class="dlpage__actions">
                <button class="btn btn--ghost btn--sm" id="dl-cancel">取消</button>
                <button class="dlpage__pausebtn" id="dl-pause" title="暂停/恢复">&#x23F8;</button>
              </span>
            </div>
          </div>
        </div>

        <div class="dlpage__section">
          <div class="dlpage__section-head">
            <span class="dlpage__section-title">即将进行 <i class="dlpage__count" id="dl-count">(${queued.length})</i></span>
            <span class="dlpage__section-note">已启用自动获取</span>
          </div>
          <div class="dl-list" id="queue-list"></div>
          <div class="dlpage__empty" id="dl-empty" ${queued.length ? 'hidden' : ''}>
            <p>队列中无下载</p>
            <button class="btn btn--ghost btn--sm" id="go-store">去商店看看</button>
          </div>
        </div>

        <div class="dlpage__section" id="finished-section" ${finished.length ? '' : 'hidden'}>
          <div class="dlpage__section-head">
            <span class="dlpage__section-title">已完成 / 已取消</span>
            <button class="btn btn--ghost btn--sm" id="dl-clear-finished" title="清除已完成/已取消记录">清除记录</button>
          </div>
          <div class="dl-list" id="finished-list"></div>
        </div>
      </div>`;

    view.querySelector('#go-store')?.addEventListener('click', () => { location.hash = '#/store'; });
    view.querySelector('#dl-gear')?.addEventListener('click', () => { location.hash = '#/settings'; });

    if (active) {
      fillHero(active);
      view.querySelector('#dl-cancel')?.addEventListener('click', () => cancelDownload(active.id));
      view.querySelector('#dl-pause')?.addEventListener('click', () => {
        if (active.paused) { resumeDownload(active.id); }
        else { pauseDownload(active.id); }
      });
    }
    renderQueue(view, queued);
    renderFinished(view, finished);
    view.querySelector('#dl-clear-finished')?.addEventListener('click', () => clearFinishedDownloads());
    updateLive(state);
  }

  function fillHero(task) {
    const g = GAME_MAP[task.gameId];
    const art = view.querySelector('#hero-art');
    if (!art) return;
    if (!g) { art.innerHTML = ''; return; }
    art.style.background = `linear-gradient(135deg, ${g.gradient.join(',')})`;
    art.innerHTML = `
      <span class="dlpage__hero-emoji">${g.emoji}</span>
      <div class="dlpage__hero-name">${g.name}</div>
      <div class="dlpage__hero-stage" id="dl-hero-stage">${stageLine(task)}</div>`;
    // 暂停/恢复按钮形态
    const btn = view.querySelector('#dl-pause');
    if (btn) {
      btn.innerHTML = task.paused ? '&#9654;' : '&#10074;&#10074;';
      btn.title = task.paused ? '恢复下载' : '暂停下载';
    }
  }

  function renderQueue(view, queued) {
    const list = view.querySelector('#queue-list');
    if (!list) return;
    list.innerHTML = '';
    queued.forEach((t, idx) => {
      const g = GAME_MAP[t.gameId];
      if (!g) return;
      const isFirst = idx === 0;
      const isLast = idx === queued.length - 1;
      const row = document.createElement('div');
      row.className = 'dlpage__row';
      row.dataset.taskId = t.id;
      row.innerHTML = `
        <span class="dlpage__thumb dlpage__thumb--sm" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">${g.emoji}</span>
        <div class="dlpage__row-body"><div class="dlpage__row-name">${g.name}</div><div class="dlpage__row-meta">${fmtSize(g.sizeMB)} · 排队中</div></div>
        <button class="btn btn--ghost btn--sm" data-up="${t.id}" ${isFirst ? 'disabled' : ''} title="上移">&#x25B2;</button>
        <button class="btn btn--ghost btn--sm" data-down="${t.id}" ${isLast ? 'disabled' : ''} title="下移">&#x25BC;</button>
        <button class="btn btn--primary btn--sm" data-next="${t.id}">下一个 &#x25BE;</button>
        <button class="btn btn--ghost btn--sm" data-cancel="${t.id}">取消</button>`;
      row.querySelector(`[data-up="${t.id}"]`)?.addEventListener('click', () => moveDownload(t.id, 'up'));
      row.querySelector(`[data-down="${t.id}"]`)?.addEventListener('click', () => moveDownload(t.id, 'down'));
      row.querySelector(`[data-next="${t.id}"]`)?.addEventListener('click', () => {
        promoteDownload(t.id);
      });
      row.querySelector(`[data-cancel="${t.id}"]`)?.addEventListener('click', () => cancelDownload(t.id));
      list.appendChild(row);
    });
  }

  function renderFinished(view, finished) {
    const list = view.querySelector('#finished-list');
    if (!list) return;
    list.innerHTML = '';
    finished.forEach(t => {
      const g = GAME_MAP[t.gameId];
      const row = document.createElement('div');
      row.className = 'dlpage__row dlpage__row--done';
      row.innerHTML = `
        <span class="dlpage__thumb dlpage__thumb--sm" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">${g.emoji}</span>
        <div class="dlpage__row-body"><div class="dlpage__row-name">${g.name}</div><div class="dlpage__row-meta">${t.stage === 'COMPLETED' ? '安装完成' : '已取消'}</div></div>
        <button class="btn btn--ghost btn--sm" data-goto="${g.id}">查看</button>`;
      row.querySelector(`[data-goto="${g.id}"]`)?.addEventListener('click', () => { location.hash = '#/detail/' + g.id; });
      list.appendChild(row);
    });
  }

  // 每 tick：只更新数值与进度（不重建结构）
  function updateLive(state) {
    const active = activeTask(state);
    const netText = active && !active.paused ? (fmtSpeed(active.speedMBps) || '0 B/s') : '0 B/s';
    if (active && !active.paused && active.speedMBps > peak) peak = active.speedMBps;

    const net = view.querySelector('#dl-net');
    const peakEl = view.querySelector('#dl-peak');
    const disk = view.querySelector('#dl-disk');
    if (net) net.textContent = netText;
    if (peakEl) peakEl.textContent = peak > 0 ? fmtSpeed(peak) : '0 B/s';
    if (disk) disk.textContent = netText;

    if (!active) return;
    const g = GAME_MAP[active.gameId];
    if (!g) return;

    const frac = mainFrac(active);
    const mbEl = view.querySelector('#dl-mb');
    const mbBar = view.querySelector('#dl-mb-bar');
    if (mbEl) mbEl.textContent = `${fmtSize(frac * g.sizeMB)} / ${fmtSize(g.sizeMB)}`;
    if (mbBar) mbBar.style.width = (frac * 100) + '%';

    const stageEl = view.querySelector('#dl-stage');
    const heroStage = view.querySelector('#dl-hero-stage');
    const stageText = stageLine(active);
    if (stageEl) stageEl.textContent = stageText;
    if (heroStage) heroStage.textContent = stageText;

    const installPctEl = view.querySelector('#dl-install-pct');
    const installBar = view.querySelector('#dl-install-bar');
    const iFrac = installFrac(active);
    if (installPctEl) installPctEl.textContent = Math.round(iFrac * 100) + '%';
    if (installBar) installBar.style.width = (iFrac * 100) + '%';

    // 安装子步骤文案（安装阶段在阶段行内追加）
    if (stageEl && active.stage === 'INSTALLING') {
      const stepIdx = Math.min(INSTALL_STEPS.length - 1, Math.floor(active.progress * INSTALL_STEPS.length));
      stageEl.textContent = INSTALL_STEPS[stepIdx] || stageText;
    }

    const etaEl = view.querySelector('#dl-eta');
    if (etaEl) etaEl.textContent = active.paused ? '— —' : etaText(active.etaSec);
  }

  update();
  return { onLeave: unsubscribe };
}
