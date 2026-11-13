// 视觉回归启动器（P0-3）：一条命令完成 启动 Vite → 等待可用 → 执行对比 → 无论成败关闭 Vite → 端口归零
// 用法：npm run visual:compare / npm run visual:capture
//
// 端口归零判定（返修 IV/累计）：netstat LISTENING 语义——
//   真实 LISTENING  = 占用（可补杀）
//   TIME_WAIT       = 连接释放延迟，不算占用（内核 ~2min 自然消退）
//   释放延迟        = 进程已死但条目短暂残留 → 第二窗口（最长 60s）等待自然消失
// 成功必须实际观察到无 LISTENING 才返回 0；真实监听 60s 无法清除 → exit 3。
'use strict';
const { spawn, execSync } = require('child_process');
const path = require('path');

const MODE = process.argv[2] || 'compare';
const PORT = 5173;
const CLIENT = path.dirname(__dirname);
const VITE = path.join(CLIENT, 'node_modules', 'vite', 'bin', 'vite.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const killTree = pid => {
  try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' }); } catch { /* 进程已退出 */ }
};

// 端口相关 netstat 行（精确 :5173 后跟空白，排除 :51730 撞车）；findstr 无匹配 → 空数组
const portLines = () => {
  try {
    const out = execSync(`netstat -ano | findstr ":${PORT}"`, { encoding: 'utf8' });
    return out.split('\n').filter(l => new RegExp(':' + PORT + '\\s').test(l)).map(l => l.trim());
  } catch { return []; }
};
const listeningLines = () => portLines().filter(l => l.includes('LISTENING'));
const timeWaitCount = () => portLines().filter(l => l.includes('TIME_WAIT')).length;
const portListening = () => listeningLines().length > 0;
const portFree = () => !portListening();

// LISTENING 行对应的进程 PID（补杀目标 = 实际监听进程，非父进程包装）
const pidsOnPort = () => [...new Set(
  listeningLines().map(l => l.trim().split(/\s+/).pop()).filter(p => /^\d+$/.test(p))
)];

(async () => {
  // 0) 前置检查：端口若已有监听进程直接报错退出（不接管他人进程）
  if (portListening()) {
    console.error(`[visual-run] 端口 ${PORT} 已被占用，请先释放（netstat -ano | findstr ${PORT}）：`);
    listeningLines().forEach(l => console.error('  ' + l));
    process.exit(2);
  }

  // 1) 启动 Vite（记录 pid，finally 保证清理）
  const vite = spawn(process.execPath, [VITE, '--port', String(PORT), '--strictPort'], {
    cwd: CLIENT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });
  vite.stdout.on('data', () => {});   // 静默 vite 日志，保持输出干净
  vite.stderr.on('data', d => process.stderr.write(d));

  let code = 1;
  try {
    // 2) 等待 Vite 监听就绪（最多 30s）
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (!alive(vite.pid)) throw new Error('Vite 进程提前退出');
      if (portListening()) { ready = true; break; }
      await sleep(500);
    }
    if (!ready) throw new Error('Vite 30 秒内未就绪');

    // 3) 执行对比（子进程继承 stdio，退出码透传）
    code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join('tools', 'visual-regression.mjs'), MODE], {
        cwd: CLIENT,
        stdio: 'inherit',
        env: { ...process.env, NO_PROXY: '127.0.0.1,localhost' },
      });
      child.on('exit', c => resolve(c ?? 1));
      child.on('error', reject);
    });
  } catch (e) {
    console.error('[visual-run] 失败：', e.message);
    code = 1;
  } finally {
    // 4) 清理与归零确认（三阶段，成功必须实际观察到无 LISTENING）：
    //    阶段一（30s）：杀 Vite 树 + 每 2s 对 LISTENING PID 补杀（带存活校验输出）
    //    阶段二（60s）：若无活进程持有监听（僵尸条目=释放延迟），等待内核自然释放
    //    两个窗口后仍存在真实 LISTENING → exit 3（附最后监听行与 PID 诊断）
    if (alive(vite.pid)) killTree(vite.pid);
    await sleep(500);

    // 阶段一：30s 内对监听 PID 补杀
    let killedPids = [];
    for (let i = 0; i < 30 && portListening(); i++) {
      for (const pid of pidsOnPort()) {
        if (alive(pid)) {
          killTree(pid);
          killedPids.push(pid);
        }
      }
      await sleep(1000);
    }

    // 阶段二：无活监听进程 → 条目为释放延迟，等待内核自然释放（最长 60s）
    if (portListening() && pidsOnPort().every(pid => !alive(pid))) {
      console.log('[visual-run] 监听进程已全部终止，等待内核释放残留条目（最长 60s）…');
      for (let i = 0; i < 60 && portListening(); i++) await sleep(1000);
    }

    if (portFree()) {
      const tw = timeWaitCount();
      console.log(`[visual-run] 端口 ${PORT} 已归零${tw ? `（TIME_WAIT=${tw} 将由内核自然消退，不影响使用）` : ''}${killedPids.length ? ` · 已终止 PID: ${killedPids.join(', ')}` : ''}`);
    } else {
      // 失败诊断：最后一次检测到的监听行与 PID、TIME_WAIT 计数
      const lines = listeningLines();
      const pids = pidsOnPort();
      console.error(`[visual-run] ❌ 端口 ${PORT} 仍存在真实监听（LISTENING=${lines.length}，TIME_WAIT=${timeWaitCount()}），无法清理`);
      lines.forEach(l => console.error('  最后监听行: ' + l));
      console.error(`  监听 PID: ${pids.join(', ') || '(未解析到)'} | 已尝试补杀: ${killedPids.join(', ') || '(无)'} | 存活: ${pids.filter(alive).join(', ') || '(无)'}`);
      code = 3;                                 // 覆盖对比成功码
    }
  }
  process.exit(code);
})();
