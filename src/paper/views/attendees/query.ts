// Filtering, sorting and paging for the attendees list. Pure functions so the table, the card list
// and CSV export all see exactly the same rows.
import type { Attendee, AttendeeStatus, EventRecord } from '@/store/types';
import type { SortState } from '../../ui/Table';
import { fullName } from '@/store/selectors';

export type SortKey = 'name' | 'company' | 'type' | 'package' | 'status' | 'registered';
export interface Filters {
  q: string;
  types: string[];
  statuses: AttendeeStatus[];
  packages: string[];
}
export const emptyFilters = (): Filters => ({ q: '', types: [], statuses: [], packages: [] });
export const filterCount = (f: Filters) => f.types.length + f.statuses.length + f.packages.length;
export const isFiltered = (f: Filters) => Boolean(f.q.trim()) || filterCount(f) > 0;

export const STATUSES: Array<{ value: AttendeeStatus; label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' }> = [
  { value: 'registered', label: 'Registered', tone: 'success' },
  { value: 'pending', label: 'Pending', tone: 'warning' },
  { value: 'waitlisted', label: 'Waitlisted', tone: 'neutral' },
  { value: 'cancelled', label: 'Cancelled', tone: 'danger' },
];
export const statusMeta = (s: AttendeeStatus) => STATUSES.find((x) => x.value === s)!;
export const NONE = '__none__';

export function applyFilters(ev: EventRecord, f: Filters): Attendee[] {
  const q = f.q.trim().toLowerCase();
  return ev.attendees.filter((a) => {
    if (q && !fullName(a).toLowerCase().includes(q) && !a.email.toLowerCase().includes(q) && !(a.company ?? '').toLowerCase().includes(q)) return false;
    if (f.types.length && !f.types.includes(a.attendeeTypeId)) return false;
    if (f.statuses.length && !f.statuses.includes(a.status)) return false;
    if (f.packages.length && !f.packages.includes(a.packageId ?? NONE)) return false;
    return true;
  });
}

const STATUS_ORDER: Record<AttendeeStatus, number> = { registered: 0, pending: 1, waitlisted: 2, cancelled: 3 };

export function applySort(ev: EventRecord, list: Attendee[], sort: SortState<SortKey> | null): Attendee[] {
  const typeName = new Map(ev.attendeeTypes.map((t) => [t.id, t.name]));
  const pkgName = new Map(ev.packages.map((p) => [p.id, p.name]));
  const s = sort ?? { key: 'registered' as const, dir: 'desc' as const };
  const val = (a: Attendee): string | number => {
    switch (s.key) {
      case 'name':
        return `${a.lastName} ${a.firstName}`.toLowerCase();
      case 'company':
        return (a.company ?? '').toLowerCase();
      case 'type':
        return (typeName.get(a.attendeeTypeId) ?? '').toLowerCase();
      case 'package':
        return a.packageId ? (pkgName.get(a.packageId) ?? '').toLowerCase() : '￿';
      case 'status':
        return STATUS_ORDER[a.status];
      case 'registered':
        return a.registeredAt;
    }
  };
  const dir = s.dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    if (x < y) return -dir;
    if (x > y) return dir;
    return b.registeredAt.localeCompare(a.registeredAt);
  });
}
