// Electron 主进程
const { app, BrowserWindow, shell, session, ipcMain, Notification } = require('electron');
const path = require('path');

// 无 GPU / 虚拟环境下彻底禁用 GPU，避免 GPU 进程崩溃导致窗口无法创建
// （等价于 --disable-gpu 命令行参数，但写在代码里，打包产物不经过 run.js，必须代码级保障）
// --disable-gpu-sandbox：仅禁 GPU 进程 sandbox，不降低 renderer 隔离（renderer 仍受 sandbox:true 保护）
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.disableHardwareAcceleration();

// 退出前强制 flush 本地存储（localStorage 等），确保正常退出时数据落盘
// 兼容 flushStorageData 返回 Promise 或 undefined 两种情况，且只执行一次退出
let quitting = false;
app.on('before-quit', (e) => {
  if (quitting) return;
  e.preventDefault();
  const finish = () => { quitting = true; app.quit(); };
  try {
    const ret = session.defaultSession.flushStorageData();
    if (ret && typeof ret.then === 'function') {
      ret.then(finish, finish);
    } else {
      finish();
    }
  } catch (err) {
    finish();
  }
});

const isDev = process.env.NODE_ENV === 'development';

// 子进程崩溃诊断：renderer/GPU 崩溃时在主进程输出原因（exitCode/reason），便于验收排障
app.on('child-process-gone', (_e, details) => {
  console.error(`[main] child-process-gone type=${details.type} reason=${details.reason} exitCode=${details.exitCode}`);
});
app.on('render-process-gone', (_e, _wc, details) => {
  console.error(`[main] render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
});

// 自定义标题栏窗口控制（frameless）：最小化 / 最大化还原 / 关闭
ipcMain.on('nw-window-control', (e, action) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  try {
    if (action === 'minimize') win.minimize();
    else if (action === 'maximize') { win.isMaximized() ? win.unmaximize() : win.maximize(); }
    else     if (action === 'close') win.close(); // 走 before-quit flush 流程
  } catch (err) { /* 忽略窗口控制异常 */ }
});

// 下载完成通知（规格②）：渲染进程请求 → 主进程弹系统 Notification；不支持/失败返回 false
ipcMain.handle('nw-notify', async (e, payload) => {
  try {
    if (!Notification || typeof Notification.isSupported !== 'function' || !Notification.isSupported()) return false;
    const title = (payload && payload.title) ? String(payload.title) : '不玩游戏';
    const body = (payload && payload.body) ? String(payload.body) : '';
    const n = new Notification({ title, body });
    n.show();
    return true;
  } catch (err) {
    return false; // 不弹错误框，仅静默失败
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    frame: false, // Steam 风格自定义标题栏（renderer 内实现窗口控制）
    backgroundColor: '#171a21',
    title: '不玩游戏',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 外链在新窗口打开（防止应用内跳走到外部站点）
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS 上应用通常保持活跃直到用户显式退出
  if (process.platform !== 'darwin') app.quit();
});
