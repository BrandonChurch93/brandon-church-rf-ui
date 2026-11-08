import { useLayoutEffect, useRef } from 'react';
import { NAV } from '../routes';
import type { Route } from '../hooks/useHashRoute';
import s from './shell.module.scss';

/** Mobile only: the five attendee sections as a scrollable segmented strip under the view header. */
export function AttendeeSubnav({ route, onNavigate }: { route: Route; onNavigate: (r: Route) => void }) {
  const strip = useRef<HTMLElement>(null);
  const items = NAV.find((n) => n.route === 'attendees')!.children!;
  useLayoutEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[aria-current="page"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [route]);
  return (
    <nav ref={strip} className={s.subnavStrip} aria-label="Attendee sections">
      <div className={s.subnavTrack}>
        {items.map((c) => (
          <a
            key={c.route}
            href={`#${c.route}`}
            className={s.subnavItem}
            aria-current={route === c.route ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(c.route);
            }}
          >
            {c.short}
          </a>
        ))}
      </div>
    </nav>
  );
}
