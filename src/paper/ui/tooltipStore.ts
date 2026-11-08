// One tooltip on screen at a time, shown after 400 ms, or immediately when moving from one tooltip
// to the next (docs/05 Tooltip). Hidden on scroll and Escape.
import { useSyncExternalStore, type ReactNode } from 'react';
import type { Placement } from './overlay/position';

export interface TipState {
  key: number;
  content: ReactNode;
  anchor: HTMLElement;
  placement: Placement;
}

const SHOW_DELAY = 400;
const WARM_WINDOW = 300;

let state: TipState | null = null;
let timer: number | null = null;
let lastVisibleAt = 0;
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const tooltip = {
  show(anchor: HTMLElement, content: ReactNode, placement: Placement, opts: { immediate?: boolean } = {}) {
    if (timer) window.clearTimeout(timer);
    const warm = state !== null || performance.now() - lastVisibleAt < WARM_WINDOW;
    const open = () => {
      state = { key: ++counter, anchor, content, placement };
      emit();
    };
    if (opts.immediate || warm) open();
    else timer = window.setTimeout(open, SHOW_DELAY);
  },
  hide(anchor?: HTMLElement) {
    if (timer) window.clearTimeout(timer);
    timer = null;
    if (!state || (anchor && state.anchor !== anchor)) return;
    state = null;
    lastVisibleAt = performance.now();
    emit();
  },
  /** Updates the content of the visible tooltip for this anchor (e.g. "Copied"). */
  update(anchor: HTMLElement, content: ReactNode) {
    if (state && state.anchor === anchor) {
      state = { ...state, content };
      emit();
    }
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get: () => state,
};

export function useTooltipState() {
  return useSyncExternalStore(tooltip.subscribe, tooltip.get, () => null);
}
