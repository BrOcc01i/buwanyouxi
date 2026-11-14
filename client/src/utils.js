// 格式化工具
export function fmtSize(mb) {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return (gb >= 10 ? gb.toFixed(0) : gb.toFixed(1)) + ' GB';
  }
  return Math.round(mb) + ' MB';
}

export function fmtOwners(n) {
  return n.toLocaleString('zh-CN');
}

export function fmtSpeed(mbps) {
  if (!mbps || !Number.isFinite(mbps)) return '';
  return mbps >= 1 ? mbps.toFixed(1) + ' MB/s' : Math.round(mbps * 1024) + ' KB/s';
}

export function fmtETA(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '';
  sec = Math.round(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return '剩余 ' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// 阶段 → 界面文案
export function stageLabel(stage) {
  switch (stage) {
    case 'QUEUED': return '排队中';
    case 'PREPARING': return '正在连接服务器…';
    case 'DOWNLOADING': return '下载中';
    case 'VERIFYING': return '校验文件完整性…';
    case 'INSTALLING': return '正在安装…';
    case 'SHORTCUT': return '创建快捷方式…';
    case 'COMPLETED': return '安装完成';
    case 'CANCELLED': return '已取消';
    default: return stage;
  }
}

/* ============ 批次 3：原创素材图 + 一次性降级（§9） ============ */
// 素材 <img>：加载失败时由 shell.js 的全局 error 捕获替换为 emoji+渐变占位（一次性降级）。
// data-fb 存 gameId，降级时回查 GAME_MAP 取 emoji/gradient，避免把对象塞进属性。
export function artImg(g, kind, cls, alt = '') {
  const src = g.assets && g.assets[kind];
  if (!src) return artFallbackHTML(g);
  return `<img src="${src}" class="${cls}" alt="${alt}" data-fb="${g.id}" data-fb-kind="${kind}" draggable="false">`;
}

// emoji+渐变占位（也是 <img> 降级终点）
export function artFallbackHTML(g, cls = '') {
  return `<span class="art-fb ${cls}" style="background:linear-gradient(135deg, ${g.gradient.join(',')})" role="img" aria-label="${g.name}"><span>${g.emoji}</span></span>`;
}

// 最近启动日期：时间戳 → "2026年9月5日"；无记录返回 null
export function fmtLaunchDate(ts) {
  if (!Number.isInteger(ts) || ts <= 0) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
