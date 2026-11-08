// The app store: one Zustand store, persisted to localStorage under rf-ui.v1 (debounced 200 ms).
// Each event owns its data; selectors always read through the active event.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Currency, EventLogo, EventRecord, Id, ISODate, Swatch, ThemePref, UiState } from './types';
import { SWATCHES } from './types';
import { debouncedStorage, flushStorage, STORAGE_KEY } from './storage';
import { isValidEvent, seedEvent, seedState } from './seed';
import { uid } from './ids';
import { guideSlice, type GuideSlice } from './slices/guide';
import { attendeesSlice, type AttendeesSlice } from './slices/attendees';
import { typesSlice, type TypesSlice } from './slices/types';
import { packagesSlice, type PackagesSlice } from './slices/packages';
import { codesSlice, type CodesSlice } from './slices/codes';
import { discountsSlice, type DiscountsSlice } from './slices/discounts';
import { contentSlice, type ContentSlice } from './slices/content';
import { exhibitorsSlice, type ExhibitorsSlice } from './slices/exhibitors';

export const STORE_VERSION = 1;

export interface EventDetailsInput {
  name: string;
  startDate: ISODate;
  endDate: ISODate | null;
  location: string;
  timezone: string;
  currency: Currency;
  description: string;
  logo?: EventLogo;
}

export interface CoreSlice {
  version: number;
  activeEventId: Id;
  events: Record<Id, EventRecord>;
  eventOrder: Id[];
  ui: UiState;
  /** One-time notices raised while loading (version reseed, invalid record). Read and cleared by the shell. */
  notices: string[];

  switchEvent(id: Id): void;
  createEvent(input: EventDetailsInput): Id;
  updateEventDetails(patch: Partial<EventDetailsInput>): void;
  setEventLogo(logo: EventLogo): void;
  setModuleCollapsed(collapsed: boolean): void;
  resetDemoData(): void;
  consumeNotices(): string[];

  setTheme(theme: ThemePref): void;
  setReduceMotion(value: boolean | null): void;
  setSidebarGroup(group: string, open: boolean): void;
  pushRecentCommand(id: string): void;
  setGuideShowAll(key: string, value: boolean): void;
  setSignedOut(value: boolean): void;
}

