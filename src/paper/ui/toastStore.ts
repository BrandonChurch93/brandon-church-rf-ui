// Toasts: max three visible, newest at the bottom. Undo toasts live 6 s, plain ones 4 s, danger ones
// until dismissed. Hover or focus pauses every timer.
import { create } from 'zustand';
import { announce } from '@/paper/lib/announce';

export type ToastTone = 'neutral' | 'success' | 'danger';

import type { UndoToken } from '@/store/undo';
export type { UndoToken };

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  action?: { label: string; ariaLabel?: string; run: () => void };
  undo?: UndoToken;
  duration: number | null;
  remaining: number | null;
  startedAt: number;
  leaving?: boolean;
}

interface ToastState {
  toasts: Toast[];
  paused: boolean;
  push(t: Omit<Toast, 'id' | 'startedAt' | 'remaining'>): number;
  dismiss(id: number): void;
  remove(id: number): void;
  setPaused(p: boolean): void;
}

const MAX = 3;
let counter = 0;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  paused: false,
  push(t) {
    const id = ++counter;
    const toast: Toast = { ...t, id, startedAt: performance.now(), remaining: t.duration };
    let list = [...get().toasts.filter((x) => !x.leaving), toast];
    const overflow = list.length - MAX;
    if (overflow > 0) {
      const drop = new Set(list.slice(0, overflow).map((x) => x.id));
      list = list.filter((x) => !drop.has(x.id));
    }
    set({ toasts: [...get().toasts.filter((x) => x.leaving), ...list] });
    announce(t.undo ? `${t.message}. Undo is available.` : t.message);
    return id;
  },
  dismiss(id) {
    set({ toasts: get().toasts.map((x) => (x.id === id ? { ...x, leaving: true } : x)) });
    window.setTimeout(() => get().remove(id), 240);
  },
  remove(id) {
    set({ toasts: get().toasts.filter((x) => x.id !== id) });
  },
  setPaused(paused) {
    const now = performance.now();
    set({
      paused,
      toasts: get().toasts.map((x) => {
        if (x.remaining === null) return x;
        if (paused) return { ...x, remaining: Math.max(0, (x.remaining ?? 0) - (now - x.startedAt)) };
        return { ...x, startedAt: now };
      }),
    });
  },
}));

export const toast = Object.assign(
  (message: string, opts: { tone?: ToastTone; action?: Toast['action'] } = {}) =>
    useToasts.getState().push({ tone: opts.tone ?? 'neutral', message, action: opts.action, duration: opts.tone === 'danger' ? null : 4000 }),
  {
    success: (message: string) => useToasts.getState().push({ tone: 'success', message, duration: 4000 }),
    danger: (message: string) => useToasts.getState().push({ tone: 'danger', message, duration: null }),
    /** "Removed Jane Doe" with an Undo button for 6 s. */
    undo: (message: string, token: UndoToken, undoLabel?: string) =>
      useToasts.getState().push({ tone: 'neutral', message, undo: token, duration: 6000, action: { label: 'Undo', ariaLabel: undoLabel ?? `Undo: ${message}`, run: () => runUndo(token) } }),
  },
);

function runUndo(token: UndoToken) {
  token.undo();
  toast('Restored');
}

/** Cmd or Ctrl+Z: undo the newest action whose toast is still on screen. */
export function undoLatest() {
  const live = useToasts.getState().toasts.filter((t) => t.undo && !t.leaving);
  const last = live[live.length - 1];
  if (!last?.undo) return false;
  useToasts.getState().dismiss(last.id);
  runUndo(last.undo);
  return true;
}
