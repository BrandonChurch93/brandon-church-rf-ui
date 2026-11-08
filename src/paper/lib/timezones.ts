// The 24 common IANA zones offered in the event editor, labeled by city.
export const TIMEZONES: Array<{ value: string; city: string }> = [
  { value: 'Pacific/Honolulu', city: 'Honolulu' },
  { value: 'America/Anchorage', city: 'Anchorage' },
  { value: 'America/Los_Angeles', city: 'Los Angeles' },
  { value: 'America/Vancouver', city: 'Vancouver' },
  { value: 'America/Phoenix', city: 'Phoenix' },
  { value: 'America/Denver', city: 'Denver' },
  { value: 'America/Chicago', city: 'Chicago' },
  { value: 'America/Mexico_City', city: 'Mexico City' },
  { value: 'America/New_York', city: 'New York' },
  { value: 'America/Toronto', city: 'Toronto' },
  { value: 'America/Halifax', city: 'Halifax' },
  { value: 'America/Sao_Paulo', city: 'São Paulo' },
  { value: 'Europe/London', city: 'London' },
  { value: 'Europe/Dublin', city: 'Dublin' },
  { value: 'Europe/Madrid', city: 'Madrid' },
  { value: 'Europe/Paris', city: 'Paris' },
  { value: 'Europe/Amsterdam', city: 'Amsterdam' },
  { value: 'Europe/Berlin', city: 'Berlin' },
  { value: 'Africa/Johannesburg', city: 'Johannesburg' },
  { value: 'Asia/Dubai', city: 'Dubai' },
  { value: 'Asia/Kolkata', city: 'Mumbai' },
  { value: 'Asia/Singapore', city: 'Singapore' },
  { value: 'Asia/Tokyo', city: 'Tokyo' },
  { value: 'Australia/Sydney', city: 'Sydney' },
];

/** "UTC−07:00" for a zone on a given date. */
export function utcOffsetLabel(timeZone: string, at = new Date()) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  return part.replace('GMT', 'UTC').replace('-', '−') || 'UTC';
}
