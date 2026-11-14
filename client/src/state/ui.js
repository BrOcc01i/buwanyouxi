// UI 局部状态：库左侧栏当前选中项（null = 库主页）
// 不持久化 —— 每次启动都回到库主页，与 Steam 行为一致
'use strict';
import { GAMES } from '../data/games.js';
import { isCategoryKey } from '../data/categories.js';

const GAME_IDS = new Set(GAMES.map(g => g.id));
let selectedGameId = null;
const listeners = new Set();

export function getSelectedGame() {
  return selectedGameId;
}

export function setSelectedGame(id) {
  const next = (typeof id === 'string' && GAME_IDS.has(id)) ? id : null;
  if (next === selectedGameId) return;
  selectedGameId = next;
  listeners.forEach(fn => { try { fn(selectedGameId); } catch (e) { /* 忽略订阅异常 */ } });
}

export function subscribeSelection(fn) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/* ---- 批次 3：左侧栏筛选/排序（§4.3）——UI 态，不持久化 ---- */
export const SIDEBAR_FILTERS = ['all', 'installed', 'notinstalled'];
export const SIDEBAR_SORTS = ['default', 'recent'];
let sidebarFilter = 'all';   // all | installed | notinstalled
let sidebarSort = 'default'; // default | recent
const sidebarListeners = new Set();

export function getSidebarFilter() { return sidebarFilter; }
export function getSidebarSort() { return sidebarSort; }

export function setSidebarFilter(v) {
  if (!SIDEBAR_FILTERS.includes(v) || v === sidebarFilter) return;
  sidebarFilter = v;
  sidebarListeners.forEach(fn => { try { fn(); } catch (e) { /* 忽略 */ } });
}

export function setSidebarSort(v) {
  if (!SIDEBAR_SORTS.includes(v) || v === sidebarSort) return;
  sidebarSort = v;
  sidebarListeners.forEach(fn => { try { fn(); } catch (e) { /* 忽略 */ } });
}

export function subscribeSidebar(fn) {
  sidebarListeners.add(fn);
  return () => { sidebarListeners.delete(fn); };
}

/* ---- 批次 6：商店分类筛选（UI 态，不持久化、不进导出） ---- */
let storeCategory = 'all';   // 'all' | CATEGORY_KEYS 之一
const storeCatListeners = new Set();

export function getStoreCategory() { return storeCategory; }

export function setStoreCategory(v) {
  if (v !== 'all' && !isCategoryKey(v)) return;   // 非法值静默忽略
  if (v === storeCategory) return;
  storeCategory = v;
  storeCatListeners.forEach(fn => { try { fn(); } catch (e) { /* 忽略 */ } });
}

export function subscribeStoreCategory(fn) {
  storeCatListeners.add(fn);
  return () => { storeCatListeners.delete(fn); };
}
