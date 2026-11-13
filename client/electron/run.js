// Electron 启动器
// 职责：
//   1. spawn 前显式删除 ELECTRON_RUN_AS_NODE（WorkBuddy 网关环境默认设=1，
//      会导致 electron.exe 退化为纯 Node 模式、主进程 API 不注入）
//   2. 统一向 main.js 传递 NODE_ENV，保证 isDev 判断一致
//   3. dev 模式：先检测 5173 端口，占用时给出清晰错误；退出时清理 vite 子进程
//   4. prod 模式：直接启动 electron 加载 dist/index.html
'use strict';
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const electronPath = require('electron');

const isDev = process.env.NODE_ENV !== 'production';

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
env.NODE_ENV = isDev ? 'development' : 'production';
// 清除代理环境变量：客户端是纯本地应用（vite / electron / CDP 全在 127.0.0.1），
// 终端或网关注入的 HTTP(S)_PROXY 会让 Chromium 把 localhost 请求转给代理，
// 导致页面导航永远不提交（窗口空白、CDP evaluate 无响应）。本地回环直连即可。
['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy'].forEach(k => { delete env[k]; });
env.NO_PROXY = '127.0.0.1,localhost';
env.no_proxy = '127.0.0.1,localhost';

const cwd = process.cwd();
const DEV_HOST = '127.0.0.1';
const DEV_PORT = 5173;
const DEV_URL = `http://${DEV_HOST}:${DEV_PORT}`;
// --disable-gpu：无 GPU / 虚拟环境下禁用硬件加速
// --disable-gpu-sandbox：仅禁用 GPU 进程 sandbox，避免 GPU 进程因 sandbox 初始化失败而崩溃
//   （不是全局 --no-sandbox，不降低 renderer 进程隔离；renderer 仍受 webPreferences.sandbox:true 保护）
// 开发模式额外保留 --remote-debugging-port 便于验收/排障；生产模式不含 --no-sandbox、--remote-debugging-port
const DEV_ELECTRON_ARGS = ['--disable-gpu', '--disable-gpu-sandbox', '--remote-debugging-port=9223'];
const PROD_ELECTRON_ARGS = ['--disable-gpu', '--disable-gpu-sandbox'];

// 杀进程树：Windows 上 child.kill 只杀直接子进程，用 taskkill /T 清理整棵进程树
function killTree(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch (e) { /* 忽略清理失败 */ }
}

function spawnElectron(args) {
  // Electron 命令行参数必须放在应用路径 '.' 之前（electron [options] [path]）
  return spawn(electronPath, [...args, '.'], { stdio: 'inherit', env, cwd });
}

// 顶层子进程跟踪 + 信号清理：SIGINT(Ctrl+C)/SIGTERM 时级联清理，避免残留 Electron/Node 进程
const children = new Set();
function track(child) {
  children.add(child);
  child.on('exit', () => children.delete(child));
  return child;
}
function shutdownAll(code) {
  children.forEach(killTree);
  children.clear();
  process.exit(code || 0);
}
process.on('SIGINT', () => shutdownAll(0));
process.on('SIGTERM', () => shutdownAll(0));

function portInUse(host, port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(true));      // 监听失败 = 端口被占用
    srv.once('listening', () => { srv.close(); resolve(false); });
    srv.listen(port, host);                      // 与 vite host 对齐（127.0.0.1）
  });
}

async function dev() {
  // 1) 先检测端口，避免「vite 起不来但 electron 仍启动」的混乱状态
  if (await portInUse(DEV_HOST, DEV_PORT)) {
    console.error(`[run] 错误：端口 ${DEV_HOST}:${DEV_PORT} 已被占用。请先关闭占用该端口的进程（或上一个残留的 vite/dev 实例）后重试。`);
    process.exit(1);
  }

  // 2) 直接用 node 启动 vite 入口（作为直接子进程，便于 kill 清理）
  const viteBin = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js');
  const vite = track(spawn(process.execPath, [viteBin], { stdio: 'inherit', env, cwd }));
  let electron = null;

  const cleanup = (code) => {
    killTree(electron);
    killTree(vite);
    process.exit(code || 0);
  };

  vite.on('exit', (code) => {
    if (!electron) {
      // vite 在 electron 启动前就退出 → 明确报错，不留半启动状态
      console.error(`[run] Vite 子进程意外退出（code=${code}）。可能原因：端口被抢占、依赖缺失或配置错误。`);
      cleanup(code || 1);
    } else {
      cleanup(code || 0);
    }
  });

  // 3) 等 vite 就绪后再拉起 electron
  try {
    const waitOn = require('wait-on');
    await waitOn({ resources: [`tcp:${DEV_HOST}:${DEV_PORT}`], timeout: 30000 });
  } catch (e) {
    console.error(`[run] Vite 未能在 30 秒内在 ${DEV_HOST}:${DEV_PORT} 端口就绪，终止启动。`);
    cleanup(1);
    return;
  }

  electron = track(spawnElectron(DEV_ELECTRON_ARGS));
  electron.on('exit', (code) => cleanup(code || 0));
}

function prod() {
  const electron = track(spawnElectron(PROD_ELECTRON_ARGS));
  electron.on('exit', (code) => process.exit(code || 0));
}

// 生产分支是同步函数，不再对返回值调用 .catch()
if (isDev) {
  dev().catch((e) => { console.error('[run] 启动失败：', e); process.exit(1); });
} else {
  prod();
}
