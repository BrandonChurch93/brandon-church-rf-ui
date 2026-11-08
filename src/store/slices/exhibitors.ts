import type { Exhibitor, ExhibitorStatus, Id } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid, reinsert } from '../ids';
import type { UndoToken } from '../undo';

export interface ExhibitorsSlice {
  addExhibitor(input: Omit<Exhibitor, 'id'>): Id;
  updateExhibitor(id: Id, patch: Partial<Omit<Exhibitor, 'id'>>): void;
  /** Assigns a booth (or frees it with null). A booth holds at most one exhibitor. */
  assignBooth(exhibitorId: Id, boothId: Id | null): UndoToken;
  setExhibitorStatus(id: Id, status: ExhibitorStatus): void;
  removeExhibitor(id: Id): UndoToken;
  linkStaff(attendeeId: Id, exhibitorId: Id): void;
  unlinkStaff(attendeeId: Id): UndoToken;
}

export const exhibitorsSlice = (set: SetState, get: GetState): ExhibitorsSlice => ({
  addExhibitor: (input) => {
    const id = uid();
    updateEvent(set, get, (e) => ({
      ...e,
      exhibitors: [...e.exhibitors.map((x) => (input.boothId && x.boothId === input.boothId ? { ...x, boothId: null } : x)), { ...input, id }],
    }));
    return id;
  },
  updateExhibitor: (id, patch) =>
    updateEvent(set, get, (e) => ({
      ...e,
      exhibitors: e.exhibitors.map((x) => {
        if (x.id === id) return { ...x, ...patch };
        if (patch.boothId && x.boothId === patch.boothId) return { ...x, boothId: null };
        return x;
      }),
    })),
  assignBooth: (exhibitorId, boothId) => {
    const eventId = get().activeEventId;
    const prev = new Map(get().events[eventId].exhibitors.map((x) => [x.id, x.boothId]));
    updateEvent(set, get, (e) => ({
      ...e,
      exhibitors: e.exhibitors.map((x) => (x.id === exhibitorId ? { ...x, boothId } : boothId && x.boothId === boothId ? { ...x, boothId: null } : x)),
    }));
    return { undo: () => updateEvent(set, get, (e) => ({ ...e, exhibitors: e.exhibitors.map((x) => ({ ...x, boothId: prev.has(x.id) ? (prev.get(x.id) ?? null) : x.boothId })) }), eventId) };
  },
  setExhibitorStatus: (id, status) => updateEvent(set, get, (e) => ({ ...e, exhibitors: e.exhibitors.map((x) => (x.id === id ? { ...x, status } : x)) })),
  removeExhibitor: (id) => {
    const eventId = get().activeEventId;
    const ev = get().events[eventId];
    const index = ev.exhibitors.findIndex((x) => x.id === id);
    const item = ev.exhibitors[index];
    const staff = ev.attendees.filter((a) => a.exhibitorId === id).map((a) => a.id);
    updateEvent(set, get, (e) => ({
      ...e,
      exhibitors: e.exhibitors.filter((x) => x.id !== id),
      attendees: e.attendees.map((a) => (a.exhibitorId === id ? { ...a, exhibitorId: null } : a)),
    }));
    return {
      undo: () =>
        updateEvent(
          set,
          get,
          (e) => {
            const boothTaken = item.boothId && e.exhibitors.some((x) => x.boothId === item.boothId);
            return {
              ...e,
              exhibitors: reinsert(e.exhibitors, [{ index, item: boothTaken ? { ...item, boothId: null } : item }]),
              attendees: e.attendees.map((a) => (staff.includes(a.id) && !a.exhibitorId ? { ...a, exhibitorId: id } : a)),
            };
          },
          eventId,
        ),
    };
  },
  linkStaff: (attendeeId, exhibitorId) => updateEvent(set, get, (e) => ({ ...e, attendees: e.attendees.map((a) => (a.id === attendeeId ? { ...a, exhibitorId } : a)) })),
  unlinkStaff: (attendeeId) => {
    const eventId = get().activeEventId;
    const prev = get().events[eventId].attendees.find((a) => a.id === attendeeId)?.exhibitorId ?? null;
    updateEvent(set, get, (e) => ({ ...e, attendees: e.attendees.map((a) => (a.id === attendeeId ? { ...a, exhibitorId: null } : a)) }));
    return { undo: () => updateEvent(set, get, (e) => ({ ...e, attendees: e.attendees.map((a) => (a.id === attendeeId ? { ...a, exhibitorId: prev } : a)) }), eventId) };
  },
});
