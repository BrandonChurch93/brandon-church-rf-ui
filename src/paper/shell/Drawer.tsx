import { useRef, type PointerEvent as RPointerEvent } from 'react';
import { Portal } from '../ui/overlay/Portal';
import { useOverlay } from '../ui/overlay/useOverlay';
import { usePresence } from '../hooks/usePresence';
import { IconButton } from '../ui/IconButton';
import { SidebarContent } from './Sidebar';
import { useShell } from '../shellStore';
import type { Route } from '../hooks/useHashRoute';
import rfMark from '@/assets/icons/rf-logo.svg';
import o from '../ui/overlay/overlay.module.scss';
import s from './shell.module.scss';

const SWIPE_CLOSE_PX = 80;

/** Mobile navigation drawer from the left: focus trapped; Escape, scrim tap or swipe left close it. */
export function Drawer({ route, onNavigate }: { route: Route; onNavigate: (r: Route) => void }) {
  const open = useShell((st) => st.drawer);
  const setOpen = useShell((st) => st.setDrawer);
  const presence = usePresence(open, 320);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const close = (c?: { instant?: boolean }) => {
    if (c?.instant) presence.skipExit();
    setOpen(false);
  };
  useOverlay({ open: presence.mounted && open, onClose: close, container: panel, trap: true, stepAside: true, lockScroll: true, initialFocus: 'first' });

  const onDown = (e: RPointerEvent) => {
    if (e.pointerType === 'mouse') return;
    drag.current = { x: e.clientX, dx: 0 };
  };
  const onMove = (e: RPointerEvent) => {
    if (!drag.current || !panel.current) return;
    const dx = Math.min(0, e.clientX - drag.current.x);
    drag.current.dx = dx;
    if (dx < -6) {
      panel.current.setAttribute('data-dragging', 'true');
      panel.current.style.transform = `translateX(${dx}px)`;
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!panel.current || !d) return;
    panel.current.removeAttribute('data-dragging');
    panel.current.style.transform = '';
    if (d.dx < -SWIPE_CLOSE_PX) close();
  };

  if (!presence.mounted) return null;
  const state = presence.state === 'open' ? 'open' : 'closed';
  return (
    <Portal>
      <div className={s.drawerRoot}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- scrim is a pointer affordance; Escape and the close button cover the keyboard */}
        <div className={o.scrim} data-state={state} onClick={() => close()} />
        <div
          ref={panel}
          id="paper-drawer"
          className={s.drawer}
          data-state={state}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          tabIndex={-1}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className={s.drawerHeader}>
            <img src={rfMark} alt="RainFocus" />
            <IconButton icon="x" label="Close navigation" tooltip={false} onClick={() => close()} />
          </div>
          <SidebarContent
            route={route}
            idPrefix="drawer"
            onNavigate={(r) => {
              onNavigate(r);
              window.setTimeout(() => close(), 120);
            }}
          />
        </div>
      </div>
    </Portal>
  );
}
