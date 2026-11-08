// Reduced motion: the user's explicit setting wins; otherwise follow the system.
import { useSyncExternalStore } from 'react';
import { useStore } from '@/store/store';

const QUERY = '(prefers-reduced-motion: reduce)';

function systemPrefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

export function isReducedMotion(): boolean {
  const pref = useStore.getState().ui.reduceMotion;
  return pref ?? systemPrefersReduced();
}

function subscribeSystem(fn: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', fn);
  return () => mql.removeEventListener('change', fn);
}

export function useSystemReducedMotion() {
  return useSyncExternalStore(subscribeSystem, systemPrefersReduced, () => false);
}

export function useReducedMotion(): boolean {
  const pref = useStore((s) => s.ui.reduceMotion);
  const system = useSystemReducedMotion();
  return pref ?? system;
}
