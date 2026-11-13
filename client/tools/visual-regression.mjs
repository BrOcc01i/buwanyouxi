// 批次 5：全状态视觉回归（capture / compare 两模式，正式工具）
// 用法（需先启动 vite dev server :5173）：
//   node tools/visual-regression.mjs capture   → 生成/更新基线（tests/visual-baseline/）
//   node tools/visual-regression.mjs compare   → 与基线逐像素 diff，非零差异退出码 1
// 原则：固定时间戳种子（无 Date.now 抖动）+ 等待全部图片加载 + 双视口
import pw from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODE = process.argv[2] || 'compare';
const BASE = 'http://127.0.0.1:5173/';
const OUT = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'tests', 'visual-baseline');
fs.mkdirSync(OUT, { recursive: true });

// 浏览器：playwright-core 不自带浏览器，用系统 Edge/Chrome channel（无需机器专属路径）
async function launchBrowser() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await pw.chromium.launch({ channel, headless: true, args: ['--no-sandbox'] });
    } catch (e) { /* 尝试下一个 channel */ }
  }
  throw new Error('未找到可用的 Edge/Chrome：请安装 Microsoft Edge 或 Google Chrome 后重试');
}

// 固定时间戳：2026-09-05 12:00:00 +08:00，保证排序与日期渲染稳定
const T0 = new Date('2026-09-05T12:00:00+08:00').getTime();

const STATES = ['fresh', 'empty', 'downloading', 'installed'];
// [状态, 路由, 名称]（#/library-detail = 库详情选中态）
const SHOTS = [
  ['fresh', '#/store', 'fresh_store'],
  ['empty', '#/store', 'empty_store'],
  ['empty', '#/library', 'empty_library'],
  ['downloading', '#/library', 'downloading_library'],
  ['downloading', '#/downloads', 'downloading_downloads'],
  ['downloading', '#/store', 'downloading_store'],
  ['installed', '#/library', 'installed_library'],
  ['installed', '#/library-detail', 'installed_library_detail'],
  ['installed', '#/store', 'installed_store'],
  ['installed', '#/detail/stardust-miner', 'installed_detail'],
  ['installed', '#/downloads', 'installed_downloads'],
  ['installed', '#/settings', 'installed_settings'],
  ['installed', '#/reveal/stardust-miner', 'installed_reveal'],
];
const VIEWPORTS = [[1920, 1080], [1280, 720]];

const browser = await launchBrowser();

// 像素 diff：借浏览器 canvas 解码两张 PNG（阈值 15/255，返回差异像素数与 bbox）
// 阈值 15 依据：canvas 色彩管理浮点舍入可产生 ~10 级伪差（PIL 权威分析同图仅 14px/max 强度 10，
// canvas 却报 573px）；真实回归（文字/布局变化）强度通常 >50，不受影响
async function pixelDiff(page, baseBuf, curBuf) {
  return page.evaluate(async ({ b64a, b64b }) => {
    const load = b64 => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'data:image/png;base64,' + b64; });
    const [ia, ib] = await Promise.all([load(b64a), load(b64b)]);
    if (!ia || !ib) return { diff: -2 };
    if (ia.width !== ib.width || ia.height !== ib.height) return { diff: -1, w: ia.width, h: ia.height };
    const c = document.createElement('canvas');
    c.width = ia.width; c.height = ia.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const grab = im => { ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(im, 0, 0); return ctx.getImageData(0, 0, c.width, c.height).data; };
    const da = grab(ia), db = grab(ib);
    let n = 0, bbox = null;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > 15 || Math.abs(da[i + 1] - db[i + 1]) > 15 || Math.abs(da[i + 2] - db[i + 2]) > 15) {
        n++;
        const px = (i / 4) % ia.width, py = Math.floor(i / 4 / ia.width);
        bbox = bbox ? [Math.min(bbox[0], px), Math.min(bbox[1], py), Math.max(bbox[2], px), Math.max(bbox[3], py)] : [px, py, px, py];
      }
    }
    return { diff: n, bbox, w: ia.width, h: ia.height };
  }, { b64a: baseBuf.toString('base64'), b64b: curBuf.toString('base64') });
}

