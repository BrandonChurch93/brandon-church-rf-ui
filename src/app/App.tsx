import { useEffect } from 'react';
import { ModeStage } from './ModeStage';
import { useThemeSync } from './theme';
import { registerHook } from './testHooks';
import { useStore } from '@/store/store';

export function App() {
  useThemeSync();
  useEffect(() => {
    registerHook('setTheme', (t) => useStore.getState().setTheme(t));
    registerHook('setReduceMotion', (v) => useStore.getState().setReduceMotion(v));
    registerHook('getState', () => JSON.parse(JSON.stringify(useStore.getState())));
    registerHook('resetData', () => useStore.getState().resetDemoData());
  }, []);
  return <ModeStage />;
}
