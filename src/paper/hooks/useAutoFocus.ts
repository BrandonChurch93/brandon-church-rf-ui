import { useLayoutEffect, useRef } from 'react';
import { useBreakpoint } from './useMediaQuery';

/**
 * Focus a field when it mounts, without scrolling its ancestors (sheets are still sliding in), and
 * only on pointer layouts: on touch layouts a sheet opens with focus on itself so the on-screen
 * keyboard does not cover it before the person has seen the form (D-25).
 */
export function useAutoFocus<T extends HTMLElement>(enabled: boolean | undefined) {
  const ref = useRef<T | null>(null);
  const { isMobile } = useBreakpoint();
  useLayoutEffect(() => {
    if (enabled && !isMobile) ref.current?.focus({ preventScroll: true });
    // Mount only: a field focuses once when it appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}
