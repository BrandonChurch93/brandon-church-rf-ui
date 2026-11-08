import { useSyncExternalStore } from 'react';

// Faithful mode's own tiny media hook (it never imports from Brandon's Mode).
// True below 900 px, where the rail and sidebar become a drawer.
const QUERY = '(max-width: 899px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useNarrowViewport() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
