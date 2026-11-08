import type { Exhibitor, ExhibitorStatus, ExhibitorTier } from '@/store/types';

export const TIERS: ExhibitorTier[] = ['platinum', 'gold', 'silver'];
export const TIER_META: Record<ExhibitorTier, { label: string; swatch: 'slate' | 'amber' | 'silver' }> = {
  platinum: { label: 'Platinum', swatch: 'slate' },
  gold: { label: 'Gold', swatch: 'amber' },
  silver: { label: 'Silver', swatch: 'silver' },
};
export const STATUS_META: Record<ExhibitorStatus, { label: string; tone: 'success' | 'warning' | 'danger'; color: string }> = {
  confirmed: { label: 'Confirmed', tone: 'success', color: 'var(--success)' },
  pending: { label: 'Pending', tone: 'warning', color: 'var(--warning)' },
  cancelled: { label: 'Cancelled', tone: 'danger', color: 'var(--danger)' },
};
const TIER_ORDER: Record<ExhibitorTier, number> = { platinum: 0, gold: 1, silver: 2 };
export const sortExhibitors = (list: Exhibitor[]) => [...list].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.name.localeCompare(b.name));
export function monogram(name: string) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? words[0]?.[1] ?? '')).toUpperCase();
}

/** Exhibitor staff are attendees of any type whose name mentions exhibitors (the seeded "Exhibitor staff"). */
export const staffTypeIds = (types: Array<{ id: string; name: string }>) => types.filter((t) => /exhibitor/i.test(t.name)).map((t) => t.id);

// Floor map geometry in viewBox units (1200 x 640). Columns 3 and 4 sit either side of a 90 unit aisle.
export const MAP = { w: 1200, h: 640, boothW: 150, boothH: 110, x0: 45, y0: 28, gap: 30, aisle: 90, rowGap: 40 } as const;
export const ROWS = ['A', 'B', 'C', 'D'] as const;
export function boothRect(row: string, col: number) {
  const r = ROWS.indexOf(row as (typeof ROWS)[number]);
  const x = MAP.x0 + (col - 1) * (MAP.boothW + MAP.gap) + (col >= 4 ? MAP.aisle - MAP.gap : 0);
  const y = MAP.y0 + r * (MAP.boothH + MAP.rowGap);
  return { x, y, w: MAP.boothW, h: MAP.boothH };
}
/** Reading order: A1 to D6. */
export const boothOrder = <T extends { row: string; col: number }>(booths: T[]) => [...booths].sort((a, b) => a.row.localeCompare(b.row) || a.col - b.col);
export function normalizeUrl(v: string) {
  const t = v.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
export const URL_RE = /^https?:\/\/[^\s/.]+(\.[^\s/.]+)+(\/\S*)?$/i;
export const displayUrl = (u: string) => u.replace(/^https?:\/\//i, '').replace(/\/$/, '');
