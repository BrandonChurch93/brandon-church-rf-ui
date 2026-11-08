import type { Attendee, AttendeeStatus, EventRecord, Id } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid, reinsert } from '../ids';
import { withActivity } from '../activity';
import type { UndoToken } from '../undo';

export type NewAttendee = Omit<Attendee, 'id' | 'activity' | 'registeredAt' | 'exhibitorId' | 'regCodeId'> & { regCodeId?: Id | null; exhibitorId?: Id | null };

export interface AttendeesSlice {
  addAttendee(input: NewAttendee): Id;
  updateAttendee(id: Id, patch: Partial<Omit<Attendee, 'id' | 'activity'>>): void;
  removeAttendees(ids: Id[]): UndoToken;
  bulkSetType(ids: Id[], typeId: Id): UndoToken;
  bulkSetStatus(ids: Id[], status: AttendeeStatus): UndoToken;
  logActivity(id: Id, text: string): void;
}

export const STATUS_LABEL: Record<AttendeeStatus, string> = { registered: 'Registered', pending: 'Pending', waitlisted: 'Waitlisted', cancelled: 'Cancelled' };

/** The activity lines a change produces (type, status, package, code, notes, contact details). */
export function describeChange(ev: EventRecord, before: Attendee, after: Attendee): string[] {
  const out: string[] = [];
  if (before.attendeeTypeId !== after.attendeeTypeId) out.push(`Type changed to ${ev.attendeeTypes.find((t) => t.id === after.attendeeTypeId)?.name ?? 'another type'}`);
  if (before.status !== after.status) {
    if (after.status === 'cancelled') out.push('Registration cancelled');
    else if (before.status === 'cancelled') out.push(`Registration reinstated as ${STATUS_LABEL[after.status]}`);
    else out.push(`Status changed to ${STATUS_LABEL[after.status]}`);
  }
  if (before.packageId !== after.packageId) {
    const p = ev.packages.find((x) => x.id === after.packageId);
    out.push(p ? `Package changed to ${p.name}` : 'Package removed');
  }
  if (before.regCodeId !== after.regCodeId) {
    const c = ev.regCodes.find((x) => x.id === after.regCodeId);
    out.push(c ? `Reg code ${c.code} applied` : 'Reg code removed');
  }
  if (before.notes !== after.notes) out.push('Notes edited');
  const contact = (['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle'] as const).some((k) => before[k] !== after[k]);
  if (contact) out.push('Contact details updated');
  return out;
}

export const attendeesSlice = (set: SetState, get: GetState): AttendeesSlice => {
  const mapAttendees = (fn: (list: Attendee[], ev: EventRecord) => Attendee[], eventId?: Id) => updateEvent(set, get, (e) => ({ ...e, attendees: fn(e.attendees, e) }), eventId);

  const bulk = <K extends 'attendeeTypeId' | 'status'>(ids: Id[], key: K, value: Attendee[K]): UndoToken => {
    const eventId = get().activeEventId;
    const idSet = new Set(ids);
    const before = new Map(get().events[eventId].attendees.filter((a) => idSet.has(a.id)).map((a) => [a.id, a]));
    mapAttendees((list, ev) => list.map((a) => (idSet.has(a.id) && a[key] !== value ? withActivity({ ...a, [key]: value }, ...describeChange(ev, a, { ...a, [key]: value })) : a)));
    return { undo: () => mapAttendees((list) => list.map((a) => before.get(a.id) ?? a), eventId) };
  };

  return {
    addAttendee: (input) => {
      const id = uid();
      const a: Attendee = withActivity(
        { regCodeId: null, exhibitorId: null, ...input, id, registeredAt: new Date().toISOString(), activity: [] },
        'Added manually',
      );
      mapAttendees((list) => [a, ...list]);
      return id;
    },
    updateAttendee: (id, patch) =>
      mapAttendees((list, ev) =>
        list.map((a) => {
          if (a.id !== id) return a;
          const next = { ...a, ...patch };
          return withActivity(next, ...describeChange(ev, a, next));
        }),
      ),
    removeAttendees: (ids) => {
      const eventId = get().activeEventId;
      const idSet = new Set(ids);
      const list = get().events[eventId].attendees;
      const removed = list.map((item, index) => ({ item, index })).filter((x) => idSet.has(x.item.id));
      mapAttendees((l) => l.filter((a) => !idSet.has(a.id)));
      return { undo: () => mapAttendees((l) => reinsert(l, removed), eventId) };
    },
    bulkSetType: (ids, typeId) => bulk(ids, 'attendeeTypeId', typeId),
    bulkSetStatus: (ids, status) => bulk(ids, 'status', status),
    logActivity: (id, text) => mapAttendees((list) => list.map((a) => (a.id === id ? withActivity(a, text) : a))),
  };
};
