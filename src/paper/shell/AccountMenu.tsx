import type { RefObject } from 'react';
import { Popover } from '../ui/overlay/Popover';
import { Avatar } from '../ui/display';
import { SegmentedControl } from '../ui/form/SegmentedControl';
import { Switch } from '../ui/form/Switch';
import { Icon } from '../ui/Icon';
import { useStore } from '@/store/store';
import { useShell } from '../shellStore';
import { setThemeOrigin } from '@/app/theme';
import { useSystemReducedMotion } from '@/motion/reduced';
import { confirmDialog } from '../ui/confirmStore';
import { toast } from '../ui/toastStore';
import type { ThemePref } from '@/store/types';
import s from './overlays.module.scss';

interface AccountMenuProps {
  open: boolean;
  onClose: () => void;
  anchor: RefObject<HTMLElement | null>;
  onSignOut: () => void;
  placement?: 'right-end' | 'bottom-end';
}

export const USER = { name: 'First Name Last Name', email: 'firstname@rainfocus.com' };

/** Account: theme, reduce motion, reset demo data, about, sign out. */
export function AccountMenu({ open, onClose, anchor, onSignOut, placement = 'right-end' }: AccountMenuProps) {
  const theme = useStore((st) => st.ui.theme);
  const reduce = useStore((st) => st.ui.reduceMotion);
  const setTheme = useStore((st) => st.setTheme);
  const setReduce = useStore((st) => st.setReduceMotion);
  const reset = useStore((st) => st.resetDemoData);
  const openAbout = useShell((st) => st.openAbout);
  const system = useSystemReducedMotion();
  const effective = reduce ?? system;
  const sub = reduce === null ? 'Following system' : reduce ? 'On' : 'Off';

  return (
    <Popover open={open} onClose={onClose} anchor={anchor} label="Account" sheetTitle="Account" placement={placement} width={280} initialFocus="first">
      <div className={s.account}>
        <div className={s.accountHeader}>
          <Avatar name={USER.name} initials="FL" self size={40} />
          <div className={s.accountText}>
            <span className={s.accountName}>{USER.name}</span>
            <span className={s.accountEmail}>{USER.email}</span>
          </div>
        </div>
        <div className={s.accountDivider} />
        <div className={s.accountRow}>
          <span className={s.accountRowLabel} id="theme-label">
            Theme
          </span>
          <SegmentedControl<ThemePref>
            label="Theme"
            size="sm"
            value={theme}
            onChange={(v, at) => {
              setThemeOrigin(at);
              setTheme(v);
            }}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </div>
        <div className={s.accountRow}>
          <span className={s.accountRowText}>
            <span className={s.accountRowLabel} id="motion-label">
              Reduce motion
            </span>
            <span className={s.accountRowSub} id="motion-sub">
              {sub}
            </span>
          </span>
          <Switch checked={effective} onChange={(v) => setReduce(v)} ariaLabel="Reduce motion" describedBy="motion-sub" />
        </div>
        <div className={s.accountDivider} />
        <button
          type="button"
          className={s.accountItem}
          onClick={async () => {
            onClose();
            const ok = await confirmDialog({
              title: 'Reset demo data?',
              body: 'This restores every event to its seeded state. Your changes will be lost.',
              confirmLabel: 'Reset',
              danger: true,
            });
            if (ok) {
              reset();
              toast.success('Demo data restored');
            }
          }}
        >
          <Icon name="rotate-ccw" size={16} />
          Reset demo data
        </button>
        <button
          type="button"
          className={s.accountItem}
          onClick={() => {
            onClose();
            openAbout();
          }}
        >
          <Icon name="info" size={16} />
          About this build
        </button>
        <div className={s.accountDivider} />
        <button
          type="button"
          className={s.accountItem}
          onClick={() => {
            onClose();
            onSignOut();
          }}
        >
          <Icon name="log-out" size={16} />
          Sign out
        </button>
      </div>
    </Popover>
  );
}
