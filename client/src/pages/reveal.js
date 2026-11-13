// 首次揭示 + 问卷 + 拥有者类型结果卡（规格 §3.6 / §3.7 / §3.8）
// 路由：#/reveal/:id —— 使用页面而非覆盖层（规格 §11 单独注册路由）
// 揭示页一经显示即 markRevealSeen（一次性）；问卷提交后固定显示结果卡
'use strict';
import { GAME_MAP } from '../data/games.js';
import { getState, subscribe, markRevealSeen, submitSurvey } from '../state/store.js';
import { setSelectedGame } from '../state/ui.js';
import { buildResultSummary, buildResultText } from '../flow/result-card.js';
import { showToast } from '../shell.js';

const REVEAL_LINES = [
  '你刚刚没有下载任何真正的游戏。',
  '但选择、等待，以及看到"安装完成"时产生的感觉，可能都是真的。',
  '也许我们期待的不只是开始游戏，而是看着一件想要的东西，慢慢变成已经拥有。',
  '这不是在测试你有没有被骗。我们只是想知道：这段过程是否也给了你一点满足感？',
];
const Q2_OPTIONS = [
  '选择并获取游戏',
  '看着下载进度推进',
  '安装完成',
  '点击开始游戏',
  '没什么感觉',
];

export function renderReveal(view, params) {
  const state0 = getState();
  // 目标游戏：路由参数 → 首次揭示游戏 → 任意已安装游戏 → 回商店（不显示空白页）
  let gameId = params && params[0];
  if (!GAME_MAP[gameId]) gameId = state0.profile.firstRevealGameId;
  if (!GAME_MAP[gameId]) {
    const anyInstalled = Object.keys(state0.library).find(id => state0.library[id].status === 'installed');
    gameId = anyInstalled || null;
  }
  if (!GAME_MAP[gameId]) { location.hash = '#/store'; return {}; }

  /* ---- 路由守卫（返修③）：非法流程不得提前消耗 revealSeen ---- */
  // 首次揭示合法条件：目标游戏已安装且已发生过伪启动（launchCount>0）且尚未揭示
  // 继续问卷合法条件：已揭示且目标为首次揭示游戏（含未提交问卷的继续入口与结果卡回看）
  const lib0 = state0.library[gameId];
  const legitFirstReveal = !!lib0 && lib0.status === 'installed'
    && (lib0.launchCount || 0) > 0 && !state0.profile.revealSeen;
  const continueFlow = !!state0.profile.revealSeen && state0.profile.firstRevealGameId === gameId;
  if (!legitFirstReveal && !continueFlow) {
    location.hash = Object.keys(state0.library).length > 0 ? '#/library' : '#/store';
    return {};
  }
  if (legitFirstReveal) {
    // §3.6：一经显示就记录 revealSeen（幂等），不得通过重复启动再次触发
    markRevealSeen(gameId);
  }

  // 问卷提交后切到结果卡；订阅驱动刷新（首次进入先渲染一次）
  let lastHasSurvey = !!getState().survey;
  const unsub = subscribe(() => {
    const has = !!getState().survey;
    if (has !== lastHasSurvey) { lastHasSurvey = has; render(); }
  });
  render();

  function render() {
    const s = getState();
    const g = GAME_MAP[gameId];
    const summary = buildResultSummary(s);
    view.innerHTML = `
      <div class="reveal">
        <div class="reveal__card">
          <div class="reveal__kicker">《${g.name}》· 体验揭示</div>
          ${REVEAL_LINES.map(t => `<p class="reveal__line">${t}</p>`).join('')}
        </div>
        ${summary ? resultCardHTML(summary) : surveyHTML()}
      </div>`;
    if (summary) bindResult(summary); else bindSurvey();
  }

  /* ---- 问卷表单（§3.7） ---- */
  function surveyHTML() {
    return `
      <div class="survey">
        <div class="survey__title">体验反馈</div>
        <div class="survey__q">
          <div class="survey__q-text">1. 刚才的获取与等待过程，给你带来了多少满足感？<i class="survey__req">必填</i></div>
          <div class="survey__scale" id="q1-scale">
            ${[1, 2, 3, 4, 5].map(n => `<button class="survey__score" data-v="${n}" aria-label="${n} 分">${n}</button>`).join('')}
          </div>
          <div class="survey__scale-hint"><span>毫无满足感</span><span>非常满足</span></div>
        </div>
        <div class="survey__q">
          <div class="survey__q-text">2. 整个过程里，哪个部分对你来说最重要？<i class="survey__req">必填</i></div>
          <div class="survey__options" id="q2-options">
            ${Q2_OPTIONS.map(o => `
              <label class="survey__opt"><input type="radio" name="q2" value="${o}" /><span>${o}</span></label>`).join('')}
          </div>
        </div>
        <div class="survey__q">
          <div class="survey__q-text">3. 哪个瞬间感觉最好，或者最想关闭？<i class="survey__req survey__req--opt">选填</i></div>
          <textarea class="survey__textarea" id="q3-input" rows="3" maxlength="200" placeholder="随便写点什么，只保存在你的电脑上"></textarea>
        </div>
        <div class="survey__err" id="survey-err" hidden></div>
        <div class="survey__actions">
          <button class="btn btn--primary btn--lg" id="survey-submit">提交反馈</button>
          <span class="survey__privacy">仅保存在本机，不会上传</span>
        </div>
      </div>`;
  }

  function bindSurvey() {
    let q1 = 0;
    const scale = view.querySelector('#q1-scale');
    scale?.addEventListener('click', (e) => {
      const btn = e.target.closest('.survey__score');
      if (!btn) return;
      q1 = Number(btn.dataset.v);
      scale.querySelectorAll('.survey__score').forEach(b => b.classList.toggle('survey__score--on', Number(b.dataset.v) <= q1));
    });
    view.querySelector('#survey-submit')?.addEventListener('click', () => {
      const q2Input = view.querySelector('input[name="q2"]:checked');
      const err = view.querySelector('#survey-err');
      const problems = [];
      if (!q1) problems.push('请先为第 1 题选择 1～5 分');
      if (!q2Input) problems.push('请先回答第 2 题');
      if (problems.length) {
        if (err) { err.textContent = problems.join('；'); err.hidden = false; }
        return;
      }
      const res = submitSurvey({
        q1,
        q2: q2Input.value,
        q3: (view.querySelector('#q3-input')?.value || ''),
      });
      if (!res.ok) {
        if (err) { err.textContent = res.reason || '提交失败'; err.hidden = false; }
        return;
      }
      render(); // 提交成功 → 刷新为结果卡
    });
  }

  /* ---- 结果卡（§3.8） ---- */
  function resultCardHTML(sm) {
    return `
      <div class="resultcard">
        <div class="resultcard__head">
          <div class="resultcard__label">你的拥有者类型</div>
          <div class="resultcard__type">${sm.ownerType}</div>
        </div>
        <div class="resultcard__grid">
          <div class="resultcard__item"><span>首次完成的游戏</span><b>《${sm.firstGameName}》</b></div>
          <div class="resultcard__item"><span>本次模拟等待</span><b>${sm.waitText}</b></div>
          <div class="resultcard__item"><span>当前拥有</span><b>${sm.ownedCount} 款游戏</b></div>
          <div class="resultcard__item"><span>累计伪启动</span><b>${sm.launchTotal} 次</b></div>
        </div>
        ${sm.badge ? `
          <div class="resultcard__badge">
            <span class="resultcard__badge-ico">&#127942;</span>
            <span><b>${sm.badge.name}</b> — ${sm.badge.desc}</span>
          </div>` : ''}
        <div class="resultcard__actions">
          <button class="btn btn--primary" id="result-copy">复制结果文案</button>
          <button class="btn" id="result-goto-library">返回游戏库</button>
        </div>
      </div>`;
  }

  function bindResult(sm) {
    view.querySelector('#result-copy')?.addEventListener('click', async () => {
      const text = buildResultText(sm);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        showToast('结果文案已复制到剪贴板');
      } catch (e) {
        showToast('复制失败：' + (e && e.message ? e.message : '未知错误'));
      }
    });
    view.querySelector('#result-goto-library')?.addEventListener('click', () => {
      setSelectedGame(null); // 回到库主页（非选中游戏详情）
      location.hash = '#/library';
    });
  }

  return { onLeave: unsub };
}
