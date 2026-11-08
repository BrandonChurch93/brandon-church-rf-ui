// Derived values. Never stored.
import type { Discount, EventRecord, Id, ISODate, RegCode } from './types';
import { addDays, daysBetween, todayIn } from '@/paper/lib/format';

export function guideProgress(ev: EventRecord) {
  const s = ev.guide.settings;
  const settingsDone = [s.general, s.attributes, s.communications].filter(Boolean).length;
  const live = ev.guide.workflows.filter((w) => w.status === 'live').length;
  const x = ev.guide.experiences;
  const expDone = [x.portal, x.calendar].filter(Boolean).length;
  const total = 3 + ev.guide.workflows.length + 2;
  return { done: settingsDone + live + expDone, total };
}

export type ChipState = { text: string; tone: 'berry' | 'success' | 'muted' };

/** "38 days out", "1 day out", "Today", "Live now", "Ended", compared by calendar date in the event's timezone. */
export function eventStatus(ev: Pick<EventRecord, 'startDate' | 'endDate' | 'timezone'>, now = new Date()): ChipState {
  const today = todayIn(ev.timezone, now);
  const end = ev.endDate ?? ev.startDate;
  if (today < ev.startDate) {
    const n = daysBetween(today, ev.startDate);
    return { text: n === 1 ? '1 day out' : `${n} days out`, tone: 'berry' };
  }
  if (today === ev.startDate) return { text: 'Today', tone: 'berry' };
  if (today <= end) return { text: 'Live now', tone: 'success' };
  return { text: 'Ended', tone: 'muted' };
}

export function countBy<T>(list: T[], key: (x: T) => Id | null): Map<Id, number> {
  const m = new Map<Id, number>();
  for (const x of list) {
    const k = key(x);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export const typeCounts = (ev: EventRecord) => countBy(ev.attendees, (a) => a.attendeeTypeId);
export const packageSold = (ev: EventRecord) => countBy(ev.attendees, (a) => a.packageId);

export type CodeStatus = 'active' | 'inactive' | 'expired' | 'exhausted';
export function codeStatus(c: RegCode, today: ISODate): CodeStatus {
  if (c.expiresOn && c.expiresOn < today) return 'expired';
  if (c.maxUses !== null && c.uses >= c.maxUses) return 'exhausted';
  if (!c.active) return 'inactive';
  return 'active';
}

export type DiscountWindow = 'always' | 'scheduled' | 'open' | 'ended';
export function discountWindow(d: Discount, today: ISODate): DiscountWindow {
  if (d.endsOn && d.endsOn < today) return 'ended';
  if (d.startsOn && d.startsOn > today) return 'scheduled';
  if (!d.startsOn && !d.endsOn) return 'always';
  return 'open';
}

export function eventDays(ev: Pick<EventRecord, 'startDate' | 'endDate'>): ISODate[] {
  const end = ev.endDate ?? ev.startDate;
  const days: ISODate[] = [];
  for (let d = ev.startDate; d <= end && days.length < 14; d = addDays(d, 1)) days.push(d);
  return days;
}

export const defaultType = (ev: EventRecord) => ev.attendeeTypes.find((t) => t.isDefault) ?? ev.attendeeTypes[0];
export const fullName = (a: { firstName: string; lastName: string }) => `${a.firstName} ${a.lastName}`.trim();
