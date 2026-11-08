import { useRef, useState } from 'react';
import { IconButton } from '../ui/IconButton';
import { Avatar } from '../ui/display';
import { EventLogo } from './EventLogo';
import { AccountMenu, USER } from './AccountMenu';
import { useStore, selectActive } from '@/store/store';
import { useShell, openSwitcher } from '../shellStore';
import s from './shell.module.scss';

/** Mobile top bar: menu, event badge and name, search, account. */
export function TopBar({ onSignOut }: { onSignOut: () => void }) {
  const ev = useStore(selectActive);
  const drawer = useShell((st) => st.drawer);
  const setDrawer = useShell((st) => st.setDrawer);
  const setPalette = useShell((st) => st.setPalette);
  const [account, setAccount] = useState(false);
  const avatar = useRef<HTMLButtonElement>(null);
  return (
    <header className={s.topbar} data-part>
      <IconButton icon="menu" label="Open navigation" aria-expanded={drawer} aria-controls="paper-drawer" tooltip={false} onClick={() => setDrawer(true)} size={36} className="topbar-menu" />
      <button type="button" className={s.topbarBadge} aria-label={`Switch event. Current event: ${ev.name}`} data-switcher-anchor onClick={(e) => openSwitcher(e.currentTarget)}>
        <EventLogo key={ev.id} logo={ev.logo} size={28} radius="sm" className="rf-fade-in" />
      </button>
      <span className={s.topbarName}>{ev.name}</span>
      <IconButton icon="search" label="Search" tooltip={false} onClick={() => setPalette(true)} />
      <button ref={avatar} type="button" className={s.avatarButton} aria-label="FL, Account" aria-haspopup="dialog" aria-expanded={account} onClick={() => setAccount(true)}>
        <Avatar name={USER.name} initials="FL" self size={28} />
      </button>
      <AccountMenu open={account} onClose={() => setAccount(false)} anchor={avatar} onSignOut={onSignOut} placement="bottom-end" />
    </header>
  );
}
