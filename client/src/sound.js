// 界面声音：WebAudio 合成的下载完成提示音（两个正弦音阶，~0.4s，原创合成，无外部素材/文件）
// 任何异常都静默吞掉，绝不影响主流程。
'use strict';
let ctx = null;
function getCtx() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  } catch (e) { return null; }
}

function playTone(ac, freq, start, dur) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

// 下载完成提示音：C5(523.25Hz) → E5(659.25Hz)，各约 0.2s，整体 ~0.4s
export function playComplete() {
  try {
    const ac = getCtx();
    if (!ac) return;
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* ignore */ } }
    const t = ac.currentTime;
    playTone(ac, 523.25, t, 0.2);
    playTone(ac, 659.25, t + 0.18, 0.22);
  } catch (e) { /* 静默 */ }
}
