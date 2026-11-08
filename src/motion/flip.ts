// Helpers around GSAP Flip for list reflows (cards added or removed, toasts shifting, reorders).
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { isReducedMotion } from './reduced';

gsap.registerPlugin(Flip);
export { Flip, gsap };

/**
 * After every render where `key` changes, animates the container's children from where they were to
 * where they are now. Children must carry `data-flip-id`. New children fade and scale in.
 */
export function useFlipList(container: RefObject<HTMLElement | null>, key: unknown, opts: { duration?: number; ease?: string; enter?: boolean; delay?: number } = {}) {
  const last = useRef<Flip.FlipState | null>(null);
  const { duration = 0.48, ease = 'power2.inOut', enter = true, delay = 0 } = opts;
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>(':scope > [data-flip-id]'));
    if (last.current && !isReducedMotion()) {
      Flip.from(last.current, {
        targets,
        duration,
        ease,
        delay,
        absolute: false,
        nested: true,
        prune: true,
        onEnter: enter
          ? (els: Element[]) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.42, ease: 'power3.out', delay: 0.08, clearProps: 'transform,opacity' })
          : undefined,
        onComplete: () => gsap.set(targets, { clearProps: 'transform' }),
      });
    }
    last.current = Flip.getState(targets, { props: 'opacity' });
    // `key` is the signal that the list changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Animates an element out (scale 0.96, fade) before it is removed. */
export function animateOut(el: HTMLElement | null, done: () => void) {
  if (!el || isReducedMotion()) return done();
  gsap.to(el, { scale: 0.96, opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: done });
}

/** A brief accent flash on a saved or newly added record. */
export function flash(el: HTMLElement | null, kind: 'border' | 'bg' = 'bg') {
  if (!el) return;
  el.classList.remove('rf-flash', 'rf-flash-border');
  void el.offsetWidth;
  el.classList.add(kind === 'border' ? 'rf-flash-border' : 'rf-flash');
  window.setTimeout(() => el.classList.remove('rf-flash', 'rf-flash-border'), 1300);
}
