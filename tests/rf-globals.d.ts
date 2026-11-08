// The window.__rf test hooks as seen from inside page.evaluate (see src/app/testHooks.ts).
export {};

declare global {
  interface Window {
    __rf: {
      setMode(mode: 'faithful' | 'paper', opts?: { instant?: boolean }): void;
      setTheme(theme: 'light' | 'dark' | 'system'): void;
      setReduceMotion(value: boolean | null): void;
      resetData(): void;
      // The store snapshot is deliberately loose here; tests read the fields they need.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getState(): any;
      transition: null | { pause(): void; seek(seconds: number): void; play(): void };
      version: string;
    };
  }
}
