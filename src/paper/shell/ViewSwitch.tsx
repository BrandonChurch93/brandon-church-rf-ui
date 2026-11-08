import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { gsap } from 'gsap';
import type { Route } from '../hooks/useHashRoute';
import { isReducedMotion } from '@/motion/reduced';
import { useStore } from '@/store/store';
import { useShell } from '../shellStore';

export interface ViewProps {
  route: Route;
  onNavigate: (r: Route) => void;
}

interface ViewSwitchProps extends ViewProps {
  views: Record<Route, ComponentType<ViewProps>>;
  arriving: boolean;
  /** Set by the event switcher: fade out, then switch the event's data, then enter. */
  pendingEvent: string | null;
  onEventSwitched: () => void;
}

/** Fades the outgoing view out (240 ms) and staggers the incoming view's parts in (360 ms, 60 ms apart). */
export function ViewSwitch({ route, onNavigate, views, arriving, pendingEvent, onEventSwitched }: ViewSwitchProps) {
  const [shown, setShown] = useState(route);
  const box = useRef<HTMLDivElement>(null);
  const entering = useRef(false);
  const switchEvent = useStore((st) => st.switchEvent);
  const eventId = useStore((st) => st.activeEventId);
  const layer = () => document.querySelector<HTMLElement>('[data-layer="paper"]');

  const leaveThen = (after: () => void) => {
    const el = box.current;
    if (!el || isReducedMotion()) {
      after();
      return;
    }
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: 0, y: -6, duration: 0.24, ease: 'power2.in', onComplete: after });
  };

  useEffect(() => {
    if (route === shown) return;
    leaveThen(() => {
      const l = layer();
      if (l) l.scrollTop = 0;
      entering.current = true;
      setShown(route);
      useShell.getState().setDrawer(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  useEffect(() => {
    if (!pendingEvent) return;
    leaveThen(() => {
      switchEvent(pendingEvent);
      const l = layer();
      if (l) l.scrollTop = 0;
      entering.current = true;
      onEventSwitched();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvent]);

  const lastEvent = useRef(eventId);
  useLayoutEffect(() => {
    const el = box.current;
    const eventChanged = lastEvent.current !== eventId;
    lastEvent.current = eventId;
    if (!el || (!entering.current && !eventChanged) || arriving) return;
    entering.current = false;
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'opacity,transform' });
    if (isReducedMotion()) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15, clearProps: 'opacity' });
      return;
    }
    const parts = Array.from(el.querySelectorAll<HTMLElement>(':scope > * > [data-part], :scope > [data-part]')).slice(0, 8);
    gsap.fromTo(parts, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.36, ease: 'power3.out', stagger: 0.06, clearProps: 'opacity,transform' });
  }, [shown, eventId, arriving]);

  const View = views[shown];
  return (
    <div ref={box} key={eventId}>
      <View route={shown} onNavigate={onNavigate} />
    </div>
  );
}
