import { useEffect, useRef } from 'react';

export const isMac = () =>
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad/i.test((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? '');

/** True when focus is in a place where typing should not trigger shortcuts. */
export function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
}

/** Listens for a key combination. `mod` means Cmd or Ctrl. */
export function useHotkey(
  combo: { key: string; mod?: boolean; shift?: boolean },
  handler: (e: KeyboardEvent) => void,
  opts: { enabled?: boolean; allowInInputs?: boolean } = {},
) {
  const ref = useRef(handler);
  ref.current = handler;
  const { enabled = true, allowInInputs = false } = opts;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== combo.key.toLowerCase()) return;
      // Cmd on Mac, Ctrl elsewhere; either is accepted so a keyboard on any platform works.
      const mod = e.metaKey || e.ctrlKey;
      if (Boolean(combo.mod) !== mod) return;
      if (combo.shift !== undefined && combo.shift !== e.shiftKey) return;
      if (!allowInInputs && isTypingTarget(e.target)) return;
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo.key, combo.mod, combo.shift, enabled, allowInInputs]);
}
