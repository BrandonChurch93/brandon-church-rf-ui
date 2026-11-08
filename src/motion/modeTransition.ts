// "Pull back · rise": the mode transition (docs/06-motion.md). The outgoing page becomes a card that
// recedes and dissolves while the incoming page rises and fades in, so two solid pages are never on
// screen together. One GSAP timeline; the stage keeps a handle so tests can pause and seek it.
import { gsap } from 'gsap';
import type { LandingTargets } from './landing';

export const MAX_PARTS = 6;
export const CARD_CLASS = 'is-card';

export interface ModeTransitionInput {
  outgoing: HTMLElement;
  incoming: HTMLElement;
  dim: HTMLElement;
  parts: HTMLElement[];
  landing: LandingTargets | null;
  reduced: boolean;
  onComplete: () => void;
}

const LAYER_PROPS = 'transform,opacity,zIndex,willChange,transformOrigin,translate,rotate,scale';

export function buildModeTransition({ outgoing, incoming, dim, parts, landing, reduced, onComplete }: ModeTransitionInput) {
  incoming.scrollTop = 0;
  const cleanup = () => {
    outgoing.classList.remove(CARD_CLASS);
    gsap.set([outgoing, incoming], { clearProps: LAYER_PROPS });
    if (parts.length) gsap.set(parts, { clearProps: 'transform,opacity,willChange' });
    if (landing?.progressFill) gsap.set(landing.progressFill, { clearProps: 'width' });
    if (landing?.chip) gsap.set(landing.chip, { clearProps: 'transform,opacity' });
    gsap.set(dim, { opacity: 0 });
    onComplete();
  };

  if (reduced) {
    // A plain crossfade: incoming fades in over 250 ms while outgoing fades out over 200 ms.
    gsap.set(outgoing, { zIndex: 2, willChange: 'opacity' });
    gsap.set(incoming, { zIndex: 1, willChange: 'opacity', opacity: 0 });
    const tl = gsap.timeline({ paused: true, onComplete: cleanup });
    tl.to(outgoing, { opacity: 0, duration: 0.2, ease: 'none' }, 0).to(incoming, { opacity: 1, duration: 0.25, ease: 'none' }, 0);
    return tl;
  }

  // Setup, synchronous, before the timeline plays.
  outgoing.classList.add(CARD_CLASS);
  gsap.set(outgoing, { zIndex: 2, willChange: 'transform, opacity', transformOrigin: '50% 40%' });
  gsap.set(incoming, { zIndex: 1, willChange: 'transform, opacity', opacity: 0, scale: 0.97, y: 56 });
  if (parts.length) gsap.set(parts, { y: 20, opacity: 0 });
  gsap.set(dim, { opacity: 0 });

  const tl = gsap.timeline({ paused: true, onComplete: cleanup });
  tl.to(dim, { opacity: 0.8, duration: 0.5, ease: 'sine.out' }, 0)
    .to(outgoing, { scale: 0.88, y: -30, rotateX: 7, duration: 1.4, ease: 'power2.out' }, 0)
    .to(outgoing, { opacity: 0, duration: 0.9, ease: 'power1.inOut' }, 0.1)
    .to(incoming, { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power3.out' }, 0.3)
    .to(dim, { opacity: 0, duration: 0.9, ease: 'sine.inOut' }, 0.7);
  if (parts.length) tl.to(parts, { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', stagger: 0.07 }, 0.45);

  const fill = landing?.progressFill;
  if (fill) {
    const target = fill.style.width || getComputedStyle(fill).width;
    tl.fromTo(fill, { width: '0%' }, { width: target, duration: 0.9, ease: 'power3.out' }, 1.05);
  }
  if (landing?.chip) {
    tl.fromTo(landing.chip, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.2)' }, 1.2);
  }
  return tl;
}

/** The incoming layer's parts in DOM order, visible ones only, at most six. */
export function collectParts(layer: HTMLElement): HTMLElement[] {
  const vh = window.innerHeight;
  return Array.from(layer.querySelectorAll<HTMLElement>('[data-part]'))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < vh && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
    })
    .slice(0, MAX_PARTS);
}
