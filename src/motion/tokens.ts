// Motion tokens in seconds for GSAP, mirroring src/styles/tokens.scss ($motion).
export const dur = {
  xs: 0.12,
  sm: 0.2,
  md: 0.32,
  lg: 0.48,
  hoverIn: 0.42,
  hoverOut: 0.56,
  xl: 0.7,
} as const;

export const ease = {
  out: 'power3.out',
  in: 'power2.in',
  inOut: 'power2.inOut',
  camera: 'power2.inOut',
  fade: 'power1.inOut',
  pillEntrance: 'back.out(1.6)',
  pop: 'back.out(2.2)',
  release: 'elastic.out(1, 0.5)',
  // CSS equivalents for inline transitions
  cssOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  cssIn: 'cubic-bezier(0.64, 0, 0.78, 0)',
  cssInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

// Reduced motion: anything over 200 ms becomes a 150 ms crossfade.
export const REDUCED_FADE = 0.15;
