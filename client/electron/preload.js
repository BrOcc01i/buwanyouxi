// Electron preload —— contextIsolation 下向 renderer 暴露最小安全 API
// 注意：sandboxed preload 中 require('electron') 只暴露 contextBridge/ipcRenderer 等，
// 不含主进程 app 对象，故用 process.versions 与 package.json 同步的硬编码版本。
// 版本变更必须同步：package.json / src/state/store.js APP_VERSION / 根文档（守卫：tests/migration.test.js）
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nwApp', {
  version: '1.0.0',
  electron: process.versions.electron,
  node: process.versions.node,
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development',
  // 自定义标题栏窗口控制：'minimize' | 'maximize' | 'close'（单向 IPC，无返回值）
  windowControls: (action) => {
    const a = String(action || '');
    if (['minimize', 'maximize', 'close'].includes(a)) ipcRenderer.send('nw-window-control', a);
  },
  // 下载完成通知：渲染进程 → 主进程 show Notification（双向 invoke，主进程返回是否成功）
  notify: (title, body) => {
    try {
      return ipcRenderer.invoke('nw-notify', { title: String(title == null ? '' : title), body: String(body == null ? '' : body) });
    } catch (e) { return Promise.resolve(false); }
  },
});
