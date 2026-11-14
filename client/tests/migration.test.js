// 批次 5：数据迁移与持久化回归（node:test）
// 运行：cd client && node --test tests/migration.test.js
'use strict';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync as syncRead, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash as syncHash } from 'node:crypto';

/* ---------- shims（必须在 import src 前安装） ---------- */
class MemoryStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(String(k)) ? this.m.get(String(k)) : null; }
  setItem(k, v) { this.m.set(String(k), String(v)); }
  removeItem(k) { this.m.delete(String(k)); }
  clear() { this.m.clear(); }
}
global.localStorage = new MemoryStorage();
global.location = { search: '' };

const store = await import('../src/state/store.js');
const { normalize, buildExportPayload, APP_VERSION, STORAGE_KEY } = store;

test('版本一致性守卫（P0-2）：全库统一 1.0.0，禁止残留任何旧版本号（守卫正则内置，不在本文件出现字面量）', () => {
  const { readFileSync } = await_import_fs();
  const clientRoot = new URL('..', import.meta.url);
  const repoRoot = new URL('../../', import.meta.url);
  const read = url => readFileSync(fileURLToPath(url), 'utf8');

  // 1) 单一来源常量
  assert.equal(APP_VERSION, '1.0.0');

  // 2) package.json / package-lock.json
  const pkg = JSON.parse(read(new URL('../package.json', import.meta.url)));
  assert.equal(pkg.version, '1.0.0');
  const lock = JSON.parse(read(new URL('../package-lock.json', import.meta.url)));
  assert.equal(lock.version, '1.0.0');
  assert.equal(lock.packages[''].version, '1.0.0');

  // 3) Electron preload
  const preload = read(new URL('../electron/preload.js', import.meta.url));
  assert.match(preload, /version:\s*'1\.0\.0'/);

  // 4) 发布文档：README 徽章与 RELEASE_CHECKLIST tag
  const readme = read(new URL('README.md', repoRoot));
  assert.match(readme, /version-1\.0\.0/);
  const checklist = read(new URL('RELEASE_CHECKLIST.md', repoRoot));
  assert.match(checklist, /v1\.0\.0/);

  // 5) 源码与配置禁止残留旧版本号
  //    守卫正则用双重转义字符串构造（单引号里 '\b' 是退格符不是单词边界——返修 P0-2 教训），
  //    旧版本字面量在正则与样本串中均由拼接构造，本文件不出现连续旧版本字面量
  //    扫描范围：client src+electron、package.json、根 README/PRIVACY/RELEASE_CHECKLIST、.github
  //    （package-lock.json 不做文本扫描——第三方依赖 semver 范围会误报，其应用版本已由第 2 步精确断言；
  //     历史批次交付文档为存档记录，不在扫描范围）
  const OLD_VERSIONS = ['0' + '.3.0', '0' + '.1.0'];            // 样本串拼接
  const guardRegexes = OLD_VERSIONS.map(v => new RegExp('\\b' + v.replace(/\./g, '\\.') + '\\b'));
  // 守卫正则自测：必须真的能匹配旧版本（防止再次被错误转义悄悄失效）
  for (let i = 0; i < OLD_VERSIONS.length; i++) {
    const sample = 'version ' + OLD_VERSIONS[i] + ' here';
    assert.ok(guardRegexes[i].test(sample), `守卫正则必须能匹配旧版本样本（第 ${i + 1} 个）`);
    assert.ok(!guardRegexes[i].test('version 1.0.0 here'), '守卫正则不得误伤新版本 1.0.0');
  }
  const targets = [
    'src/state/store.js', 'src/flow/dialogs.js', 'src/pages/settings.js',
    'electron/preload.js', 'electron/main.js', 'electron/run.js',
    'package.json',
  ].map(f => new URL('../' + f, import.meta.url));
  targets.push(new URL('README.md', repoRoot));
  targets.push(new URL('PRIVACY.md', repoRoot));
  targets.push(new URL('RELEASE_CHECKLIST.md', repoRoot));
  targets.push(new URL('.github/workflows/ci.yml', repoRoot));
  targets.push(new URL('.github/workflows/package.yml', repoRoot));
  for (const url of targets) {
    const src = read(url);
    const rel = fileURLToPath(url);
    for (const re of guardRegexes) {
      assert.ok(!re.test(src), rel + ' 残留旧版本号');
    }
  }

  // 6) 打包图标单一来源（P0-4）：src/assets/app/icon.ico ↔ build/icon.ico SHA-256 一致
  const { createHash } = await_import_crypto();
  const sha256 = p => createHash('sha256').update(readFileSync(fileURLToPath(p))).digest('hex');
  const srcIcon = new URL('../src/assets/app/icon.ico', import.meta.url);
  const buildIcon = new URL('../build/icon.ico', import.meta.url);
  assert.ok(existsSync(fileURLToPath(buildIcon)), 'build/icon.ico 缺失（electron-builder 打包入口）');
  const h1 = sha256(srcIcon), h2 = sha256(buildIcon);
  assert.equal(h1, h2, 'build/icon.ico 与 src/assets/app/icon.ico SHA-256 不一致（误用旧图标）');
});
function await_import_fs() {
  return { readFileSync: syncRead };
}
function await_import_crypto() {
  return { createHash: syncHash };
}

