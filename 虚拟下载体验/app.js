/* ============================================================
 * 「不玩游戏」虚拟下载体验 — MVP v2.0
 * 纯前端单页应用：vanilla JS + hash 路由，零依赖，file:// 可开
 * 规格书：《虚拟下载体验_MVP方案与开发规格书.md》10.1 ~ 10.17
 * ============================================================ */
'use strict';

/* ---------------- 10.10 游戏数据（6 款虚构，体积梯度 1200~48000MB） ---------------- */
const GAMES = [
  {
    id: 'stardust-miner', name: '星尘矿工', emoji: '⛏️',
    gradient: ['#1a2a6c', '#b21f1f'],
    hook: '在废弃星系里挖到宇宙尽头',
    desc: '像素风 roguelike 采矿。每一颗星星下面，都埋着上一个矿工的遗言。',
    tags: ['Roguelike', '像素', '孤独'],
    sizeMB: 2400, rating: 4.7, owners: 12804, publisher: 'NEBULA WORKS',
  },
  {
    id: 'cloud-bakery', name: '云朵烘焙坊', emoji: '🧁',
    gradient: ['#f6d365', '#fda085'],
    hook: '在天空之城烤一块会呼吸的蛋糕',
    desc: '治愈系经营。客人都是云朵，它们只买刚出炉的、还带着温度的东西。',
    tags: ['治愈', '经营', '轻松'],
    sizeMB: 1200, rating: 4.9, owners: 21033, publisher: 'CLOUDHIVE STUDIO',
  },
  {
    id: 'neon-drift', name: '霓虹漂移', emoji: '🏎️',
    gradient: ['#0f0c29', '#302b63', '#24243e'],
    hook: '在雨夜霓虹里追上最后一班地铁',
    desc: '街机竞速。城市永远在下雨，你的轮胎烧出一条紫色的线。',
    tags: ['竞速', '霓虹', '街机'],
    sizeMB: 5800, rating: 4.5, owners: 15678, publisher: 'AFTERGLOW GAMES',
  },
  {
    id: 'corridor-seven', name: '第七走廊', emoji: '🕯️',
    gradient: ['#2c061f', '#5d1340', '#a63a50'],
    hook: '电梯只到 7 楼，而 7 楼不是这栋楼',
    desc: '第一人称恐怖解谜。你每天走同一条走廊，直到某天它多了一扇门。',
    tags: ['恐怖', '解谜', '沉浸'],
    sizeMB: 12000, rating: 4.2, owners: 8721, publisher: 'BLACK ANTENNA',
  },
  {
    id: 'orbit-market', name: '轨道市集', emoji: '🛰️',
    gradient: ['#0b3d91', '#1d976c'],
    hook: '把整个银河系，摆进你的货架',
    desc: '太空贸易模拟。凌晨四点的空间站，只有你在给下一个星区补货。',
    tags: ['经营', '模拟', '科幻'],
    sizeMB: 24000, rating: 4.3, owners: 9834, publisher: 'LOW-ORBIT LABS',
  },
  {
    id: 'echo-archive', name: '回声档案馆', emoji: '🗝️',
    gradient: ['#232526', '#414345', '#8e2de2'],
    hook: '每一段记忆，都要凭票才能取回',
    desc: '叙事解谜。你在一座存放旧声音的档案馆值夜班，今晚有人调走了 1998 年的雨。',
    tags: ['解谜', '叙事', '悬疑'],
    sizeMB: 48000, rating: 4.8, owners: 6420, publisher: 'SIGNAL VAULT',
  },
];

const GAME_MAP = Object.fromEntries(GAMES.map(g => [g.id, g]));

/* ---------------- 10.11 localStorage（带内存降级） ---------------- */
const LS_KEY = { owned: 'bg_owned', events: 'bg_events', survey: 'bg_survey', visits: 'bg_visits' };

