// Theme: data-theme on <html>, resolved from the stored preference ('system' tracks the OS).
// Only Brandon's Mode reads the tokens; faithful mode never changes with theme.
import { useEffect } from 'react';
import { useStore } from '@/store/store';
import type { ThemePref } from '@/store/types';
import { isReducedMotion } from '@/motion/reduced';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  return pref;
}

function setRootTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

/**
 * Applies a theme with the designed switch: a circular reveal from the control's position when the
 * View Transitions API exists, otherwise a 320 ms color crossfade on every Paper element.
 */
export function applyThemeAnimated(theme: 'light' | 'dark', origin?: { x: number; y: number }) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  const doc = document as ViewTransitionDoc;
  if (isReducedMotion()) {
    setRootTheme(theme);
    return;
  }
  // The circular reveal runs only for a user's own switch (it has an origin); OS changes crossfade.
  if (doc.startViewTransition && origin) {
    const { x, y } = origin;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = doc.startViewTransition(() => setRootTheme(theme));
    vt.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => undefined);
    return;
  }
  root.classList.add('theme-fading');
  setRootTheme(theme);
  window.setTimeout(() => root.classList.remove('theme-fading'), 320);
}

let pendingOrigin: { x: number; y: number } | undefined;
/** Call just before setTheme from a control so the reveal starts at that control. */
export function setThemeOrigin(origin: { x: number; y: number } | undefined) {
  pendingOrigin = origin;
}

/** Keeps <html data-theme> in sync with the store, animating user-initiated changes. */
export function useThemeSync() {
  const pref = useStore((s) => s.ui.theme);
  useEffect(() => {
    const first = !document.documentElement.dataset.themeReady;
    const apply = () => {
      const theme = resolveTheme(pref);
      if (first) setRootTheme(theme);
      else applyThemeAnimated(theme, pendingOrigin);
      pendingOrigin = undefined;
      document.documentElement.dataset.themeReady = 'true';
    };
    apply();
    if (pref !== 'system') return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => applyThemeAnimated(resolveTheme('system'));
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [pref]);
}
