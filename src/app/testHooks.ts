// window.__rf: a small, harmless control surface used by the test suite and handy in the interview.
type Mode = 'faithful' | 'paper';
type Theme = 'light' | 'dark' | 'system';

export interface TransitionHandle {
  pause(): void;
  seek(seconds: number): void;
  play(): void;
}

export interface RfHooks {
  setMode(mode: Mode, opts?: { instant?: boolean }): void;
  setTheme(theme: Theme): void;
  setReduceMotion(value: boolean | null): void;
  resetData(): void;
  getState(): unknown;
  transition: TransitionHandle | null;
  version: string;
}

declare global {
  interface Window {
    __rf: RfHooks;
  }
}

const handlers: Partial<Pick<RfHooks, 'setMode' | 'setTheme' | 'setReduceMotion' | 'resetData' | 'getState'>> = {};

export function registerHook<K extends keyof typeof handlers>(name: K, fn: NonNullable<(typeof handlers)[K]>) {
  handlers[name] = fn as (typeof handlers)[K];
}

export function setLiveTransition(handle: TransitionHandle | null) {
  window.__rf.transition = handle;
}

export function installTestHooks() {
  window.__rf = {
    setMode: (mode, opts) => handlers.setMode?.(mode, opts),
    setTheme: (theme) => {
      if (handlers.setTheme) handlers.setTheme(theme);
      else document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    },
    setReduceMotion: (value) => handlers.setReduceMotion?.(value),
    resetData: () => handlers.resetData?.(),
    getState: () => handlers.getState?.() ?? null,
    transition: null,
    version: __APP_VERSION__,
  };
  if (!document.documentElement.dataset.theme) document.documentElement.dataset.theme = 'light';
}
