import type { Discount, Id } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid, reinsert } from '../ids';
import type { UndoToken } from '../undo';
import { uniqueName } from './guide';

export interface DiscountsSlice {
  addDiscount(input: Omit<Discount, 'id' | 'uses'>): Id;
  updateDiscount(id: Id, patch: Partial<Omit<Discount, 'id'>>): void;
  setDiscountActive(id: Id, active: boolean): UndoToken;
  duplicateDiscount(id: Id): Id | null;
  removeDiscount(id: Id): UndoToken;
}

export const discountsSlice = (set: SetState, get: GetState): DiscountsSlice => ({
  addDiscount: (input) => {
    const id = uid();
    updateEvent(set, get, (e) => ({ ...e, discounts: [...e.discounts, { ...input, id, uses: 0 }] }));
    return id;
  },
  updateDiscount: (id, patch) => updateEvent(set, get, (e) => ({ ...e, discounts: e.discounts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  setDiscountActive: (id, active) => {
    const eventId = get().activeEventId;
    const prev = get().events[eventId].discounts.find((d) => d.id === id)?.active;
    updateEvent(set, get, (e) => ({ ...e, discounts: e.discounts.map((d) => (d.id === id ? { ...d, active } : d)) }));
    return { undo: () => updateEvent(set, get, (e) => ({ ...e, discounts: e.discounts.map((d) => (d.id === id ? { ...d, active: Boolean(prev) } : d)) }), eventId) };
  },
  duplicateDiscount: (id) => {
    const ev = get().events[get().activeEventId];
    const src = ev.discounts.find((d) => d.id === id);
    if (!src) return null;
    const copy: Discount = { ...structuredClone(src), id: uid(), name: uniqueName(`${src.name} copy`, ev.discounts.map((d) => d.name)), uses: 0 };
    updateEvent(set, get, (e) => {
      const i = e.discounts.findIndex((d) => d.id === id);
      return { ...e, discounts: [...e.discounts.slice(0, i + 1), copy, ...e.discounts.slice(i + 1)] };
    });
    return copy.id;
  },
  removeDiscount: (id) => {
    const eventId = get().activeEventId;
    const ev = get().events[eventId];
    const index = ev.discounts.findIndex((d) => d.id === id);
    const item = ev.discounts[index];
    const prevCodes = new Map(ev.regCodes.filter((c) => c.discountId === id).map((c) => [c.id, c]));
    updateEvent(set, get, (e) => ({ ...e, discounts: e.discounts.filter((d) => d.id !== id), regCodes: e.regCodes.map((c) => (c.discountId === id ? { ...c, discountId: null } : c)) }));
    return {
      undo: () =>
        updateEvent(set, get, (e) => ({ ...e, discounts: reinsert(e.discounts, [{ index, item }]), regCodes: e.regCodes.map((c) => prevCodes.get(c.id) ?? c) }), eventId),
    };
  },
});