const Storage = (() => {
  let ok = true;
  try {
    localStorage.setItem('__bg_test__', '1');
    localStorage.removeItem('__bg_test__');
  } catch (e) { ok = false; }

  const mem = {};
  function read(key, fallback) {
    if (!ok) return key in mem ? mem[key] : fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    const json = JSON.stringify(val);
    if (!ok) { mem[key] = val; return; }
    try { localStorage.setItem(key, json); } catch (e) { /* 配额/隐私模式 */ }
  }
  return {
    disabled: !ok,
    getOwned() { return read(LS_KEY.owned, []); },
    addOwned(id) {
      const arr = this.getOwned();
      if (!arr.includes(id)) { arr.push(id); write(LS_KEY.owned, arr); }
    },
    getEvents() { return read(LS_KEY.events, []); },
    setEvents(v) { write(LS_KEY.events, v); },
    getSurvey() { return read(LS_KEY.survey, null); },
    setSurvey(v) { write(LS_KEY.survey, v); },
    bumpVisits() {
      const n = (read(LS_KEY.visits, 0) || 0) + 1;
      write(LS_KEY.visits, n);
      return n;
    },
    getVisits() { return read(LS_KEY.visits, 0) || 0; },
  };
})();

/* ---------------- 埋点（10.11：上限 500 条，溢出裁头） ---------------- */
function track(event, extra) {
  const entry = Object.assign({ ts: Date.now(), event }, extra || {});
  const arr = Storage.getEvents();
  arr.push(entry);
  if (arr.length > 500) arr.splice(0, arr.length - 500);
  Storage.setEvents(arr);
  return entry;
}

/* ---------------- 工具 ---------------- */
const $ = sel => document.querySelector(sel);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtSize = mb => mb >= 1024 ? (mb / 1024).toFixed(mb >= 10240 ? 0 : 1) + ' GB' : mb + ' MB';
function fmtETA(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `剩余 ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function fmtSpeed(mbPerSec) {
  return mbPerSec >= 1 ? mbPerSec.toFixed(1) + ' MB/s' : Math.round(mbPerSec * 1024) + ' KB/s';
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.hidden = true; }, 1800);
}

/* ---------------- 完成音（Web Audio 合成，10.9） ---------------- */
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 0.15;
    [[880, 0.12], [1320, 0.08]].forEach(([f, dur], i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(gain);
      const t0 = ctx.currentTime + i * 0.12;
      osc.start(t0);
      osc.stop(t0 + dur);
    });
  } catch (e) { /* 音频不可用则静默 */ }
}

/* ---------------- 10.8 下载模拟状态机 ---------------- */
const STAGES = ['PREPARING', 'DOWNLOADING', 'VERIFYING', 'INSTALLING', 'SHORTCUT', 'COMPLETED'];
const PREPARING_LINES = ['正在连接服务器…', '已分配节点 CDN-07', '协商下载计划…'];
const INSTALL_STEPS = [
  '解压资源包 (1/7)', '解压资源包 (2/7)', '解压资源包 (3/7)', '解压资源包 (4/7)',
  '解压资源包 (5/7)', '写入配置…', '注册组件…',
];
const LOG_POOL = [
  () => `GET /cdn07/chunk/${randInt(100, 9999)} 200 ${randInt(32, 512)}KB`,
  () => `keep-alive: reuse conn#${randInt(2, 9)}`,
  () => `ETA recalc: -${randInt(1, 6)}s`,
  () => `sha256 verified: chunk ${randInt(100, 9999)}`,
  () => `http/2 stream #${randInt(3, 40)} open`,
  () => `TCP window ${randInt(256, 1024)} KB`,
];
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

// 每状态时长（ms）：PREPARING 2~4s / DOWNLOADING 60~100s / VERIFYING 6~10s /
// INSTALLING 12~20s / SHORTCUT 2~3s。小体积游戏下载较快，体积大者较长，均在区间内。
function durationOf(stage, game) {
  switch (stage) {
    case 'PREPARING':  return rand(2000, 4000);
    case 'DOWNLOADING': return game.sizeMB < 6000 ? rand(60000, 80000) : rand(80000, 100000);
    case 'VERIFYING':  return rand(6000, 10000);
    case 'INSTALLING': return rand(12000, 20000);
    case 'SHORTCUT':   return rand(2000, 3000);
    default:           return 0;
  }
}

