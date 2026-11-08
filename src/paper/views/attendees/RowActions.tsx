import { useEffect, useRef } from 'react';
import { useStore } from '@/store/store';
import { fullName } from '@/store/selectors';
import type { Attendee, EventRecord } from '@/store/types';
import { Popover } from '../../ui/overlay/Popover';
import { Icon } from '../../ui/Icon';
import { toast } from '../../ui/toastStore';
import type { MenuEntry } from '../../ui/Menu';
import m from '../../ui/menu.module.scss';

export type RowActionKind = 'view' | 'type' | 'resend' | 'cancel' | 'reinstate' | 'remove';
export interface RowAction {
  kind: RowActionKind;
  id: string;
  anchor: HTMLElement | null;
}

/** The kebab menu entries for one attendee (the same in the table and the detail sheet). */
export function rowMenu(a: Attendee, run: (kind: RowActionKind) => void): MenuEntry[] {
  return [
    { id: 'view', label: 'View details', icon: 'user-check', onSelect: () => run('view') },
    { id: 'type', label: 'Change type', icon: 'tag', onSelect: () => run('type') },
    { id: 'resend', label: 'Resend confirmation', icon: 'send', disabled: a.status === 'cancelled', reason: 'Cancelled registrations do not get confirmations', onSelect: () => run('resend') },
    { id: 'div', type: 'divider' },
    a.status === 'cancelled'
      ? { id: 'reinstate', label: 'Reinstate', icon: 'undo', onSelect: () => run('reinstate') }
      : { id: 'cancel', label: 'Cancel registration', icon: 'ban', danger: true, onSelect: () => run('cancel') },
    { id: 'remove', label: 'Remove', icon: 'trash', danger: true, onSelect: () => run('remove') },
  ];
}

/** Runs row actions; "Change type" opens a small popover with the type list next to the row's menu. */
export function RowActionsHost({ ev, action, onDone, onOpen, onRemove }: { ev: EventRecord; action: RowAction | null; onDone: () => void; onOpen: (id: string) => void; onRemove: (id: string) => void }) {
  const update = useStore((st) => st.updateAttendee);
  const log = useStore((st) => st.logActivity);
  const anchor = useRef<HTMLElement | null>(null);
  const a = action ? ev.attendees.find((x) => x.id === action.id) : null;

  useEffect(() => {
    if (!action || !a) return;
    const name = fullName(a);
    anchor.current = action.anchor;
    switch (action.kind) {
      case 'view':
        onOpen(a.id);
        onDone();
        break;
      case 'resend':
        log(a.id, 'Confirmation email resent');
        toast.success(`Confirmation sent to ${a.email}`);
        onDone();
        break;
      case 'cancel': {
        const prev = a.status;
        update(a.id, { status: 'cancelled' });
        toast.undo(`Cancelled ${name}'s registration`, { undo: () => update(a.id, { status: prev }) }, `Undo cancelling ${name}'s registration`);
        onDone();
        break;
      }
      case 'reinstate':
        update(a.id, { status: 'registered' });
        toast.success(`Reinstated ${name}`);
        onDone();
        break;
      case 'remove':
        onRemove(a.id);
        onDone();
        break;
      case 'type':
        break;
    }
    // Runs once per requested action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const open = action?.kind === 'type' && Boolean(a);
  return (
    <Popover open={open} onClose={onDone} anchor={anchor} label="Change type" sheetTitle="Change type" placement="bottom-end" width={240} role="presentation">
      {a && (
        <div role="menu" aria-label={`Change type for ${fullName(a)}`} className={m.list}>
          {ev.attendeeTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === a.attendeeTypeId}
              className={m.item}
              onClick={() => {
                if (t.id !== a.attendeeTypeId) {
                  update(a.id, { attendeeTypeId: t.id });
                  toast.success(`Changed ${fullName(a)} to ${t.name}`);
                }
                onDone();
              }}
            >
              <i style={{ width: 8, height: 8, borderRadius: 4, background: `var(--sw-${t.swatch})`, flex: 'none' }} aria-hidden="true" />
              <span className={m.text}>
                <span className={m.label}>{t.name}</span>
              </span>
              {t.id === a.attendeeTypeId && <Icon name="check" size={16} className={m.check} />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
