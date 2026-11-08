import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PresenceState = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Keeps an element mounted through its exit animation. Returns `mounted` and a `state` to put on a
 * data attribute: 'opening' renders the from-state for one frame, 'open' animates in, 'closing' animates out.
 */
export function usePresence(open: boolean, exitMs: number) {
  const [state, setState] = useState<PresenceState>(open ? 'opening' : 'closed');
  const timer = useRef<number | null>(null);
  const instantClose = useRef(false);

  useLayoutEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (open) {
      setState((s) => (s === 'open' ? s : 'opening'));
    } else {
      setState((s) => {
        if (s === 'closed') return s;
        if (instantClose.current) return 'closed';
        return 'closing';
      });
    }
  }, [open]);

  useEffect(() => {
    if (state === 'opening') {
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setState((s) => (s === 'opening' ? 'open' : s)));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    if (state === 'closing') {
      timer.current = window.setTimeout(() => setState('closed'), exitMs);
      return () => {
        if (timer.current) window.clearTimeout(timer.current);
      };
    }
    if (state === 'closed') instantClose.current = false;
  }, [state, exitMs]);

  return {
    mounted: state !== 'closed',
    state,
    /** Call before setting open=false to skip the exit animation. */
    skipExit: () => {
      instantClose.current = true;
    },
  };
}
