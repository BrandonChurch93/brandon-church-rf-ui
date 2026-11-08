// Landing beats: the Guide view registers its progress fill and status chip here, and the mode
// transition plays them after it lands in Brandon's Mode (docs/06-motion.md, t = 1050 and 1200).
export interface LandingTargets {
  progressFill?: HTMLElement | null;
  chip?: HTMLElement | null;
}

let current: LandingTargets | null = null;

export function registerLanding(targets: LandingTargets) {
  current = targets;
  return () => {
    if (current === targets) current = null;
  };
}

export function getLanding(): LandingTargets | null {
  return current;
}
