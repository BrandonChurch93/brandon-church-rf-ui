// The app store: one Zustand store, persisted to localStorage under rf-ui.v1.
// P2 holds the ui slice; event data joins in P3 and P4.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemePref, UiState } from './types';
import { debouncedStorage, STORAGE_KEY } from './storage';

export const STORE_VERSION = 1;

export interface AppState {
  ui: UiState;
  setTheme(theme: ThemePref): void;
  setReduceMotion(value: boolean | null): void;
}

export const defaultUi = (): UiState => ({
  theme: 'light',
  reduceMotion: null,
  sidebarGroups: { attendees: true },
  recentCommands: [],
  guideShowAll: {},
  signedOut: false,
});

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ui: defaultUi(),
      setTheme: (theme) => set((s) => ({ ui: { ...s.ui, theme } })),
      setReduceMotion: (value) => set((s) => ({ ui: { ...s.ui, reduceMotion: value } })),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (s) => ({ ui: s.ui }),
    },
  ),
);
