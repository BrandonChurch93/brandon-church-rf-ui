import type { AttendeeType, Id } from '../types';
import { SWATCHES } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid, reinsert } from '../ids';
import { withActivity } from '../activity';
import type { UndoToken } from '../undo';

export interface TypesSlice {
  addType(input: Omit<AttendeeType, 'id' | 'isDefault'>): Id;
  updateType(id: Id, patch: Partial<Omit<AttendeeType, 'id' | 'isDefault'>>): void;
  reorderTypes(ids: Id[]): void;
  setDefaultType(id: Id): void;
  duplicateType(id: Id): Id | null;
  /** Removes a type; anything that used it moves to `reassignTo`. The default type cannot be removed. */
  removeType(id: Id, reassignTo: Id | null): UndoToken | null;
}

export const typesSlice = (set: SetState, get: GetState): TypesSlice => ({
  addType: (input) => {
    const id = uid();
    updateEvent(set, get, (e) => ({ ...e, attendeeTypes: [...e.attendeeTypes, { ...input, id, isDefault: false }] }));
    return id;
  },
  updateType: (id, patch) => updateEvent(set, get, (e) => ({ ...e, attendeeTypes: e.attendeeTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  reorderTypes: (ids) =>
    updateEvent(set, get, (e) => {
      const byId = new Map(e.attendeeTypes.map((t) => [t.id, t]));
      return { ...e, attendeeTypes: [...(ids.map((i) => byId.get(i)).filter(Boolean) as AttendeeType[]), ...e.attendeeTypes.filter((t) => !ids.includes(t.id))] };
    }),
  setDefaultType: (id) => updateEvent(set, get, (e) => ({ ...e, attendeeTypes: e.attendeeTypes.map((t) => ({ ...t, isDefault: t.id === id })) })),
  duplicateType: (id) => {
    const ev = get().events[get().activeEventId];
    const src = ev.attendeeTypes.find((t) => t.id === id);
    if (!src) return null;
    const used = new Set(ev.attendeeTypes.map((t) => t.swatch));
    const swatch = SWATCHES.find((s) => !used.has(s)) ?? SWATCHES[(SWATCHES.indexOf(src.swatch) + 1) % SWATCHES.length];
    const names = new Set(ev.attendeeTypes.map((t) => t.name.toLowerCase()));
    let name = `${src.name} copy`.slice(0, 32);
    let n = 2;
    while (names.has(name.toLowerCase())) name = `${src.name} copy ${n++}`.slice(0, 32);
    const copy: AttendeeType = { id: uid(), name, description: src.description, swatch, isDefault: false };
    updateEvent(set, get, (e) => {
      const i = e.attendeeTypes.findIndex((t) => t.id === id);
      return { ...e, attendeeTypes: [...e.attendeeTypes.slice(0, i + 1), copy, ...e.attendeeTypes.slice(i + 1)] };
    });
    return copy.id;
  },
  removeType: (id, reassignTo) => {
    const eventId = get().activeEventId;
    const ev = get().events[eventId];
    const index = ev.attendeeTypes.findIndex((t) => t.id === id);
    const type = ev.attendeeTypes[index];
    if (!type || type.isDefault) return null;
    const target = reassignTo ? ev.attendeeTypes.find((t) => t.id === reassignTo) : ev.attendeeTypes.find((t) => t.isDefault);
    const targetId = target?.id ?? null;

    const prevAttendees = new Map(ev.attendees.filter((a) => a.attendeeTypeId === id).map((a) => [a.id, a]));
    const prevWorkflows = new Map(ev.guide.workflows.filter((w) => w.attendeeTypeId === id).map((w) => [w.id, w]));
    const prevPackages = new Map(ev.packages.filter((p) => p.attendeeTypeIds.includes(id)).map((p) => [p.id, p]));
    const prevCodes = new Map(ev.regCodes.filter((c) => c.grantsTypeId === id).map((c) => [c.id, c]));

    updateEvent(set, get, (e) => ({
      ...e,
      attendeeTypes: e.attendeeTypes.filter((t) => t.id !== id),
      attendees: e.attendees.map((a) =>
        a.attendeeTypeId === id && targetId ? withActivity({ ...a, attendeeTypeId: targetId }, `Type changed to ${target!.name} during removal of ${type.name}`) : a,
      ),
      guide: { ...e.guide, workflows: e.guide.workflows.map((w) => (w.attendeeTypeId === id && targetId ? { ...w, attendeeTypeId: targetId } : w)) },
      packages: e.packages.map((p) => {
        if (!p.attendeeTypeIds.includes(id)) return p;
        const rest = p.attendeeTypeIds.filter((t) => t !== id);
        // An empty list means "all types", so a package limited to the removed type moves to the replacement instead.
        const next = rest.length ? (targetId && !rest.includes(targetId) ? [...rest, targetId] : rest) : targetId ? [targetId] : [];
        return { ...p, attendeeTypeIds: next };
      }),
      regCodes: e.regCodes.map((c) => (c.grantsTypeId === id ? { ...c, grantsTypeId: targetId } : c)),
    }));

    return {
      undo: () =>
        updateEvent(
          set,
          get,
          (e) => ({
            ...e,
            attendeeTypes: reinsert(e.attendeeTypes, [{ index, item: type }]),
            attendees: e.attendees.map((a) => prevAttendees.get(a.id) ?? a),
            guide: { ...e.guide, workflows: e.guide.workflows.map((w) => prevWorkflows.get(w.id) ?? w) },
            packages: e.packages.map((p) => prevPackages.get(p.id) ?? p),
            regCodes: e.regCodes.map((c) => prevCodes.get(c.id) ?? c),
          }),
          eventId,
        ),
    };
  },
});
