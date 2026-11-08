import { useCallback, useEffect, useRef, useState } from 'react';
import { isReducedMotion } from '@/motion/reduced';

export type SaveState = 'idle' | 'loading' | 'success';

/**
 * The save choreography: a short simulated save (spinner), the success morph (check), then done.
 * Exists only to make the success legible (05, Loading).
 */
export function useSaveFlow(opts: { loadingMs?: number; successMs?: number } = {}) {
  const { loadingMs = 400, successMs = 300 } = opts;
  const [state, setState] = useState<SaveState>('idle');
  const timers = useRef<number[]>([]);
  const pending = useRef<(() => void) | null>(null);
  // Leaving mid-save (navigating away) still saves: the beat is cosmetic, the change is not.
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      pending.current?.();
    },
    [],
  );
  const run = useCallback(
    (apply: () => void, done?: () => void) => {
      if (state !== 'idle') return;
      const quick = isReducedMotion();
      setState('loading');
      pending.current = apply;
      timers.current.push(
        window.setTimeout(
          () => {
            pending.current = null;
            apply();
            setState('success');
            timers.current.push(
              window.setTimeout(
                () => {
                  done?.();
                  timers.current.push(window.setTimeout(() => setState('idle'), 600));
                },
                quick ? 80 : successMs,
              ),
            );
          },
          quick ? 120 : loadingMs,
        ),
      );
    },
    [state, loadingMs, successMs],
  );
  return { state, run, loading: state === 'loading', success: state === 'success' };
}