export type AppState = CoreSlice & GuideSlice & AttendeesSlice & TypesSlice & PackagesSlice & CodesSlice & DiscountsSlice & ContentSlice & ExhibitorsSlice;
export type SetState = (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
export type GetState = () => AppState;

export const defaultUi = (): UiState => ({
  theme: 'light',
  reduceMotion: null,
  sidebarGroups: { attendees: true },
  recentCommands: [],
  guideShowAll: {},
  signedOut: false,
});

/** Replace the active event (or a given one) with fn(event). */
export function updateEvent(set: SetState, get: GetState, fn: (e: EventRecord) => EventRecord, eventId?: Id) {
  const id = eventId ?? get().activeEventId;
  const ev = get().events[id];
  if (!ev) return;
  set((s) => ({ events: { ...s.events, [id]: fn(ev) } }));
}

const BOOTH_ROWS = ['A', 'B', 'C', 'D'] as const;

/** "Create event" defaults (16-data-model.md, New event defaults). */
export function newEventRecord(input: EventDetailsInput, existing: EventRecord[]): EventRecord {
  const id = `evt-${uid()}`;
  const words = input.name.trim().split(/\s+/).filter(Boolean);
  const letters = (words.length > 1 ? words[0][0] + words[1][0] : (words[0]?.[0] ?? 'E')).toUpperCase();
  const usedSwatches = new Set(existing.map((e) => (e.logo.kind === 'monogram' ? e.logo.swatch : null)).filter(Boolean) as Swatch[]);
  const swatch = SWATCHES.find((sw) => !usedSwatches.has(sw)) ?? 'grape';
  const typeId = uid();
  return {
    id,
    slug: input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    name: input.name.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    location: input.location.trim(),
    timezone: input.timezone,
    currency: input.currency,
    description: input.description,
    logo: input.logo ?? { kind: 'monogram', letters, swatch },
    agenda: { startMinutes: 480, endMinutes: 1080 },
    guide: {
      settings: { general: null, attributes: null, communications: null },
      workflows: [],
      experiences: { portal: null, calendar: null },
    },
    attendeeTypes: [{ id: typeId, name: 'Attendee', description: 'General admission attendees', swatch: 'grape', isDefault: true }],
    attendees: [],
    packages: [],
    regCodes: [],
    discounts: [],
    tracks: [{ id: uid(), name: 'Main Stage', swatch: 'grape' }],
    sessions: [],
    exhibitors: [],
    booths: BOOTH_ROWS.flatMap((row) => [1, 2, 3, 4, 5, 6].map((col) => ({ id: `${id}-booth-${row}${col}`, label: `${row}${col}`, row, col: col as 1 | 2 | 3 | 4 | 5 | 6 }))),
    moduleCollapsed: false,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      version: STORE_VERSION,
      ...seedState(),
      ui: defaultUi(),
      notices: [],

      switchEvent: (id) => {
        if (get().events[id]) set({ activeEventId: id });
      },
      createEvent: (input) => {
        const ev = newEventRecord(input, Object.values(get().events));
        set((s) => ({ events: { ...s.events, [ev.id]: ev }, eventOrder: [...s.eventOrder, ev.id], activeEventId: ev.id }));
        return ev.id;
      },
      updateEventDetails: (patch) => updateEvent(set, get, (e) => ({ ...e, ...patch, name: patch.name?.trim() ?? e.name })),
      setEventLogo: (logo) => updateEvent(set, get, (e) => ({ ...e, logo })),
      setModuleCollapsed: (collapsed) => updateEvent(set, get, (e) => ({ ...e, moduleCollapsed: collapsed })),
      resetDemoData: () => {
        set({ ...seedState(), ui: { ...get().ui, guideShowAll: {}, recentCommands: [] } });
        flushStorage();
      },
      consumeNotices: () => {
        const n = get().notices;
        if (n.length) set({ notices: [] });
        return n;
      },

      setTheme: (theme) => set((s) => ({ ui: { ...s.ui, theme } })),
      setReduceMotion: (value) => set((s) => ({ ui: { ...s.ui, reduceMotion: value } })),
      setSidebarGroup: (group, open) => set((s) => ({ ui: { ...s.ui, sidebarGroups: { ...s.ui.sidebarGroups, [group]: open } } })),
      pushRecentCommand: (id) => set((s) => ({ ui: { ...s.ui, recentCommands: [id, ...s.ui.recentCommands.filter((c) => c !== id)].slice(0, 5) } })),
      setGuideShowAll: (key, value) => set((s) => ({ ui: { ...s.ui, guideShowAll: { ...s.ui.guideShowAll, [key]: value } } })),
      setSignedOut: (value) => set((s) => ({ ui: { ...s.ui, signedOut: value } })),

      ...guideSlice(set, get),
      ...attendeesSlice(set, get),
      ...typesSlice(set, get),
      ...packagesSlice(set, get),
      ...codesSlice(set, get),
      ...discountsSlice(set, get),
      ...contentSlice(set, get),
      ...exhibitorsSlice(set, get),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (s) => ({ version: s.version, activeEventId: s.activeEventId, events: s.events, eventOrder: s.eventOrder, ui: s.ui }),
      // A stored version that differs from the current one reseeds everything.
      migrate: () => ({ ...seedState(), version: STORE_VERSION, ui: defaultUi(), notices: ['Demo data was updated'] }) as unknown as AppState,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const notices = [...(p.notices ?? [])];
        const events: Record<Id, EventRecord> = {};
        for (const [id, ev] of Object.entries(p.events ?? {})) {
          if (isValidEvent(ev)) events[id] = ev;
          else {
            const fresh = seedEvent(id);
            console.warn(`rf-ui: stored data for event ${id} failed validation and was restored from the seed.`);
            if (fresh) events[id] = fresh;
          }
        }
        const hasEvents = Object.keys(events).length > 0;
        const order = (p.eventOrder ?? []).filter((id) => events[id]);
        return {
          ...current,
          ...(hasEvents
            ? { events, eventOrder: order.length ? order : Object.keys(events), activeEventId: p.activeEventId && events[p.activeEventId] ? p.activeEventId : (order[0] ?? current.activeEventId) }
            : {}),
          ui: { ...current.ui, ...(p.ui ?? {}) },
          notices,
        };
      },
    },
  ),
);

// ---------- Selectors ----------
export const useActiveEvent = () => useStore((s) => s.events[s.activeEventId]);
export const selectActive = (s: AppState) => s.events[s.activeEventId];
