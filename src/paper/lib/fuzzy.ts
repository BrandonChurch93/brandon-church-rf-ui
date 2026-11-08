// Small fuzzy matcher for the command palette: subsequence match with bonuses for contiguous runs
// and word starts. Returns the matched indices so the UI can highlight them.
export interface FuzzyResult {
  score: number;
  indices: number[];
}

export function fuzzy(query: string, text: string): FuzzyResult | null {
  const q = query.trim().toLowerCase();
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let ti = 0;
  let prev = -2;
  for (const ch of q) {
    if (ch === ' ') continue;
    const found = t.indexOf(ch, ti);
    if (found < 0) return null;
    indices.push(found);
    score += 1;
    if (found === prev + 1) score += 5;
    if (found === 0 || /[\s\-·,(]/.test(t[found - 1])) score += 8;
    score -= Math.min(3, found - ti) * 0.2;
    prev = found;
    ti = found + 1;
  }
  if (t.startsWith(q)) score += 10;
  return { score, indices };
}

/** Indices of a plain substring match, for live record search. */
export function substring(query: string, text: string): number[] | null {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return null;
  return Array.from({ length: q.length }, (_, k) => i + k);
}
