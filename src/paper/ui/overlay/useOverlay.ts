import { useEffect, useId, useLayoutEffect, useRef, type RefObject } from 'react';
import { layerStack } from '@/app/layerStack';
import { focusables, trapTab } from '@/paper/hooks/focus';

export interface OverlayOptions {
  /** True while the overlay is mounted and logically open. */
  open: boolean;
  onClose: (opts?: { instant?: boolean }) => void;
  container: RefObject<HTMLElement | null>;
  /** Elements that count as "inside" for outside-click detection (the trigger). */
  anchor?: RefObject<HTMLElement | null>;
  stepAside?: boolean;
  trap?: boolean;
  lockScroll?: boolean;
  closeOnOutside?: boolean;
  /** 'first' focuses the first focusable; 'container' focuses the panel itself; a ref focuses that element. */
  initialFocus?: 'first' | 'container' | 'none' | RefObject<HTMLElement | null>;
  returnFocus?: boolean;
}

let scrollLocks = 0;
function setScrollLock(on: boolean) {
  scrollLocks = Math.max(0, scrollLocks + (on ? 1 : -1));
  const layer = document.querySelector<HTMLElement>('[data-layer="paper"]');
  layer?.classList.toggle('is-scroll-locked', scrollLocks > 0);
}

/** Shared behavior for every layer: stack membership, Escape, focus trap, return focus, outside click, scroll lock. */
export function useOverlay(o: OverlayOptions) {
  const id = useId();
  const returnTo = useRef<HTMLElement | null>(null);
  const opts = useRef(o);
  opts.current = o;

  useLayoutEffect(() => {
    if (!o.open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    layerStack.push({ id, close: (c) => opts.current.onClose(c), stepAside: Boolean(o.stepAside) });
    if (o.lockScroll) setScrollLock(true);

    const focusInitial = () => {
      const el = opts.current.container.current;
      if (!el) return false;
      const f = opts.current.initialFocus ?? 'first';
      if (f === 'none') return true;
      if (f === 'container') el.focus({ preventScroll: true });
      else if (f === 'first') (focusables(el)[0] ?? el).focus({ preventScroll: true });
      else (f.current ?? el).focus({ preventScroll: true });
      return el.contains(document.activeElement);
    };
    // Focus now so the first keystroke lands inside; retry next frame if the content is not ready yet.
    const raf = focusInitial() ? 0 : requestAnimationFrame(() => void focusInitial());

    return () => {
      cancelAnimationFrame(raf);
      layerStack.remove(id);
      if (o.lockScroll) setScrollLock(false);
      const el = opts.current.container.current;
      const active = document.activeElement;
      const focusWasInside = !active || active === document.body || (el && el.contains(active));
      const target = returnTo.current;
      // After the commit: React restores its own saved focus at the end of the commit, so a focus
      // call made during this cleanup would be undone.
      if ((opts.current.returnFocus ?? true) && focusWasInside && target)
        queueMicrotask(() => {
          if (target.isConnected) target.focus({ preventScroll: true });
        });
    };
    // Registration follows the open flag only; the latest options are read through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.open, id]);

  useEffect(() => {
    if (!o.open) return;
    layerStack.update(id, { stepAside: Boolean(o.stepAside) });
  }, [o.open, o.stepAside, id]);

  // Attached in the same commit as the layer, so an Escape pressed right away is never missed.
  useLayoutEffect(() => {
    if (!o.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!layerStack.isTop(id)) return;
      const el = opts.current.container.current;
      if (e.key === 'Escape') {
        if (e.defaultPrevented) return;
        e.preventDefault();
        e.stopPropagation();
        opts.current.onClose();
        return;
      }
      if (opts.current.trap && el) trapTab(e, el);
    };
    const onDown = (e: PointerEvent) => {
      if (!opts.current.closeOnOutside || !layerStack.isTop(id)) return;
      const t = e.target as Node;
      const el = opts.current.container.current;
      const anchor = opts.current.anchor?.current;
      if (el?.contains(t) || anchor?.contains(t)) return;
      opts.current.onClose();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [o.open, id]);

  return id;
}
