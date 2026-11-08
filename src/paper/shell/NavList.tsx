import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { NAV, topLevelOf } from '../routes';
import type { Route } from '../hooks/useHashRoute';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';
import { useStore } from '@/store/store';
import { isReducedMotion } from '@/motion/reduced';
import s from './shell.module.scss';

interface NavListProps {
  route: Route;
  onNavigate: (r: Route) => void;
  idPrefix: string;
}

/** The mega nav: four groups, Attendees expandable, one indicator bar that slides between items. */
export function NavList({ route, onNavigate, idPrefix }: NavListProps) {
  const top = topLevelOf(route);
  const stored = useStore((st) => st.ui.sidebarGroups.attendees ?? true);
  const setGroup = useStore((st) => st.setSidebarGroup);
  const childActive = top === 'attendees';
  const open = stored || childActive;
  const nav = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    const measure = () => {
      const item = el.querySelector<HTMLElement>(`[data-nav="${top}"]`);
      if (item) setBar(item.offsetTop + 10);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
    };
  }, [top]);

  return (
    <div ref={nav} className={s.nav}>
      {bar !== null && <span className={`${s.navIndicator} ${animate ? s.animate : ''}`} style={{ transform: `translateY(${bar}px)` }} aria-hidden="true" />}
      {NAV.map((item) => {
        const active = top === item.route;
        if (!item.children)
          return (
            <a
              key={item.route}
              href={`#${item.route}`}
              data-nav={item.route}
              data-active={active}
              aria-current={route === item.route ? 'page' : undefined}
              className={s.navItem}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.route);
              }}
            >
              <Icon name={item.icon} size={18} />
              <span className={s.navLabel}>{item.label}</span>
            </a>
          );
        const groupId = `${idPrefix}-group-${item.route}`;
        return (
          <div key={item.route}>
            <div className={s.navRow}>
              <a
                href={`#${item.route}`}
                data-nav={item.route}
                data-active={active}
                className={s.navItem}
                onClick={(e) => {
                  e.preventDefault();
                  setGroup('attendees', true);
                  onNavigate(item.route);
                }}
              >
                <Icon name={item.icon} size={18} />
                <span className={s.navLabel}>{item.label}</span>
              </a>
              <Tooltip content={childActive ? 'Stays open while you are in this section' : open ? 'Collapse' : 'Expand'} describe={childActive}>
                <button
                  type="button"
                  className={s.navToggle}
                  aria-expanded={open}
                  aria-controls={groupId}
                  aria-label={open ? 'Collapse Attendees' : 'Expand Attendees'}
                  aria-disabled={childActive || undefined}
                  onClick={() => !childActive && setGroup('attendees', !open)}
                >
                  <Icon name="chevron-right" size={16} />
                </button>
              </Tooltip>
            </div>
            <SubList id={groupId} open={open}>
              {item.children.map((c) => (
                <a
                  key={c.route}
                  href={`#${c.route}`}
                  className={s.subItem}
                  aria-current={route === c.route ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(c.route);
                  }}
                >
                  {c.label}
                </a>
              ))}
            </SubList>
          </div>
        );
      })}
    </div>
  );
}

/** Expand (480 ms, children stagger in) and collapse (children fade first, then 320 ms). */
function SubList({ id, open, children }: { id: string; open: boolean; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('a'));
    if (first.current) {
      first.current = false;
      gsap.set(el, { height: open ? 'auto' : 0 });
      return;
    }
    gsap.killTweensOf([el, ...items]);
    if (isReducedMotion()) {
      gsap.set(el, { height: open ? 'auto' : 0 });
      gsap.set(items, { clearProps: 'opacity,transform' });
      return;
    }
    if (open) {
      gsap.fromTo(el, { height: el.offsetHeight }, { height: el.scrollHeight, duration: 0.48, ease: 'power3.out', onComplete: () => gsap.set(el, { height: 'auto' }) });
      gsap.fromTo(items, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out', stagger: 0.04, clearProps: 'opacity,transform' });
    } else {
      gsap.to(items, { opacity: 0, duration: 0.12, ease: 'power2.in' });
      gsap.fromTo(el, { height: el.offsetHeight }, { height: 0, duration: 0.32, ease: 'power2.in', delay: 0.08, onComplete: () => gsap.set(items, { clearProps: 'opacity' }) });
    }
  }, [open]);
  return (
    <div ref={outer} id={id} className={s.subList} inert={!open}>
      <div className={s.subInner}>{children}</div>
    </div>
  );
}