// 播放会话（内存态，刷新即弃，符合 10.14）
let session = null;

/* ---------------- 路由 ---------------- */
function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const parts = h.split('/').filter(Boolean); // ['game', 'stardust-miner']
  return { path: parts[0] || '/', id: parts[1] || null };
}
function navigate(hash) { location.hash = hash; }

function showView(name) {
  ['home', 'game', 'play', 'done'].forEach(v => {
    const el = $('#view-' + v);
    el.hidden = v !== name;
  });
  window.scrollTo(0, 0);
}

function onRoute() {
  const { path, id } = parseHash();
  switch (path) {
    case '/':
      renderHome();
      break;
    case 'game':
      if (id && GAME_MAP[id]) renderDetail(id);
      else navigate('#/');
      break;
    case 'play':
      if (id && GAME_MAP[id] && session && session.gameId === id) renderPlay(id);
      else navigate('#/game/' + (id || ''));
      break;
    case 'done':
      if (id && GAME_MAP[id] && Storage.getOwned().includes(id)) renderDone(id);
      else navigate('#/');
      break;
    default:
      navigate('#/');
  }
}

/* ---------------- P1 首页 ---------------- */
function renderHome() {
  showView('home');

  // 我的游戏库条（E10）
  const owned = Storage.getOwned();
  const strip = $('#owned-strip');
  strip.hidden = owned.length === 0;
  if (owned.length) {
    const wrap = $('#owned-strip__icons');
    wrap.innerHTML = '';
    owned.slice(0, 6).forEach(gid => {
      const g = GAME_MAP[gid];
      if (!g) return;
      const b = document.createElement('button');
      b.className = 'mini-icon';
      b.style.background = `linear-gradient(135deg, ${g.gradient[0]}, ${g.gradient[g.gradient.length - 1]})`;
      b.textContent = g.emoji;
      b.title = g.name;
      b.addEventListener('click', () => navigate('#/game/' + gid));
      wrap.appendChild(b);
    });
  }

  // 卡片随机排序 + 埋点 shelf_order
  const order = shuffle(GAMES.slice());
  track('shelf_order', { order: order.map(g => g.id) });

  const grid = $('#game-grid');
  grid.innerHTML = '';
  order.forEach(g => {
    const card = document.createElement('button');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="game-card__cover" style="background:linear-gradient(135deg, ${g.gradient.join(',')})">
        <span>${g.emoji}</span>
        <span class="game-card__size">${fmtSize(g.sizeMB)}</span>
      </div>
      <div class="game-card__body">
        <div class="game-card__name">${g.name}</div>
        <div class="game-card__hook">${g.hook}</div>
      </div>`;
    card.addEventListener('click', () => {
      track('view_game', { gameId: g.id });
      navigate('#/game/' + g.id);
    });
    grid.appendChild(card);
  });
}

/* ---------------- P2 游戏详情 ---------------- */
function renderDetail(id) {
  showView('game');
  const g = GAME_MAP[id];

  const cover = $('#detail-cover');
  cover.style.background = `linear-gradient(135deg, ${g.gradient.join(',')})`;
  cover.innerHTML = `<span style="filter:drop-shadow(0 6px 18px rgba(0,0,0,.35))">${g.emoji}</span>`;
  $('#detail-name').textContent = g.name;
  $('#detail-desc').textContent = g.desc;
  $('#detail-size').textContent = '体积 ' + fmtSize(g.sizeMB);
  $('#detail-rating').textContent = '★ ' + g.rating.toFixed(1);
  $('#detail-owners').textContent = '已有 ' + g.owners.toLocaleString() + ' 人获取';

  const tagRow = $('#detail-tags');
  tagRow.innerHTML = '';
  g.tags.forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tagRow.appendChild(span);
  });

  $('#acquire-btn').onclick = () => {
    track('acquire', { gameId: g.id });
    session = { gameId: g.id, startedAt: Date.now(), stage: 'PREPARING', progress: 0, elapsedMs: 0 };
    navigate('#/play/' + g.id);
  };
}

/* ---------------- P3 下载安装流程 ---------------- */
const PlayUI = {
  timer: null,
  lastLogAt: 0,
  logCount: 0,
  cancelGuard: false,
};

function renderPlay(id) {
  showView('play');
  const g = GAME_MAP[id];

  // 顶部
  const icon = $('#play-icon');
  icon.style.background = `linear-gradient(135deg, ${g.gradient.join(',')})`;
  icon.textContent = g.emoji;
  $('#play-name').textContent = g.name;
  $('#launch-btn').hidden = true;
  $('#launch-btn').disabled = true;
  $('#install-extra').hidden = true;
  $('#play-speed').textContent = '';
  $('#play-eta').textContent = '';
  $('#desktop-icons').innerHTML = '';
  $('#play-log').innerHTML = '';
  PlayUI.logCount = 0;

  track('play_enter', { gameId: g.id });

  // 取消（10.7：confirm → 埋点 cancel → 回首页）
  $('#play-cancel').onclick = () => {
    if (PlayUI.cancelGuard) return;
    PlayUI.cancelGuard = true;
    const ok = window.confirm('放弃本次获取？');
    PlayUI.cancelGuard = false;
    if (ok) {
      stopMachine();
      track('cancel', {
        gameId: g.id,
        stage: session && session.stage,
        progress: session ? Math.round(session.progress * 100) : 0,
        elapsed: session ? Math.round(session.elapsedMs / 1000) : 0,
      });
      session = null;
      navigate('#/');
    }
  };

  // 启动游戏（仅 COMPLETED 可点）
  $('#launch-btn').onclick = () => {
    track('launch', { gameId: g.id });
    showLaunchOverlay(g);
  };

  startMachine(g);
}

function stopMachine() {
  if (PlayUI.timer) { clearInterval(PlayUI.timer); PlayUI.timer = null; }
}

function startMachine(g) {
  stopMachine();
  session = session || { gameId: g.id, startedAt: Date.now() };
  session.stage = 'PREPARING';
  session.progress = 0;
  session.elapsedMs = 0;

  let stageStart = Date.now();
  let stageDuration = durationOf(session.stage, g);
  let stageIdx = 0; // 子进度索引（INSTALLING / PREPARING 文案轮换）
  let speed = 6;    // 当前显示速度 MB/s
  let logTimer = null;

  const TICK = 100;
  const bar = $('#play-bar');
  const percentEl = $('#play-percent');
  const speedEl = $('#play-speed');
  const etaEl = $('#play-eta');
  const stageEl = $('#play-stage');
  const installExtra = $('#install-extra');
  const installSubtext = $('#install-subtext');
  const installSubbar = $('#install-subbar');

  const setBar = (p) => {
    p = clamp(p, 0, 100);
    bar.style.width = p + '%';
    percentEl.textContent = Math.floor(p) + '%';
  };
  const appendLog = () => {
    const wrap = $('#play-log');
    if (wrap.parentElement.open === false) { /* 收起时不渲染，省资源 */ return; }
    const line = document.createElement('div');
    const text = LOG_POOL[randInt(0, LOG_POOL.length - 1)]();
    line.className = /verified|200/.test(text) ? 'log-ok' : '';
    line.textContent = text;
    wrap.appendChild(line);
    while (wrap.children.length > 50) wrap.removeChild(wrap.firstChild);
    wrap.scrollTop = wrap.scrollHeight;
    PlayUI.logCount++;
  };

  PlayUI.timer = setInterval(() => {
    const now = Date.now();
    const dt = now - stageStart;
    session.elapsedMs += TICK;

    const stage = session.stage;

    if (stage === 'PREPARING') {
      // 文案 1s 节奏轮换
      stageIdx = Math.min(2, Math.floor(dt / 1000));
      stageEl.textContent = PREPARING_LINES[stageIdx];
      if (dt >= stageDuration) advance();
      return;
    }

    if (stage === 'DOWNLOADING') {
      session.progress += TICK / stageDuration;
      // 速度随机游走 ±40%，钳制 2~18 MB/s（10.8）
      speed = clamp(speed * rand(0.6, 1.4), 2, 18);
      setBar(session.progress * 100);
      speedEl.textContent = fmtSpeed(speed);
      // 剩余时间 = 剩余时长（进度反推，速度突变不产生 NaN/负数）
      const remainSec = Math.max(0, (1 - session.progress) * (stageDuration - dt) / 1000);
      etaEl.textContent = fmtETA(remainSec);
      // 伪日志 300~800ms 一条
      if (now - PlayUI.lastLogAt > rand(300, 800)) {
        appendLog();
        PlayUI.lastLogAt = now;
      }
      if (dt >= stageDuration) advance();
      return;
    }

    if (stage === 'VERIFYING') {
      // 99.0%~99.9% 抖动，最后 1s 到 100%
      const t = dt / stageDuration;
      let p;
      if (t >= 1) p = 100;
      else if (t >= 1 - 1000 / stageDuration) p = 100;
      else p = 99.0 + (Math.random() * 0.9);
      setBar(p);
      speedEl.textContent = '';
      etaEl.textContent = '';
      if (dt >= stageDuration) advance();
      return;
    }

    if (stage === 'INSTALLING') {
      const t = clamp(dt / stageDuration, 0, 1);
      const stepIdx = Math.min(INSTALL_STEPS.length - 1, Math.floor(t * INSTALL_STEPS.length));
      installSubtext.textContent = INSTALL_STEPS[stepIdx];
      // 子进度：当前子步骤内线性
      const perStep = 1 / INSTALL_STEPS.length;
      const stepProgress = clamp((t - stepIdx * perStep) / perStep, 0, 1);
      installSubbar.style.width = (stepProgress * 100) + '%';
      setBar(100); // 主进度保持 100%
      if (dt >= stageDuration) advance();
      return;
    }

    if (stage === 'SHORTCUT') {
      if (dt >= stageDuration) advance();
      return;
    }

    if (stage === 'COMPLETED') {
      // 停留态
    }
  }, TICK);

  function addDesktopIcon(game) {
    const wrap = $('#desktop-icons');
    const iconEl = document.createElement('div');
    iconEl.className = 'desktop-icon';
    iconEl.innerHTML = `
      <div class="desktop-icon__face" style="background:linear-gradient(135deg, ${game.gradient.join(',')})">${game.emoji}</div>
      <div class="desktop-icon__name">${game.name}</div>`;
    wrap.appendChild(iconEl);
    // 下一帧触发 transition
    requestAnimationFrame(() => requestAnimationFrame(() => iconEl.classList.add('desktop-icon--placed')));
  }

  function advance() {
    const cur = STAGES.indexOf(session.stage);
    if (cur >= STAGES.length - 1) return;
    session.stage = STAGES[cur + 1];
    stageStart = Date.now();
    stageDuration = durationOf(session.stage, g);
    stageIdx = 0;
    PlayUI.lastLogAt = 0;

    if (session.stage === 'DOWNLOADING') {
      stageEl.textContent = '下载中';
      // 基准速度 = 体积 / 目标时长（MB/s），钳制显示范围
      speed = clamp(g.sizeMB / (stageDuration / 1000), 2, 18);
    } else if (session.stage === 'VERIFYING') {
      stageEl.textContent = '校验文件完整性 (SHA-256)…';
      setBar(99.0);
      appendLog();
      appendLog();
    } else if (session.stage === 'INSTALLING') {
      stageEl.textContent = '正在安装…';
      installExtra.hidden = false;
      installSubbar.style.width = '0%';
      setBar(100);
    } else if (session.stage === 'SHORTCUT') {
      stageEl.textContent = '创建快捷方式…';
      // 进入 SHORTCUT 即落图（避免 setInterval 100ms 首次回调晚于 50ms 触发条件）
      addDesktopIcon(g);
      playChime();
    } else if (session.stage === 'COMPLETED') {
      stageEl.textContent = '安装完成';
      installExtra.hidden = true;
      speedEl.textContent = '';
      etaEl.textContent = '';
      setBar(100);
      Storage.addOwned(g.id);            // 10.13-3：写入 bg_owned
      const btn = $('#launch-btn');
      btn.hidden = false;
      btn.disabled = false;
      clearInterval(PlayUI.timer);
      PlayUI.timer = null;
      track('completed', { gameId: g.id });
    }
  }
}

/* ---------------- P5 伪启动覆盖态 ---------------- */
function showLaunchOverlay(g) {
  const overlay = $('#launch-overlay');
  const logo = $('#launch-logo');
  const title = $('#launch-title');
  const prompt = $('#launch-prompt');

  logo.textContent = g.publisher;
  title.textContent = g.name;
  title.hidden = true;
  prompt.hidden = true;
  overlay.hidden = false;

  // LOGO 淡入 1.2s 后显示标题 + 按任意键
  setTimeout(() => {
    title.hidden = false;
    prompt.hidden = false;
  }, 1200);

  const flash = () => {
    const f = document.createElement('div');
    f.className = 'launch-flash';
    overlay.appendChild(f);
  };
  const finish = () => {
    if (finish._done) return;
    finish._done = true;
    overlay.removeEventListener('click', onAct);
    document.removeEventListener('keydown', onKey);
    track('reveal', { gameId: g.id });
    session = null;
    flash();
    setTimeout(() => {
      overlay.hidden = true;
      navigate('#/done/' + g.id);
    }, 300);
  };
  const onAct = () => finish();
  const onKey = () => finish();
  overlay.addEventListener('click', onAct);
  document.addEventListener('keydown', onKey);
}

/* ---------------- P4 完成 / 揭示页 ---------------- */
function renderDone(id) {
  showView('done');
  const g = GAME_MAP[id];

  // 重置问卷表单
  $('#survey-form').hidden = false;
  $('#survey-thanks').hidden = true;
  $('#q1-value').value = '';
  document.querySelectorAll('#q1-stars .star').forEach(s => s.classList.remove('star--on'));
  document.querySelectorAll('input[name="q2"]').forEach(r => { r.checked = false; });
  $('#q3').value = '';

  // Q1 五星
  const stars = document.querySelectorAll('#q1-stars .star');
  stars.forEach(star => {
    star.onclick = () => {
      const v = +star.dataset.v;
      $('#q1-value').value = v;
      stars.forEach(s => s.classList.toggle('star--on', +s.dataset.v <= v));
    };
  });

  // 提交（10.7：校验 Q1/Q2 → 写 survey + 埋点 → 显示后续）
  $('#survey-form').onsubmit = (e) => {
    e.preventDefault();
    const q1 = $('#q1-value').value;
    const q2El = document.querySelector('input[name="q2"]:checked');
    if (!q1) { showToast('请先给第 1 题打分'); return; }
    if (!q2El) { showToast('请回答第 2 题'); return; }
    const survey = { q1: +q1, q2: q2El.value, q3: $('#q3').value.trim(), ts: Date.now() };
    Storage.setSurvey(survey);
    track('survey_submit', { gameId: g.id, q1: survey.q1, q2: survey.q2 });
    $('#survey-form').hidden = true;
    $('#survey-thanks').hidden = false;
  };

  // 再体验一个
  $('#replay-btn').onclick = () => {
    track('replay', { gameId: g.id });
    navigate('#/');
  };

  // 复制链接分享
  $('#share-btn').onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.origin + location.pathname + '#/');
      showToast('链接已复制');
    } catch (e) {
      showToast('复制失败，请手动复制地址栏链接');
    }
    track('share', { gameId: g.id });
  };

  // 导出实验数据（10.11）
  $('#export-btn').onclick = () => {
    const data = {
      exportedAt: Date.now(),
      visits: Storage.getVisits(),
      events: Storage.getEvents(),
      survey: Storage.getSurvey(),
      owned: Storage.getOwned(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bg_events.json';
    a.click();
    URL.revokeObjectURL(a.href);
    track('export', {});
  };
}

/* ---------------- 启动 ---------------- */
window.addEventListener('hashchange', onRoute);
window.addEventListener('load', () => {
  const n = Storage.bumpVisits();
  track('visit', { n });
  onRoute();
});
