/** New record ids. crypto.randomUUID needs a secure context; fall back to getRandomValues. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** Insert items back at their original indices (used by undo). */
export function reinsert<T>(list: T[], items: Array<{ index: number; item: T }>): T[] {
  const out = [...list];
  for (const { index, item } of [...items].sort((a, b) => a.index - b.index)) out.splice(Math.min(index, out.length), 0, item);
  return out;
}
