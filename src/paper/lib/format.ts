// Formatting with Intl only (no date or number libraries). Calendar dates (ISODate) are formatted as
// UTC so they never shift by a day; timestamps are formatted in the event's timezone.
import type { Currency, ISODate } from '@/store/types';

const LOCALE = 'en-US';

// ---------- Numbers and money ----------
export const formatNumber = (n: number) => new Intl.NumberFormat(LOCALE).format(n);

export function currencySymbol(currency: Currency) {
  const parts = new Intl.NumberFormat(LOCALE, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? currency;
}

/** "$899", "$674.25", "$1,899". No trailing .00 on whole amounts. */
export function formatMoney(minor: number, currency: Currency) {
  const whole = minor % 100 === 0;
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** Like formatMoney, but zero reads "Free". */
export const formatPrice = (minor: number, currency: Currency) => (minor === 0 ? 'Free' : formatMoney(minor, currency));

// ---------- Plurals ----------
const IRREGULAR: Record<string, string> = { person: 'people', entry: 'entries', company: 'companies', category: 'categories' };
export function plural(n: number, noun: string, pluralForm?: string) {
  const word = n === 1 ? noun : (pluralForm ?? IRREGULAR[noun] ?? `${noun}s`);
  return `${formatNumber(n)} ${word}`;
}

// ---------- Calendar dates ----------
export function parseISODate(d: ISODate) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}
export function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}
export function addDays(d: ISODate, n: number): ISODate {
  const dt = parseISODate(d);
  dt.setUTCDate(dt.getUTCDate() + n);
  return toISODate(dt);
}

/** "Dec 15, 2026" */
export const formatDate = (d: ISODate) => parseISODate(d).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
/** "Dec 15" */
export const formatDateShort = (d: ISODate) => parseISODate(d).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', timeZone: 'UTC' });
/** "December 15, 2026" */
export const formatDateLong = (d: ISODate) => parseISODate(d).toLocaleDateString(LOCALE, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
/** "Mon, Dec 15" */
export const formatWeekdayShort = (d: ISODate) => parseISODate(d).toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** "Sep 1 to Nov 1, 2026", "Dec 15 to 16, 2026" style ranges. */
export function formatDateRange(start: ISODate, end: ISODate | null) {
  if (!end || end === start) return formatDate(start);
  const a = parseISODate(start);
  const b = parseISODate(end);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const left = a.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric', timeZone: 'UTC' });
  return `${left} to ${formatDate(end)}`;
}

/** Today's calendar date in a timezone. */
export function todayIn(timeZone: string, now = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Whole calendar days from a to b (b minus a). */
export function daysBetween(a: ISODate, b: ISODate) {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}

/** Minutes since midnight now, in a timezone. */
export function minutesNowIn(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

// ---------- Timestamps ----------
/** "Nov 2, 2026" for a timestamp, in the event's timezone. */
export const formatDateTimeAsDate = (iso: string, timeZone: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric', timeZone });

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
/** "2 days ago", "yesterday", "just now". */
export function relativeTime(iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86_400 * 30) return rtf.format(Math.round(diff / 86_400), 'day');
  if (abs < 86_400 * 365) return rtf.format(Math.round(diff / (86_400 * 30)), 'month');
  return rtf.format(Math.round(diff / (86_400 * 365)), 'year');
}

// ---------- Times of day (minutes since midnight) ----------
function hm(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { text: `${h12}:${String(m).padStart(2, '0')}`, period };
}
/** "9:00 AM" */
export function formatTime(minutes: number) {
  const t = hm(minutes);
  return `${t.text} ${t.period}`;
}
/** "9:00 to 9:45 AM", or "11:15 AM to 12:00 PM" across noon. */
export function formatTimeRange(start: number, duration: number) {
  const a = hm(start);
  const b = hm(start + duration);
  return a.period === b.period ? `${a.text} to ${b.text} ${b.period}` : `${a.text} ${a.period} to ${b.text} ${b.period}`;
}
/** "45 min", "1 hr", "1 hr 30 min" */
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// ---------- Text ----------
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** "Full Conference and Workshop Day", "A, B and 2 more". */
export function listNames(names: string[], max = 2) {
  if (names.length <= max) {
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }
  return `${names.slice(0, max).join(', ')} and ${names.length - max} more`;
}