test('v1 legacy 迁移（§7.3）：PAUSED+pausedFrom → paused/resumeStage；elapsedMs → totalElapsedMs', () => {
  const legacy = {
    version: 1, // 非 2 → legacy 模式
    downloads: [
      { id: 't1', gameId: 'neon-drift', stage: 'PAUSED', pausedFrom: 'DOWNLOADING', progress: .37, elapsedMs: 65432 },
      { id: 't2', gameId: 'orbit-market', stage: 'QUEUED', progress: 0 },
    ],
  };
  const out = normalize(legacy);
  assert.equal(out.version, 3);
  const [t1, t2] = out.downloads;
  assert.equal(t1.paused, true);
  assert.equal(t1.resumeStage, 'DOWNLOADING');
  assert.equal(t1.stage, 'DOWNLOADING');      // 保留暂停前阶段
  assert.equal(t1.totalElapsedMs, 65432);     // v1 elapsedMs 迁移
  assert.equal(t2.stage, 'QUEUED');
  assert.equal(t2.paused, false);
  assert.equal(t2.progress, 0);
});

test('normalize 容错：无效 stage/progress/垃圾条目安全降级，不崩溃', () => {
  const out = normalize({
    version: 2,
    downloads: [
      null,                                    // 垃圾条目 → 过滤
      42,                                      // 垃圾条目 → 过滤
      { gameId: 'stardust-miner', stage: 'NOT_A_STAGE', progress: 'x' }, // 无效值 → QUEUED/0
      { id: 'ok', gameId: 'cloud-bakery', stage: 'DOWNLOADING', progress: 1.7 }, // clamp → 1
    ],
  });
  assert.equal(out.downloads.length, 2);
  const [a, b] = out.downloads;
  assert.equal(a.stage, 'QUEUED');
  assert.equal(a.progress, 0);
  assert.ok(a.id);                             // 自动补 id
  assert.equal(b.progress, 1);
});

test('损坏/缺失输入：normalize(null/undefined/标量) → 空状态骨架，不抛异常', () => {
  for (const bad of [null, undefined, 42, 'str']) {
    const out = normalize(bad);
    assert.equal(out.version, 3);
    assert.deepEqual(out.downloads, []);
    assert.deepEqual(out.library, {});
  }
});

test('导出回环：buildExportPayload → normalize 保留全量业务字段，appVersion=1.0.0', () => {
  store.resetAllData();
  // 造业务状态
  store.updateSettings({ defaultRoute: '#/library', reducedMotion: true, soundEnabled: false, notificationsEnabled: false });
  store.recordEvent('welcome_accept');
  store.submitSurvey({ q1: 4, q2: '安装完成', q3: '回环测试' });
  const payload = buildExportPayload();
  assert.equal(payload.appVersion, APP_VERSION);
  assert.equal(payload.schemaVersion, 1);
  // 回环：payload 过 normalize 后关键字段保持
  const round = normalize(payload);
  assert.deepEqual(round.settings, payload.settings);
  assert.equal(round.survey.q3, '回环测试');
  assert.equal(round.profile.ownerType, payload.profile.ownerType);
});

test('存储键与重启路径：STORAGE_KEY 不变（nw_client_state_v1）', () => {
  assert.equal(STORAGE_KEY, 'nw_client_state_v1');
});
