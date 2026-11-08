// Screen reader announcements: one polite region (toasts, drag results, copy, "Saved") and one
// assertive region reserved for blocking errors. The Paper shell renders both regions.
type Politeness = 'polite' | 'assertive';
const listeners = new Set<(msg: string, p: Politeness) => void>();

export function announce(message: string, politeness: Politeness = 'polite') {
  listeners.forEach((l) => l(message, politeness));
}
export function onAnnounce(fn: (msg: string, p: Politeness) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
