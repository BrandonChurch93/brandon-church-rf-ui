// Persistence for the store: localStorage under one key, writes debounced by 200 ms,
// and an in-memory fallback when storage is unavailable (private mode, quota, disabled).
import type { StateStorage } from 'zustand/middleware';

export const STORAGE_KEY = 'rf-ui.v1';
const WRITE_DEBOUNCE_MS = 200;

let fallback = false;
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function probe(): boolean {
  try {
    const k = '__rf_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function storageIsFallback() {
  return fallback;
}
export function onStorageFallback(fn: () => void) {
  listeners.add(fn);
  if (fallback) fn();
  return () => listeners.delete(fn);
}
function goFallback() {
  if (fallback) return;
  fallback = true;
  listeners.forEach((fn) => fn());
}

let pending: { name: string; value: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  timer = null;
  if (!pending) return;
  const { name, value } = pending;
  pending = null;
  if (fallback) {
    memory.set(name, value);
    return;
  }
  try {
    window.localStorage.setItem(name, value);
  } catch {
    memory.set(name, value);
    goFallback();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
}

export const debouncedStorage: StateStorage = {
  getItem(name) {
    if (!fallback && !probe()) goFallback();
    if (fallback) return memory.get(name) ?? null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      goFallback();
      return memory.get(name) ?? null;
    }
  },
  setItem(name, value) {
    pending = { name, value };
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, WRITE_DEBOUNCE_MS);
  },
  removeItem(name) {
    pending = null;
    memory.delete(name);
    try {
      window.localStorage.removeItem(name);
    } catch {
      goFallback();
    }
  },
};

/** Writes any pending state immediately (used before reloads in tests and on reset). */
export function flushStorage() {
  if (timer) clearTimeout(timer);
  flush();
}
