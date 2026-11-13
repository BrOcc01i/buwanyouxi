// 批次 4 自动化测试：焦点推荐 / owners 单一来源 / 素材文件落位与用途契约（node:test）
// 运行：cd client && node --test tests/store-flow.test.js
'use strict';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAMES, GAME_MAP, pickFeatured } from '../src/data/games.js';

test('焦点推荐（§5.1）：评分最高者；平手取声明序靠前', () => {
  const f = pickFeatured(GAMES);
  const maxRating = Math.max(...GAMES.map(g => g.rating));
  assert.equal(f.rating, maxRating);
  // 平手：取靠前者
  const tie = [
    { id: 'a', rating: 4.5 },
    { id: 'b', rating: 4.5 },
    { id: 'c', rating: 4.1 },
  ];
  assert.equal(pickFeatured(tie).id, 'a');
  assert.ok(GAME_MAP[f.id]);
});

test('元数据单一来源（修订②）：owners 唯一且为正数；不存在 players 字段', () => {
  for (const g of GAMES) {
    assert.equal(typeof g.owners, 'number', g.id + ' owners 应为数字');
    assert.ok(Number.isFinite(g.owners) && g.owners > 0, g.id + ' owners 应为正数');
    assert.ok(!('players' in g), g.id + ' 不得存在 players 字段（owners 单一来源）');
    // 评分/体积/发行商齐全
    assert.ok(g.rating > 0 && g.rating <= 5);
    assert.ok(g.sizeMB > 0);
    assert.ok(g.publisher);
  }
  // 全代码库不得混用 players 字段
  const gamesSrc = readSrc('src/data/games.js');
  assert.ok(!/\bplayers\s*:/.test(gamesSrc), 'games.js 不得出现 players 字段');
});

test('素材用途契约（修订①/⑤）：header/portrait/logo/截图文件落位且字段指向正确', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  for (const g of GAMES) {
    const a = g.assets;
    assert.ok(existsSync(root + new URL(a.header).pathname.slice(1).replace(/^.*?assets/, 'src/assets').replace('src/assets/', 'src/assets/')) || existsSync(fileSrc(a.header)), g.id + ' header.webp 缺失');
    assert.ok(existsSync(fileSrc(a.portrait)), g.id + ' portrait.webp 缺失');
    assert.ok(existsSync(fileSrc(a.logo)), g.id + ' logo.svg 缺失');
    assert.ok(a.header.includes('header.webp'), g.id + ' header 字段指向错误');
    assert.ok(a.portrait.includes('portrait.webp'), g.id + ' portrait 字段指向错误');
    assert.ok(a.logo.includes('logo.svg'), g.id + ' logo 字段指向错误');
    assert.equal(a.screenshots.length, 3);
    for (const s of a.screenshots) assert.ok(existsSync(fileSrc(s)), g.id + ' 截图缺失: ' + s);
    assert.ok(a.header !== a.portrait, g.id + ' header 与 portrait 不得混用同一文件');
  }
});

function fileSrc(url) {
  // vite dev URL → 磁盘路径（assets/games/... 相对 client/）
  const m = url.match(/assets\/games\/(.+)$/);
  assert.ok(m, '素材 URL 应含 assets/games/: ' + url);
  return fileURLToPath(new URL('../src/assets/games/' + m[1], import.meta.url));
}

function readSrc(rel) {
  return readFileSync(fileURLToPath(new URL('../' + rel, import.meta.url)), 'utf8');
}
