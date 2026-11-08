import type { Id, Package, PackageStatus } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid, reinsert } from '../ids';
import type { UndoToken } from '../undo';
import { uniqueName } from './guide';

export interface PackagesSlice {
  addPackage(input: Omit<Package, 'id'>): Id;
  updatePackage(id: Id, patch: Partial<Omit<Package, 'id'>>): void;
  duplicatePackage(id: Id): Id | null;
  setPackageArchived(id: Id, archived: boolean): UndoToken;
  /** Only allowed when nothing is sold; archiving is the path otherwise. */
  removePackage(id: Id): UndoToken | null;
}

export const packagesSlice = (set: SetState, get: GetState): PackagesSlice => ({
  addPackage: (input) => {
    const id = uid();
    updateEvent(set, get, (e) => ({ ...e, packages: [...e.packages, { ...input, id }] }));
    return id;
  },
  updatePackage: (id, patch) => updateEvent(set, get, (e) => ({ ...e, packages: e.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  duplicatePackage: (id) => {
    const ev = get().events[get().activeEventId];
    const src = ev.packages.find((p) => p.id === id);
    if (!src) return null;
    const copy: Package = { ...structuredClone(src), id: uid(), name: uniqueName(`${src.name} copy`, ev.packages.map((p) => p.name)), status: 'draft' };
    updateEvent(set, get, (e) => {
      const i = e.packages.findIndex((p) => p.id === id);
      return { ...e, packages: [...e.packages.slice(0, i + 1), copy, ...e.packages.slice(i + 1)] };
    });
    return copy.id;
  },
  setPackageArchived: (id, archived) => {
    const eventId = get().activeEventId;
    const prev: PackageStatus | undefined = get().events[eventId].packages.find((p) => p.id === id)?.status;
    const next: PackageStatus = archived ? 'archived' : 'active';
    updateEvent(set, get, (e) => ({ ...e, packages: e.packages.map((p) => (p.id === id ? { ...p, status: next } : p)) }));
    return { undo: () => updateEvent(set, get, (e) => ({ ...e, packages: e.packages.map((p) => (p.id === id && prev ? { ...p, status: prev } : p)) }), eventId) };
  },
  removePackage: (id) => {
    const eventId = get().activeEventId;
    const ev = get().events[eventId];
    if (ev.attendees.some((a) => a.packageId === id)) return null;
    const index = ev.packages.findIndex((p) => p.id === id);
    const item = ev.packages[index];
    const prevDiscounts = new Map(ev.discounts.filter((d) => d.packageIds.includes(id)).map((d) => [d.id, d]));
    updateEvent(set, get, (e) => ({
      ...e,
      packages: e.packages.filter((p) => p.id !== id),
      discounts: e.discounts.map((d) => (d.packageIds.includes(id) ? { ...d, packageIds: d.packageIds.filter((x) => x !== id) } : d)),
    }));
    return {
      undo: () =>
        updateEvent(set, get, (e) => ({ ...e, packages: reinsert(e.packages, [{ index, item }]), discounts: e.discounts.map((d) => prevDiscounts.get(d.id) ?? d) }), eventId),
    };
  },
});
