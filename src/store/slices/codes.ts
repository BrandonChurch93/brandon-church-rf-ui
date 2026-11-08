import type { Id, RegCode } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid, reinsert } from '../ids';
import { withActivity } from '../activity';
import type { UndoToken } from '../undo';

export interface CodesSlice {
  addCode(input: Omit<RegCode, 'id' | 'createdAt' | 'uses'> & { uses?: number }): Id;
  updateCode(id: Id, patch: Partial<Omit<RegCode, 'id'>>): void;
  setCodeActive(id: Id, active: boolean): UndoToken;
  duplicateCode(id: Id, code: string): Id | null;
  removeCode(id: Id): UndoToken;
  bulkAddCodes(list: Array<Omit<RegCode, 'id' | 'createdAt' | 'uses'>>): { ids: Id[]; undo: UndoToken };
}

// Unambiguous alphabet: no 0, O, 1, I or L.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function block(n: number) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join('');
}
/** RF-XXXX-XXXX, unique within the given list. */
export function generateCode(taken: string[], prefix = 'RF') {
  const set = new Set(taken.map((c) => c.toUpperCase()));
  let code = '';
  do code = `${prefix}-${block(4)}-${block(4)}`;
  while (set.has(code));
  return code;
}

export const codesSlice = (set: SetState, get: GetState): CodesSlice => ({
  addCode: (input) => {
    const id = uid();
    updateEvent(set, get, (e) => ({ ...e, regCodes: [{ uses: 0, ...input, id, createdAt: new Date().toISOString() }, ...e.regCodes] }));
    return id;
  },
  updateCode: (id, patch) => updateEvent(set, get, (e) => ({ ...e, regCodes: e.regCodes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  setCodeActive: (id, active) => {
    const eventId = get().activeEventId;
    const prev = get().events[eventId].regCodes.find((c) => c.id === id)?.active;
    updateEvent(set, get, (e) => ({ ...e, regCodes: e.regCodes.map((c) => (c.id === id ? { ...c, active } : c)) }));
    return { undo: () => updateEvent(set, get, (e) => ({ ...e, regCodes: e.regCodes.map((c) => (c.id === id ? { ...c, active: Boolean(prev) } : c)) }), eventId) };
  },
  duplicateCode: (id, code) => {
    const ev = get().events[get().activeEventId];
    const src = ev.regCodes.find((c) => c.id === id);
    if (!src) return null;
    const copy: RegCode = { ...src, id: uid(), code, label: `${src.label} copy`, uses: 0, createdAt: new Date().toISOString() };
    updateEvent(set, get, (e) => ({ ...e, regCodes: [copy, ...e.regCodes] }));
    return copy.id;
  },
  removeCode: (id) => {
    const eventId = get().activeEventId;
    const ev = get().events[eventId];
    const index = ev.regCodes.findIndex((c) => c.id === id);
    const item = ev.regCodes[index];
    const prevAttendees = new Map(ev.attendees.filter((a) => a.regCodeId === id).map((a) => [a.id, a]));
    updateEvent(set, get, (e) => ({
      ...e,
      regCodes: e.regCodes.filter((c) => c.id !== id),
      attendees: e.attendees.map((a) => (a.regCodeId === id ? withActivity({ ...a, regCodeId: null }, `Code ${item.code} removed`) : a)),
    }));
    return {
      undo: () =>
        updateEvent(set, get, (e) => ({ ...e, regCodes: reinsert(e.regCodes, [{ index, item }]), attendees: e.attendees.map((a) => prevAttendees.get(a.id) ?? a) }), eventId),
    };
  },
  bulkAddCodes: (list) => {
    const eventId = get().activeEventId;
    const created = new Date().toISOString();
    const records: RegCode[] = list.map((c) => ({ ...c, id: uid(), uses: 0, createdAt: created }));
    updateEvent(set, get, (e) => ({ ...e, regCodes: [...records, ...e.regCodes] }));
    const ids = records.map((r) => r.id);
    const idSet = new Set(ids);
    return { ids, undo: { undo: () => updateEvent(set, get, (e) => ({ ...e, regCodes: e.regCodes.filter((c) => !idSet.has(c.id)) }), eventId) } };
  },
});
