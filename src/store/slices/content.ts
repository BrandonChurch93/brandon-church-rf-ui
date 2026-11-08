import type { EventRecord, Id, ISODate, Session, Track } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid, reinsert } from '../ids';
import type { UndoToken } from '../undo';

export type SessionResult = { ok: true; id: Id } | { ok: false; conflict: Session | null; reason: 'overlap' | 'outside' };

export interface ContentSlice {
  addSession(input: Omit<Session, 'id'>): SessionResult;
  updateSession(id: Id, patch: Partial<Omit<Session, 'id'>>): SessionResult;
  moveSession(id: Id, to: { trackId: Id; date: ISODate; startMinutes: number }): SessionResult & { undo?: UndoToken };
  removeSession(id: Id): UndoToken;
  saveTracks(tracks: Track[]): void;
}

/** The first session in the same track and day whose time range overlaps the candidate. */
export function findConflict(ev: EventRecord, c: Pick<Session, 'trackId' | 'date' | 'startMinutes' | 'durationMinutes'>, ignoreId?: Id): Session | null {
  const end = c.startMinutes + c.durationMinutes;
  return (
    ev.sessions.find((s) => s.id !== ignoreId && s.trackId === c.trackId && s.date === c.date && s.startMinutes < end && c.startMinutes < s.startMinutes + s.durationMinutes) ?? null
  );
}

export function checkSession(ev: EventRecord, c: Pick<Session, 'trackId' | 'date' | 'startMinutes' | 'durationMinutes'>, ignoreId?: Id): SessionResult | null {
  if (c.startMinutes < ev.agenda.startMinutes || c.startMinutes + c.durationMinutes > ev.agenda.endMinutes) return { ok: false, conflict: null, reason: 'outside' };
  const conflict = findConflict(ev, c, ignoreId);
  if (conflict) return { ok: false, conflict, reason: 'overlap' };
  return null;
}

export const contentSlice = (set: SetState, get: GetState): ContentSlice => ({
  addSession: (input) => {
    const ev = get().events[get().activeEventId];
    const bad = checkSession(ev, input);
    if (bad) return bad;
    const id = uid();
    updateEvent(set, get, (e) => ({ ...e, sessions: [...e.sessions, { ...input, id }] }));
    return { ok: true, id };
  },
  updateSession: (id, patch) => {
    const ev = get().events[get().activeEventId];
    const cur = ev.sessions.find((s) => s.id === id);
    if (!cur) return { ok: false, conflict: null, reason: 'outside' };
    const next = { ...cur, ...patch };
    const bad = checkSession(ev, next, id);
    if (bad) return bad;
    updateEvent(set, get, (e) => ({ ...e, sessions: e.sessions.map((s) => (s.id === id ? next : s)) }));
    return { ok: true, id };
  },
  moveSession: (id, to) => {
    const eventId = get().activeEventId;
    const ev = get().events[eventId];
    const cur = ev.sessions.find((s) => s.id === id);
    if (!cur) return { ok: false, conflict: null, reason: 'outside' };
    const next = { ...cur, ...to };
    const bad = checkSession(ev, next, id);
    if (bad) return bad;
    updateEvent(set, get, (e) => ({ ...e, sessions: e.sessions.map((s) => (s.id === id ? next : s)) }));
    return {
      ok: true,
      id,
      undo: {
        undo: () => {
          const now = get().events[eventId];
          // Only restore when the old slot is still free.
          if (!checkSession(now, cur, id)) updateEvent(set, get, (e) => ({ ...e, sessions: e.sessions.map((s) => (s.id === id ? cur : s)) }), eventId);
        },
      },
    };
  },
  removeSession: (id) => {
    const eventId = get().activeEventId;
    const ev = get().events[eventId];
    const index = ev.sessions.findIndex((s) => s.id === id);
    const item = ev.sessions[index];
    updateEvent(set, get, (e) => ({ ...e, sessions: e.sessions.filter((s) => s.id !== id) }));
    return { undo: () => updateEvent(set, get, (e) => (checkSession(e, item) ? e : { ...e, sessions: reinsert(e.sessions, [{ index, item }]) }), eventId) };
  },
  saveTracks: (tracks) => updateEvent(set, get, (e) => ({ ...e, tracks: tracks.map((t) => ({ ...t, id: t.id || uid() })) })),
});
