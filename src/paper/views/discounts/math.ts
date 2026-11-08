// Discount math in integer minor units: no float artifacts, halves round up.
import type { Discount, EventRecord, Package } from '@/store/types';
import { formatDate, formatDateRange, formatMoney, formatDateShort, listNames } from '../../lib/format';

export function discounted(priceMinor: number, kind: Discount['kind'], amount: number): number {
  if (kind === 'percent') return Math.max(0, priceMinor - Math.floor((priceMinor * amount) / 100 + 0.5));
  return Math.max(0, priceMinor - amount);
}

/** The packages a discount applies to; an empty list means every non-archived package. */
export function appliesTo(ev: EventRecord, ids: string[]): Package[] {
  return ids.length ? ev.packages.filter((p) => ids.includes(p.id)) : ev.packages.filter((p) => p.status !== 'archived');
}

/** "25% off Full Conference and Workshop Day", "$100 off all packages". */
export function ruleText(ev: EventRecord, d: Pick<Discount, 'kind' | 'amount' | 'packageIds'>) {
  const amount = d.kind === 'percent' ? `${d.amount}%` : formatMoney(d.amount, ev.currency);
  const names = ev.packages.filter((p) => d.packageIds.includes(p.id)).map((p) => p.name);
  return `${amount} off ${d.packageIds.length === 0 ? 'all packages' : listNames(names)}`;
}

/** "Sep 1 to Nov 1, 2026", "Always", "Until Dec 10, 2026", "From Jan 1, 2027". */
export function windowText(d: Pick<Discount, 'startsOn' | 'endsOn'>) {
  if (!d.startsOn && !d.endsOn) return 'Always';
  if (d.startsOn && d.endsOn) {
    if (d.startsOn.slice(0, 4) === d.endsOn.slice(0, 4)) return `${formatDateShort(d.startsOn)} to ${formatDate(d.endsOn)}`;
    return formatDateRange(d.startsOn, d.endsOn);
  }
  if (d.endsOn) return `Until ${formatDate(d.endsOn)}`;
  return `From ${formatDate(d.startsOn!)}`;
}
