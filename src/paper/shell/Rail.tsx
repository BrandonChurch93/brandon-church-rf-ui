import { useLayoutEffect, useRef, useState } from 'react';
import { Tooltip } from '../ui/Tooltip';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/display';
import { Popover } from '../ui/overlay/Popover';
import { EventLogo } from './EventLogo';
import { AccountMenu, USER } from './AccountMenu';
import { useStore, selectActive } from '@/store/store';
import { useShell, openSwitcher } from '../shellStore';
import { NAV, topLevelOf } from '../routes';
import type { Route } from '../hooks/useHashRoute';
import rfMark from '@/assets/icons/rf-logo.svg';
import s from './shell.module.scss';

interface RailProps {
  route: Route;
  onNavigate: (r: Route) => void;
  onSignOut: () => void;
}

/** 64 px rail: rf mark (About), event badge (switcher), avatar (account). At lg it also carries the nav. */
export function Rail({ route, onNavigate, onSignOut }: RailProps) {
  const ev = useStore(selectActive);
  const openAbout = useShell((st) => st.openAbout);
  const setPalette = useShell((st) => st.setPalette);
  const [account, setAccount] = useState(false);
  const avatar = useRef<HTMLButtonElement>(null);

  return (
    <aside className={s.rail} aria-label="App" data-part>
      <div className={s.railGroup}>
        <Tooltip content="About this build" placement="right" describe={false}>
          <button type="button" className={`${s.railButton} ${s.railMark}`} aria-label="About this build" onClick={() => openAbout()}>
            <img src={rfMark} alt="" />
          </button>
        </Tooltip>
        <Tooltip content={ev.name} placement="right" describe={false}>
          <button type="button" className={`${s.railButton} ${s.railBadge}`} aria-label={`Switch event. Current event: ${ev.name}`} data-switcher-anchor onClick={(e) => openSwitcher(e.currentTarget)}>
            <EventLogo key={ev.id + (ev.logo.kind === 'custom' ? ev.logo.dataUrl.length : '')} logo={ev.logo} size={32} className="rf-fade-in" />
          </button>
        </Tooltip>
        <RailNav route={route} onNavigate={onNavigate} onSearch={() => setPalette(true)} />
      </div>
      <div className={s.railGroup}>
        <Tooltip content="Account" placement="right" describe={false}>
          <button ref={avatar} type="button" className={s.avatarButton} aria-label="FL, Account" aria-haspopup="dialog" aria-expanded={account} onClick={() => setAccount((v) => !v)}>
            <Avatar name={USER.name} initials="FL" self size={32} />
          </button>
        </Tooltip>
        <AccountMenu open={account} onClose={() => setAccount(false)} anchor={avatar} onSignOut={onSignOut} />
      </div>
    </aside>
  );
}

/** The lg icon rail: search, the four nav icons and a flyout for the Attendees sections. */
function RailNav({ route, onNavigate, onSearch }: { route: Route; onNavigate: (r: Route) => void; onSearch: () => void }) {
  const top = topLevelOf(route);
  const box = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<number | null>(null);
  const [flyout, setFlyout] = useState(false);
  const attendees = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = box.current?.querySelector<HTMLElement>(`[data-nav="${top}"]`);
    if (el) setBar(el.offsetTop + 10);
  }, [top]);

  const holdOpen = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setFlyout(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFlyout(false), 220);
  };
  const children = NAV.find((n) => n.route === 'attendees')!.children!;

  return (
    <div ref={box} className={s.railNav}>
      <span className={s.railDivider} aria-hidden="true" />
      <Tooltip content="Search" placement="right" describe={false}>
        <button type="button" className={`${s.railButton} ${s.railSearch}`} aria-label="Search" aria-keyshortcuts="Meta+K Control+K" onClick={onSearch}>
          <Icon name="search" size={20} />
        </button>
      </Tooltip>
      {bar !== null && <span className={s.railIndicator} style={{ transform: `translateY(${bar}px)` }} aria-hidden="true" />}
      {NAV.map((n) =>
        n.children ? (
          <a
            key={n.route}
            ref={attendees}
            href={`#${n.route}`}
            data-nav={n.route}
            data-active={top === n.route}
            className={`${s.railButton} ${s.railNavItem}`}
            aria-label={`${n.label}, ${children.length} sections`}
            aria-haspopup="menu"
            aria-expanded={flyout}
            onPointerEnter={(e) => e.pointerType === 'mouse' && holdOpen()}
            onPointerLeave={(e) => e.pointerType === 'mouse' && scheduleClose()}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                holdOpen();
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(n.route);
              setFlyout(false);
            }}
          >
            <Icon name={n.icon} size={20} />
          </a>
        ) : (
          <Tooltip key={n.route} content={n.label} placement="right" describe={false}>
            <a
              href={`#${n.route}`}
              data-nav={n.route}
              data-active={top === n.route}
              aria-current={route === n.route ? 'page' : undefined}
              aria-label={n.label}
              className={`${s.railButton} ${s.railNavItem}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(n.route);
              }}
            >
              <Icon name={n.icon} size={20} />
            </a>
          </Tooltip>
        ),
      )}
      <Popover open={flyout} onClose={() => setFlyout(false)} anchor={attendees} label="Attendees" placement="right-start" width={210} role="presentation" trap={false} alwaysAnchored initialFocus="none" className={s.flyout}>
        <div onPointerEnter={holdOpen} onPointerLeave={scheduleClose}>
          <div className={s.flyoutTitle}>Attendees</div>
          <div role="menu" aria-label="Attendees" style={{ padding: 6, display: 'flex', flexDirection: 'column' }}>
            {children.map((c, i) => (
              <a
                key={c.route}
                role="menuitem"
                href={`#${c.route}`}
                className={s.subItem}
                style={{ paddingLeft: 12 }}
                aria-current={route === c.route ? 'page' : undefined}
                ref={(el) => {
                  if (el && i === 0 && flyout && document.activeElement === attendees.current) requestAnimationFrame(() => el.focus());
                }}
                onKeyDown={(e) => {
                  const items = Array.from(e.currentTarget.parentElement!.querySelectorAll<HTMLElement>('a'));
                  const k = items.indexOf(e.currentTarget);
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    items[(k + 1) % items.length].focus();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    items[(k - 1 + items.length) % items.length].focus();
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setFlyout(false);
                    attendees.current?.focus();
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setFlyout(false);
                  onNavigate(c.route);
                }}
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </Popover>
    </div>
  );
}
