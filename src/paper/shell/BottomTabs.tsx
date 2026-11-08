import { useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { NAV, topLevelOf } from '../routes';
import type { Route } from '../hooks/useHashRoute';
import { useLayerCount } from '@/app/layerStack';
import s from './shell.module.scss';

/** Mobile tab bar: the four sections, with an indicator that slides between tabs. */
export function BottomTabs({ route, onNavigate, hidden }: { route: Route; onNavigate: (r: Route) => void; hidden?: boolean }) {
  const top = topLevelOf(route);
  const layers = useLayerCount();
  const box = useRef<HTMLDivElement>(null);
  const [x, setX] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => {
    const measure = () => {
      const el = box.current?.querySelector<HTMLElement>(`[data-tab="${top}"]`);
      if (el) setX(el.offsetLeft + el.offsetWidth / 2 - 10);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
    };
  }, [top]);
  return (
    <nav className={s.tabbar} aria-label="Sections" data-hidden={hidden || layers > 0 ? 'true' : 'false'}>
      <div ref={box} className={s.tabs}>
        {x !== null && <span className={`${s.tabIndicator} ${animate ? s.animate : ''}`} style={{ transform: `translateX(${x}px)` }} aria-hidden="true" />}
        {NAV.map((n) => (
          <a
            key={n.route}
            href={`#${n.route}`}
            data-tab={n.route}
            data-active={top === n.route}
            aria-current={top === n.route ? 'page' : undefined}
            className={s.tab}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(n.route);
            }}
          >
            <Icon name={n.icon} size={20} />
            {n.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