let fail = 0;
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  for (const [stateName, route, shotName] of SHOTS) {
    const name = `${shotName}_${w}x${h}`;
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(({ stateName, T0 }) => {
      if (stateName === 'fresh') { localStorage.removeItem('nw_client_state_v1'); return; }
      const s = window.__debug.getState();
      s.profile.welcomeSeen = true;
      // 种子封闭（批次 5 教训）：每个状态显式重置 downloads/events，避免继承前序状态
      s.downloads = [];
      s.events = [];
      const lib = {
        'neon-drift': { gameId: 'neon-drift', status: 'downloading', ownedAt: T0 - 2e6, installedAt: null, progress: .42, favorite: false, launchCount: 0, lastLaunchedAt: null },
        'stardust-miner': { gameId: 'stardust-miner', status: 'installed', ownedAt: T0 - 8e6, installedAt: T0 - 7e6, progress: 1, favorite: true, launchCount: 3, lastLaunchedAt: T0 - 3e6 },
        'cloud-bakery': { gameId: 'cloud-bakery', status: 'owned', ownedAt: T0 - 4e6, installedAt: null, progress: 0, favorite: false, launchCount: 0, lastLaunchedAt: null },
      };
      if (stateName === 'empty') s.library = {};
      if (stateName === 'downloading') {
        s.library = { 'neon-drift': lib['neon-drift'] };
        // 引擎会实时推进进度（比较运行间必然漂移）→ 固定为暂停态保证确定性
        s.downloads = [
          { id: 't-a', gameId: 'neon-drift', stage: 'DOWNLOADING', paused: true, progress: .42, stageElapsedMs: 0, stageDurationMs: 0, totalElapsedMs: 0, queuedAt: T0, startedAt: T0, completedAt: null },
          { id: 't-b', gameId: 'orbit-market', stage: 'QUEUED', paused: true, progress: 0, stageElapsedMs: 0, stageDurationMs: 0, totalElapsedMs: 0, queuedAt: T0 + 1, startedAt: null, completedAt: null },
        ];
      }
      if (stateName === 'installed') {
        s.library = { 'stardust-miner': lib['stardust-miner'], 'cloud-bakery': lib['cloud-bakery'] };
        s.profile.stats.completedDownloads = 1;
        s.profile.badges = [{ badgeId: 'first_download', unlockedAt: T0 - 7e6 }];
        s.survey = { q1: 4, q2: '安装完成', q3: '安装完成那一刻最开心。', ownerType: '完美收集者', submittedAt: T0 - 6e6 };
      }
      localStorage.setItem('nw_client_state_v1', JSON.stringify(s));
    }, { stateName, T0 });

    await page.reload({ waitUntil: 'networkidle' });
    await new Promise(r => setTimeout(r, 400));
    if (route === '#/library-detail') {
      await page.evaluate(() => { location.hash = '#/library'; });
      await new Promise(r => setTimeout(r, 300));
      await page.click('.rail__item[data-game-id="stardust-miner"]');
      await new Promise(r => setTimeout(r, 400));
    } else {
      await page.evaluate(r => { location.hash = r; }, route);
      await new Promise(r => setTimeout(r, 400));
    }
    // 等待全部图片加载（批次 4 教训）+ 双拍稳定循环（webp 解码/绘制噪声）
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
      await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
    });
    let buf = await page.screenshot();
    for (let i = 0; i < 2; i++) {
      await new Promise(r => setTimeout(r, 350));
      const buf2 = await page.screenshot();
      if (buf2.equals(buf)) break;
      buf = buf2;
    }
    const file = path.join(OUT, name + '.png');
    if (MODE === 'capture') {
      fs.writeFileSync(file, buf);
      console.log('  captured', name);
    } else if (!fs.existsSync(file)) {
      console.log(`  ❌ ${name}: 基线缺失`); fail++;
    } else {
      const d = await pixelDiff(page, fs.readFileSync(file), buf);
      // 容差依据（批次 5 实测）：webp 缩放采样存在间歇性亚像素噪声，观测上限 ~160px/张
      // （阈值 15/255）；历史最小真实回归为 421px（下载百分比文字变化）。容差取 250px 居中分隔，
      // 超出即判失败；diff 数值与 bbox 始终输出供人工复核。
      const TOLERATED = 250;
      if (d.diff === 0) console.log(`  ✅ ${name}`);
      else if (d.diff === -1) { console.log(`  ❌ ${name}: 尺寸不一致 ${d.w}x${d.h}`); fail++; }
      else if (d.diff === -2) { console.log(`  ❌ ${name}: PNG 解码失败`); fail++; }
      else if (d.diff <= TOLERATED) console.log(`  ✅ ${name}（容差内噪声 ${d.diff} px，bbox=${d.bbox.join(',')}）`);
      else {
        console.log(`  ❌ ${name}: ${d.diff} px 差异（超容差 ${TOLERATED}）bbox=${d.bbox.join(',')}`);
        // 落盘当前截图供人工复核
        const cur = path.join(OUT, '_current');
        fs.mkdirSync(cur, { recursive: true });
        fs.writeFileSync(path.join(cur, name + '.png'), buf);
        fail++;
      }
    }
    if (errors.length) console.log(`  pageerror(${name}): ${errors.join(';')}`);
  }
  await ctx.close();
}
await browser.close();
console.log(MODE === 'capture' ? '基线已更新' : (fail ? `compare: ${fail} 张存在差异` : 'compare: 全部一致'));
process.exit(MODE === 'capture' ? 0 : (fail ? 1 : 0));
