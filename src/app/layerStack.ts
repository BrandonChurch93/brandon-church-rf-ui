// The stack of open overlay layers (sheets, modals, menus, popovers, the palette, the drawer).
// Escape closes the topmost layer; the pill steps aside while any layer that claims the corner is open;
// the mode transition closes everything instantly at t = 0.
import { useSyncExternalStore } from 'react';

export interface LayerEntry {
  id: string;
  /** Close the layer. `instant` skips the exit animation. */
  close: (opts?: { instant?: boolean }) => void;
  /** True for layers that would collide with the pill (sheets, modals, palette, drawer, mobile bulk bar). */
  stepAside: boolean;
  /** Layers that handle Escape themselves (inline editors) can opt out of the global handler. */
  handlesEscape?: boolean;
}

let stack: LayerEntry[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const layerStack = {
  push(entry: LayerEntry) {
    stack = [...stack.filter((e) => e.id !== entry.id), entry];
    emit();
  },
  update(id: string, patch: Partial<LayerEntry>) {
    stack = stack.map((e) => (e.id === id ? { ...e, ...patch } : e));
    emit();
  },
  remove(id: string) {
    const next = stack.filter((e) => e.id !== id);
    if (next.length === stack.length) return;
    stack = next;
    emit();
  },
  top(): LayerEntry | undefined {
    return stack[stack.length - 1];
  },
  isTop(id: string) {
    return stack[stack.length - 1]?.id === id;
  },
  size() {
    return stack.length;
  },
  closeAll(opts?: { instant?: boolean }) {
    [...stack].reverse().forEach((e) => e.close(opts));
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  snapshot() {
    return stack;
  },
};

/** Extra reasons for the pill to step aside that are not layers (mobile selection mode). */
let asideReasons = new Set<string>();
export function setPillAside(reason: string, on: boolean) {
  const next = new Set(asideReasons);
  if (on) next.add(reason);
  else next.delete(reason);
  asideReasons = next;
  emit();
}

function stepAsideSnapshot() {
  return stack.some((e) => e.stepAside) || asideReasons.size > 0;
}

export function usePillStepAside() {
  return useSyncExternalStore(layerStack.subscribe, stepAsideSnapshot, () => false);
}

export function useLayerCount() {
  return useSyncExternalStore(layerStack.subscribe, () => stack.length, () => 0);
}
