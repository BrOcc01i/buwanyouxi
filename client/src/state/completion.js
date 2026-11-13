// 下载完成的反馈决策（纯函数，便于三分支测试）
// 规格（复审返修①）：
// - toast：任务首次进入 COMPLETED 必显示（与窗口聚焦、通知设置无关）
// - sound：仅受 soundEnabled 控制
// - notify：仅当应用失焦且 notificationsEnabled=true 时发 Windows 通知
// - notify 失败由调用方静默捕获，不影响 toast、不弹错误框
'use strict';

export function planCompletionFx(settings, hasFocus) {
  const s = settings || {};
  return {
    toast: true,
    sound: !!s.soundEnabled,
    notify: !hasFocus && !!s.notificationsEnabled,
  };
}
