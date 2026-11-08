// The pill's entrance and its idle attention beats (docs/06-motion.md, "The pill").
import { gsap } from 'gsap';

export const PILL_SHADOW_REST = '0 10px 30px rgba(92,0,220,0.35), 0 2px 6px rgba(92,0,220,0.25)';
const PILL_SHADOW_PEAK = '0 14px 40px rgba(92,0,220,0.55), 0 2px 6px rgba(92,0,220,0.3)';

/** Rises in from below the viewport edge, 800 ms after the page is interactive. */
export function pillEntrance(dock: HTMLElement, onComplete: () => void) {
  gsap.set(dock, { yPercent: 140, opacity: 0 });
  return gsap.to(dock, {
    yPercent: 0,
    opacity: 1,
    duration: 0.9,
    delay: 0.8,
    ease: 'back.out(1.6)',
    onComplete: () => {
      gsap.set(dock, { clearProps: 'opacity' });
      onComplete();
    },
  });
}

/** One 4.2 s cycle, repeated until the first click: shadow breath, ring pulse, light sweep and a glyph turn. */
export function pillIdle(parts: { pill: HTMLElement; ring: HTMLElement; sweep: HTMLElement; glyph: HTMLElement }) {
  const { pill, ring, sweep, glyph } = parts;
  const tl = gsap.timeline({ repeat: -1 });
  tl.to(pill, { boxShadow: PILL_SHADOW_PEAK, duration: 1.6, ease: 'sine.inOut' }, 0)
    .to(pill, { boxShadow: PILL_SHADOW_REST, duration: 1.6, ease: 'sine.inOut' }, 1.6)
    .fromTo(ring, { scale: 1, opacity: 0.8 }, { scale: 1.9, opacity: 0, duration: 1.4, ease: 'power2.out' }, 0.2)
    .fromTo(sweep, { xPercent: -60 }, { xPercent: 60, duration: 0.9, ease: 'power2.inOut' }, 3.0)
    .to(glyph, { rotate: '+=90', duration: 0.5, ease: 'back.out(2)' }, 3.0)
    .to({}, { duration: 0 }, 4.2);
  return tl;
}

export function stopPillIdle(tl: gsap.core.Timeline | null, parts: { pill: HTMLElement; ring: HTMLElement; sweep: HTMLElement }) {
  tl?.kill();
  gsap.set(parts.ring, { opacity: 0, scale: 1 });
  gsap.set(parts.sweep, { xPercent: -60 });
  gsap.to(parts.pill, { boxShadow: PILL_SHADOW_REST, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
}

/** The click's hard ripple. */
export function pillRipple(ring: HTMLElement) {
  return gsap.fromTo(ring, { scale: 1, opacity: 1 }, { scale: 2.6, opacity: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
}
