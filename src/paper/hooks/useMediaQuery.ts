import { useSyncExternalStore } from 'react';

// Breakpoints mirror src/styles/mixins.scss (max-width based, cascading down).
export const BP = { lg: 1199, md: 899, sm: 599 } as const;

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** isLg: 1199 and below. isMd: 899 and below (the mobile shell). isSm: 599 and below. */
export function useBreakpoint() {
  const isLg = useMediaQuery(`(max-width: ${BP.lg}px)`);
  const isMd = useMediaQuery(`(max-width: ${BP.md}px)`);
  const isSm = useMediaQuery(`(max-width: ${BP.sm}px)`);
  const isTouch = useMediaQuery('(hover: none)');
  return { isLg, isMd, isSm, isMobile: isMd, isTouch };
}
