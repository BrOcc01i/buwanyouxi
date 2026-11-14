#!/usr/bin/env node
// 9934 投稿执行器（人工授权后使用）
// 用法：
//   NW9934_TOKEN=xxx node submit.mjs --dry     仅本地校验，不上传
//   NW9934_TOKEN=xxx node submit.mjs           上传封面+展示图 → 创建草稿，结果写入 draft-result.json
//   NW9934_TOKEN=xxx node submit.mjs --review  按 draft-result.json 的精确 revision/content_hash 送审
// 依赖：Node 18+（全局 fetch）。令牌只从环境变量读取，不落盘、不打印。
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const BASE = 'https://9934.zrainbow1257.com';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.NW9934_TOKEN || '';
const DRY = process.argv.includes('--dry');
const REVIEW = process.argv.includes('--review');

const COVER = '01-cover.webp';
const DISPLAY = ['02-library.webp', '03-downloading.webp', '04-detail.webp', '05-gift.webp', '06-reveal.webp', '07-store-downloading.webp'];
const MAX_BYTES = 1400000;

const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const idem = s => 'nw9934-' + sha256(s).slice(0, 40);

function mediaFiles() {
  return [{ file: COVER, purpose: 'cover' }, ...DISPLAY.map(f => ({ file: f, purpose: 'display' }))].map(m => {
    const p = path.join(HERE, 'media', m.file);
    const buf = fs.readFileSync(p);
    return { ...m, buf, bytes: buf.length, sha256: sha256(buf), contentType: 'image/webp' };
  });
}

async function api(method, p, { body, raw, headers = {} } = {}) {
  const h = { Authorization: `Bearer ${TOKEN}`, ...headers };
  if (method !== 'GET') h['Idempotency-Key'] = idem(method + p + (raw ? sha256(raw) : JSON.stringify(body || {})));
  if (body && !raw) h['Content-Type'] = 'application/json';
  const res = await fetch(BASE + p, { method, headers: h, body: raw || (body ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* 非 JSON */ }
  return { status: res.status, ok: res.ok, json, text };
}

async function main() {
  const media = mediaFiles();
  const payload = JSON.parse(fs.readFileSync(path.join(HERE, 'payload.json'), 'utf8'));

  // --- 本地前置校验（无论 dry 与否都执行） ---
  let bad = 0;
  for (const m of media) {
    if (m.bytes > MAX_BYTES) { console.error(`❌ ${m.file} 超限 ${m.bytes} > ${MAX_BYTES}`); bad++; }
  }
  if (DISPLAY.length > 6) { console.error('❌ display 超过 6 项'); bad++; }
  if (payload.display_media_ids.length !== DISPLAY.length) { console.error('❌ payload.display_media_ids 数量与素材不一致'); bad++; }
  if (!/^https:\/\//.test(payload.url)) { console.error('❌ url 必须是 https'); bad++; }
  if (!/^https:\/\//.test(payload.source_url)) { console.error(`❌ source_url 未定稿：${payload.source_url}`); bad++; }
  if (payload.description.length < 8) { console.error('❌ description 至少 8 字'); bad++; }
  if (payload.description.length > 1000) { console.error('❌ description 超过 1000 字'); bad++; }
  if (payload.title.length > 60) { console.error('❌ title 超过 60 字'); bad++; }
  console.log(`素材 ${media.length} 项，合计 ${(media.reduce((s, m) => s + m.bytes, 0) / 1024).toFixed(0)} KB`);
  media.forEach(m => console.log(`  ${m.purpose.padEnd(7)} ${m.file.padEnd(28)} ${String(m.bytes).padStart(7)} B  ${m.sha256.slice(0, 12)}…`));
  if (bad) { console.error(`\n前置校验失败 ${bad} 项，已停止。`); process.exit(2); }

  if (DRY) { console.log('\n--dry 模式：校验通过，未发起任何网络请求。'); return; }
  if (!TOKEN) { console.error('\n缺少 NW9934_TOKEN 环境变量（在 9934 的 Agent 授权页签发后取得）。'); process.exit(2); }

  // --- 送审：复用上次草稿的精确 revision/content_hash ---
  if (REVIEW) {
    const d = JSON.parse(fs.readFileSync(path.join(HERE, 'draft-result.json'), 'utf8'));
    const r = await api('POST', '/api/v1/reviews', {
      body: { target_type: 'submission', target_id: d.target_id, revision: d.revision, content_hash: d.content_hash },
    });
    console.log('送审:', r.status, JSON.stringify(r.json ?? r.text).slice(0, 500));
    if (!r.ok) process.exit(1);
    fs.writeFileSync(path.join(HERE, 'review-result.json'), JSON.stringify(r.json, null, 2));
    console.log('已写入 review-result.json');
    return;
  }

  // --- 1) 上传媒体 ---
  const ids = {};
  for (const m of media) {
    const slot = await api('POST', '/api/v1/media/uploads', {
      body: { purpose: m.purpose, content_type: m.contentType, declared_bytes: m.bytes },
    });
    if (!slot.ok) { console.error(`上传预留失败 ${m.file}:`, slot.status, slot.text.slice(0, 300)); process.exit(1); }
    const { upload_id, content_path } = slot.json;

    const put = await fetch(BASE + content_path, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': m.contentType },
      body: m.buf,
    });
    if (!put.ok) { console.error(`上传内容失败 ${m.file}:`, put.status, (await put.text()).slice(0, 300)); process.exit(1); }

    const done = await api('POST', `/api/v1/media/uploads/${upload_id}/complete`, { body: { sha256: m.sha256 } });
    if (!done.ok) { console.error(`完成上传失败 ${m.file}:`, done.status, done.text.slice(0, 300)); process.exit(1); }
    ids[m.file] = done.json.media_id;
    console.log(`✅ ${m.file} → ${done.json.media_id} (${done.json.width}×${done.json.height}, ${done.json.content_type})`);
  }

  // --- 2) 创建草稿 ---
  const content = { ...payload };
  delete content._note;
  content.cover_media_id = ids[COVER];
  content.display_media_ids = DISPLAY.map(f => ids[f]);

  const created = await api('POST', '/api/v1/submissions', { body: content });
  if (!created.ok) { console.error('创建稿件失败:', created.status, created.text.slice(0, 600)); process.exit(1); }
  const j = created.json;
  const out = {
    target_id: j.target_id, revision: j.active_revision ?? j.revision,
    content_hash: (j.latest && j.latest.content_hash) || j.content_hash,
    game_id: j.game_id, raw: j,
  };
  fs.writeFileSync(path.join(HERE, 'draft-result.json'), JSON.stringify(out, null, 2));
  console.log('✅ 草稿已创建:', JSON.stringify(out).slice(0, 400));
  console.log('下一步：人工核对草稿后执行 node submit.mjs --review 送审。');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
