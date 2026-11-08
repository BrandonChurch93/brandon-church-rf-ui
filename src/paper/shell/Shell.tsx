import { useEffect, useRef, useState } from 'react';
import { Rail } from './Rail';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Drawer } from './Drawer';
import { BottomTabs } from './BottomTabs';
import { CommandPalette } from './CommandPalette';
import { AboutPanel } from './AboutPanel';
import { EventSwitcher } from './EventSwitcher';
import { EventEditor } from './EventEditor';
import { ViewSwitch } from './ViewSwitch';
import { RouteContext } from './routeContext';
import { VIEWS } from '../views';
import { useHashRoute, normalizeHash } from '../hooks/useHashRoute';
import { useHotkey, isTypingTarget } from '../hooks/useHotkey';
import { useShell, getSwitcherAnchor } from '../shellStore';
import { layerStack } from '@/app/layerStack';
import { undoLatest } from '../ui/toastStore';
import s from './shell.module.scss';

interface ShellProps {
  arriving: boolean;
  onViewOriginal: () => void;
  onSignOut: () => void;
}

export function Shell({ arriving, onViewOriginal, onSignOut }: ShellProps) {
  const [route, navigate] = useHashRoute();
  const shell = useShell();
  const main = useRef<HTMLElement>(null);
  const switcherAnchor = useRef<HTMLElement | null>(null);
  const [pendingEvent, setPendingEvent] = useState<string | null>(null);

  useEffect(() => normalizeHash(), []);

  // Global shortcuts (07-shell): Cmd/Ctrl+K palette, ? shortcuts, Cmd/Ctrl+Z undo, Escape with nothing open.
  useHotkey({ key: 'k', mod: true }, (e) => {
    e.preventDefault();
    shell.setPalette(!useShell.getState().palette);
  }, { allowInInputs: true });
  useHotkey({ key: 'z', mod: true, shift: false }, (e) => {
    if (undoLatest()) e.preventDefault();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !isTypingTarget(e.target) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        layerStack.closeAll({ instant: true });
        shell.openAbout('shortcuts');
      } else if (e.key === 'Escape' && layerStack.size() === 0 && !e.defaultPrevented) {
        window.dispatchEvent(new CustomEvent('rf:escape'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shell]);

  switcherAnchor.current = getSwitcherAnchor();

  return (
    <RouteContext.Provider value={{ route, navigate }}>
    <div className={s.shell}>
      <a
        href="#paper-main"
        className={s.skip}
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <Rail route={route} onNavigate={navigate} onSignOut={onSignOut} />
      <Sidebar route={route} onNavigate={navigate} />
      <TopBar onSignOut={onSignOut} />
      <main ref={main} id="paper-main" tabIndex={-1} className={s.body} aria-labelledby="view-title">
        <div className={s.content}>
          <ViewSwitch route={route} onNavigate={navigate} views={VIEWS} arriving={arriving} pendingEvent={pendingEvent} onEventSwitched={() => setPendingEvent(null)} />
        </div>
      </main>
      <BottomTabs route={route} onNavigate={navigate} hidden={arriving} />
      <Drawer route={route} onNavigate={navigate} />
      <CommandPalette onNavigate={navigate} onViewOriginal={onViewOriginal} />
      <AboutPanel onViewOriginal={onViewOriginal} />
      <EventSwitcher open={shell.switcher} onClose={() => shell.setSwitcher(false)} anchor={switcherAnchor} onSwitch={(id) => setPendingEvent(id)} />
      <EventEditor onCreated={() => undefined} />
    </div>
    </RouteContext.Provider>
  );
}
