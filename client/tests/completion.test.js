// 返修① 三分支测试：planCompletionFx（下载完成反馈决策）
// 前台 Toast / 关闭通知 / 后台通知 —— 覆盖规格复审返修第 1 项的三个分支
'use strict';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planCompletionFx } from '../src/state/completion.js';

test('①a 前台（聚焦）完成：必出 Toast，不发通知；声音随设置', () => {
  const fx = planCompletionFx({ soundEnabled: true, notificationsEnabled: true }, true);
  assert.equal(fx.toast, true);
  assert.equal(fx.sound, true);
  assert.equal(fx.notify, false);
});

test('①b 失焦但关闭通知：仍必出 Toast，不发通知', () => {
  const fx = planCompletionFx({ soundEnabled: false, notificationsEnabled: false }, false);
  assert.equal(fx.toast, true);
  assert.equal(fx.sound, false);
  assert.equal(fx.notify, false);
});

test('①c 失焦且开启通知：Toast 照出，另发通知', () => {
  const fx = planCompletionFx({ soundEnabled: true, notificationsEnabled: true }, false);
  assert.equal(fx.toast, true);
  assert.equal(fx.sound, true);
  assert.equal(fx.notify, true);
});

test('①d 防御：settings 缺失/无 hasFocus 时安全降级（Toast 仍为 true）', () => {
  assert.equal(planCompletionFx(undefined, true).toast, true);
  assert.equal(planCompletionFx({}, false).notify, false);
});
