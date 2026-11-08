import { useRef, type KeyboardEvent, type RefObject } from 'react';
import { Popover } from '../ui/overlay/Popover';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { EventLogo } from './EventLogo';
import { useStore } from '@/store/store';
import { useShell } from '../shellStore';
import { formatDateRange } from '../lib/format';
import s from './overlays.module.scss';

interface EventSwitcherProps {
  open: boolean;
  onClose: () => void;
  anchor: RefObject<HTMLElement | null>;
  onSwitch: (id: string) => void;
}

/** Popover listing every event (bottom sheet on mobile). Choosing one switches the whole app. */
export function EventSwitcher({ open, onClose, anchor, onSwitch }: EventSwitcherProps) {
  const order = useStore((st) => st.eventOrder);
  const events = useStore((st) => st.events);
  const activeId = useStore((st) => st.activeEventId);
  const setEditor = useShell((st) => st.setEventEditor);
  const list = useRef<HTMLDivElement>(null);

  const onKey = (e: KeyboardEvent) => {
    const items = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus();
    }
  };

  return (
    <Popover open={open} onClose={onClose} anchor={anchor} label="Switch event" sheetTitle="Switch event" placement="bottom-start" width={320} initialFocus="none">
      <div className={s.switcher}>
        <div className={s.switcherHeading} id="switch-event-heading">
          Switch event
        </div>
        <div
          ref={(el) => {
            list.current = el;
            if (el && open) requestAnimationFrame(() => el.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true }));
          }}
          role="menu"
          aria-labelledby="switch-event-heading"
          className={s.switcherList}
          onKeyDown={onKey}
          tabIndex={-1}
        >
          {order.map((id) => {
            const ev = events[id];
            if (!ev) return null;
            const active = id === activeId;
            return (
              <div
                key={id}
                role="menuitemradio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={s.switcherRow}
                onClick={() => {
                  onClose();
                  if (!active) onSwitch(id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClose();
                    if (!active) onSwitch(id);
                  }
                }}
              >
                <EventLogo logo={ev.logo} size={32} radius="sm" />
                <span className={s.switcherText}>
                  <span className={s.switcherName}>{ev.name}</span>
                  <span className={s.switcherMeta}>
                    {ev.location} · {formatDateRange(ev.startDate, ev.endDate)}
                  </span>
                </span>
                {active && <Icon name="check" size={16} className={s.switcherCheck} />}
              </div>
            );
          })}
        </div>
        <div className={s.switcherFooter}>
          <Button
            variant="ghost"
            icon="plus"
            fullWidth
            onClick={() => {
              onClose();
              setEditor('create');
            }}
          >
            Create event
          </Button>
        </div>
      </div>
    </Popover>
  );
}
