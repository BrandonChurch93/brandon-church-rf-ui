// Transient shell state (never persisted): which global layers are open, and cross-view intents
// such as "open the Add attendee sheet" raised by the command palette.
import { create } from 'zustand';
import type { Route } from './hooks/useHashRoute';

export type IntentType =
  | 'add-attendee'
  | 'open-attendee'
  | 'add-workflow'
  | 'generate-code'
  | 'add-session'
  | 'add-exhibitor'
  | 'add-type'
  | 'add-package'
  | 'add-discount';

export interface Intent {
  id: number;
  type: IntentType;
  payload?: string;
}

interface ShellState {
  palette: boolean;
  about: { open: boolean; section?: 'shortcuts' };
  drawer: boolean;
  eventEditor: null | 'edit' | 'create';
  switcher: boolean;
  intent: Intent | null;
  setPalette(open: boolean): void;
  openAbout(section?: 'shortcuts'): void;
  closeAbout(): void;
  setDrawer(open: boolean): void;
  setEventEditor(mode: null | 'edit' | 'create'): void;
  setSwitcher(open: boolean): void;
  raise(type: IntentType, payload?: string): void;
  consume(id: number): void;
}

let n = 0;
export const useShell = create<ShellState>((set, get) => ({
  palette: false,
  about: { open: false },
  drawer: false,
  eventEditor: null,
  switcher: false,
  intent: null,
  setPalette: (palette) => set({ palette }),
  openAbout: (section) => set({ about: { open: true, section } }),
  closeAbout: () => set({ about: { open: false } }),
  setDrawer: (drawer) => set({ drawer }),
  setEventEditor: (eventEditor) => set({ eventEditor }),
  setSwitcher: (switcher) => set({ switcher }),
  raise: (type, payload) => set({ intent: { id: ++n, type, payload } }),
  consume: (id) => {
    if (get().intent?.id === id) set({ intent: null });
  },
}));

/** Which view handles each intent, so the palette can navigate there first. */
export const INTENT_ROUTE: Record<IntentType, Route> = {
  'add-attendee': 'attendees',
  'open-attendee': 'attendees',
  'add-workflow': 'guide',
  'generate-code': 'reg-codes',
  'add-session': 'content',
  'add-exhibitor': 'exhibitors',
  'add-type': 'attendee-types',
  'add-package': 'packages',
  'add-discount': 'discounts',
};

/** Intents whose target view handles them. Each view phase registers its own. */
export const handledIntents = new Set<IntentType>();
export function registerIntent(...types: IntentType[]) {
  types.forEach((t) => handledIntents.add(t));
}

let switcherAnchor: HTMLElement | null = null;
/** Opens the event switcher anchored to the trigger that asked for it. */
export function openSwitcher(anchor: HTMLElement | null) {
  switcherAnchor = anchor;
  useShell.getState().setSwitcher(true);
}
export const getSwitcherAnchor = () => switcherAnchor;
