import { useCallback, useSyncExternalStore } from 'react';

export const ROUTES = ['guide', 'attendees', 'attendee-types', 'packages', 'reg-codes', 'discounts', 'content', 'exhibitors'] as const;
export type Route = (typeof ROUTES)[number];

export function parseHash(hash: string): Route | null {
  const h = hash.replace(/^#/, '');
  if (h === '') return null;
  return (ROUTES as readonly string[]).includes(h) ? (h as Route) : null;
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

/** The active view from location.hash. Unknown or empty hashes read as Guide. */
export function useHashRoute(): [Route, (r: Route) => void] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  const route = parseHash(hash) ?? 'guide';
  const navigate = useCallback((r: Route) => {
    if (window.location.hash !== `#${r}`) window.location.hash = r;
  }, []);
  return [route, navigate];
}

/** On entering Brandon's Mode: keep a valid hash, rewrite anything else to #guide. */
export function normalizeHash() {
  if (!parseHash(window.location.hash)) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}#guide`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}
