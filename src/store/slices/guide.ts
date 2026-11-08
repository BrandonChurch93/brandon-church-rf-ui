import type { AttributeField, CalendarSettings, CommunicationsSettings, GeneralSettings, Id, PortalSettings, Workflow } from '../types';
import type { GetState, SetState } from '../store';
import { updateEvent } from '../store';
import { uid } from '../ids';
import type { UndoToken } from '../undo';

export interface GuideSlice {
  saveGeneral(g: GeneralSettings): void;
  saveAttributes(fields: AttributeField[]): void;
  saveCommunications(c: CommunicationsSettings): void;
  addWorkflow(input: Omit<Workflow, 'id' | 'updatedAt'>): Id;
  updateWorkflow(id: Id, patch: Partial<Omit<Workflow, 'id'>>): void;
  duplicateWorkflow(id: Id): Id | null;
  removeWorkflow(id: Id): UndoToken;
  reorderWorkflows(ids: Id[]): void;
  savePortal(p: PortalSettings): void;
  saveCalendar(c: CalendarSettings): void;
}

const now = () => new Date().toISOString();

/** "Employee Registration" becomes "Employee Registration 2" if taken (then 3, ...). */
export function uniqueName(name: string, taken: string[]) {
  const set = new Set(taken.map((t) => t.toLowerCase()));
  if (!set.has(name.toLowerCase())) return name;
  let n = 2;
  while (set.has(`${name} ${n}`.toLowerCase())) n++;
  return `${name} ${n}`;
}

export const guideSlice = (set: SetState, get: GetState): GuideSlice => {
  const settings = <K extends 'general' | 'attributes' | 'communications'>(key: K, value: unknown) =>
    updateEvent(set, get, (e) => ({ ...e, guide: { ...e.guide, settings: { ...e.guide.settings, [key]: value } } }));
  const workflows = (fn: (w: Workflow[]) => Workflow[]) => updateEvent(set, get, (e) => ({ ...e, guide: { ...e.guide, workflows: fn(e.guide.workflows) } }));

  return {
    saveGeneral: (g) => settings('general', g),
    saveAttributes: (fields) => settings('attributes', { fields }),
    saveCommunications: (c) => settings('communications', c),
    addWorkflow: (input) => {
      const id = uid();
      workflows((list) => [...list, { ...input, id, updatedAt: now() }]);
      return id;
    },
    updateWorkflow: (id, patch) => workflows((list) => list.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: now() } : w))),
    duplicateWorkflow: (id) => {
      const ev = get().events[get().activeEventId];
      const src = ev.guide.workflows.find((w) => w.id === id);
      if (!src) return null;
      const copy: Workflow = {
        ...structuredClone(src),
        id: uid(),
        name: uniqueName(`${src.name} copy`, ev.guide.workflows.map((w) => w.name)),
        status: 'draft',
        updatedAt: now(),
        steps: src.steps.map((s) => ({ ...s, id: uid() })),
      };
      workflows((list) => {
        const i = list.findIndex((w) => w.id === id);
        return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
      });
      return copy.id;
    },
    removeWorkflow: (id) => {
      const eventId = get().activeEventId;
      const list = get().events[eventId].guide.workflows;
      const index = list.findIndex((w) => w.id === id);
      const item = list[index];
      workflows((l) => l.filter((w) => w.id !== id));
      return {
        undo: () =>
          updateEvent(
            set,
            get,
            (e) => {
              const l = [...e.guide.workflows];
              l.splice(Math.min(index, l.length), 0, item);
              return { ...e, guide: { ...e.guide, workflows: l } };
            },
            eventId,
          ),
      };
    },
    reorderWorkflows: (ids) =>
      workflows((list) => {
        const byId = new Map(list.map((w) => [w.id, w]));
        const ordered = ids.map((i) => byId.get(i)).filter(Boolean) as Workflow[];
        const rest = list.filter((w) => !ids.includes(w.id));
        return [...ordered, ...rest];
      }),
    savePortal: (p) => updateEvent(set, get, (e) => ({ ...e, guide: { ...e.guide, experiences: { ...e.guide.experiences, portal: p } } })),
    saveCalendar: (c) => updateEvent(set, get, (e) => ({ ...e, guide: { ...e.guide, experiences: { ...e.guide.experiences, calendar: c } } })),
  };
};
