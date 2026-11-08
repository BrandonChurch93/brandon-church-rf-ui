import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';
import { SearchOpener } from '../ui/SearchField';
import { NavList } from './NavList';
import { useStore, selectActive } from '@/store/store';
import { useShell, openSwitcher } from '../shellStore';
import { formatDateShort } from '../lib/format';
import type { Route } from '../hooks/useHashRoute';
import s from './shell.module.scss';

/** Event block, search (opens the palette), the mega nav and a quiet footer. */
export function SidebarContent({ route, onNavigate, idPrefix }: { route: Route; onNavigate: (r: Route) => void; idPrefix: string }) {
  const ev = useStore(selectActive);
  const setPalette = useShell((st) => st.setPalette);
  const meta = `${ev.location} · ${formatDateShort(ev.startDate)}`;
  return (
    <>
      <Tooltip content={`${ev.name} · ${meta}`} placement="bottom-start" describe={false}>
        <button type="button" className={s.eventBlock} data-switcher-anchor aria-haspopup="menu" onClick={(e) => openSwitcher(e.currentTarget)}>
          <span key={ev.id} className={`${s.eventText} rf-fade-in`}>
            <span className={s.eventName}>{ev.name}</span>
            <span className={s.eventMeta}>{meta}</span>
          </span>
          <span className="sr-only">, switch event</span>
          <Icon name="chevrons-up-down" size={16} className={s.eventChevron} />
        </button>
      </Tooltip>
      <div className={s.sidebarSearch}>
        <SearchOpener onOpen={() => setPalette(true)} />
      </div>
      <nav aria-label="Event navigation">
        <NavList route={route} onNavigate={onNavigate} idPrefix={idPrefix} />
      </nav>
    </>
  );
}

export function Sidebar({ route, onNavigate }: { route: Route; onNavigate: (r: Route) => void }) {
  return (
    <div className={s.sidebar} data-part>
      <SidebarContent route={route} onNavigate={onNavigate} idPrefix="sidebar" />
      <div className={s.sidebarFooter}>RainFocus · Admin</div>
    </div>
  );
}
