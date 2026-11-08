// Loads the generated seed JSON (src/data/seed) into fresh event records.
import index from '@/data/seed/index.json';
import rainfocus from '@/data/seed/rainfocus-summit.json';
import horizon from '@/data/seed/horizon-dev-days.json';
import northwind from '@/data/seed/northwind-partner-forum.json';
import type { EventRecord, Id } from './types';

const RAW = [rainfocus, horizon, northwind] as unknown as EventRecord[];

export interface SeedState {
  activeEventId: Id;
  events: Record<Id, EventRecord>;
  eventOrder: Id[];
}

export function seedState(): SeedState {
  const events: Record<Id, EventRecord> = {};
  for (const e of RAW) events[e.id] = structuredClone(e);
  return { activeEventId: index.activeEventId, events, eventOrder: RAW.map((e) => e.id) };
}

export function seedEvent(id: Id): EventRecord | null {
  const e = RAW.find((x) => x.id === id);
  return e ? structuredClone(e) : null;
}

/** A light shape check used when loading persisted data. */
export function isValidEvent(e: unknown): e is EventRecord {
  if (!e || typeof e !== 'object') return false;
  const r = e as Record<string, unknown>;
  const arrays = ['attendeeTypes', 'attendees', 'packages', 'regCodes', 'discounts', 'tracks', 'sessions', 'exhibitors', 'booths'];
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.startDate === 'string' &&
    typeof r.timezone === 'string' &&
    typeof r.currency === 'string' &&
    !!r.guide &&
    !!r.agenda &&
    !!r.logo &&
    arrays.every((k) => Array.isArray(r[k])) &&
    (r.attendeeTypes as Array<{ isDefault?: boolean }>).filter((t) => t.isDefault).length === 1
  );
}
