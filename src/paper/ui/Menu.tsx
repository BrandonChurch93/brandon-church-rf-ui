import { useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Popover } from './overlay/Popover';
import { Icon, type IconName } from './Icon';
import { Tooltip } from './Tooltip';
import type { Placement } from './overlay/position';
import s from './menu.module.scss';

export type MenuEntry =
  | {
      type?: 'item';
      id: string;
      label: string;
      icon?: IconName;
      shortcut?: ReactNode;
      description?: string;
      danger?: boolean;
      disabled?: boolean;
      /** Why a disabled item is disabled, shown as a tooltip. */
      reason?: string;
      checked?: boolean;
      onSelect: () => void;
    }
  | { type: 'divider'; id: string }
  | { type: 'heading'; id: string; label: string };

export interface MenuTriggerProps {
  ref: Ref<HTMLButtonElement>;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls'?: string;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

interface MenuProps {
  label: string;
  items: MenuEntry[];
  trigger: (props: MenuTriggerProps) => ReactNode;
  placement?: Placement;
  width?: number;
  /** Content above the items (the account menu's header row). */
  header?: ReactNode;
  onOpenChange?: (open: boolean) => void;
}

const TYPEAHEAD_MS = 500;

/** Menu button pattern: roving focus, type-ahead, Escape, opens from the trigger corner. */
export function Menu({ label, items, trigger, placement = 'bottom-end', width = 240, header, onOpenChange }: MenuProps) {
  const [open, setOpenState] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<'first' | 'last'>('first');
  const typed = useRef({ text: '', at: 0 });
  const id = useId();

  const setOpen = (v: boolean) => {
    setOpenState(v);
    onOpenChange?.(v);
  };
  const itemEls = () => Array.from(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"]') ?? []);
  const focusAt = (i: number) => {
    const els = itemEls();
    if (!els.length) return;
    els[(i + els.length) % els.length].focus();
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusOnOpen.current = e.key === 'ArrowUp' ? 'last' : 'first';
      setOpen(true);
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const els = itemEls();
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusAt(i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusAt(els.length - 1);
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      const now = performance.now();
      typed.current.text = now - typed.current.at > TYPEAHEAD_MS ? e.key.toLowerCase() : typed.current.text + e.key.toLowerCase();
      typed.current.at = now;
      const start = Math.max(0, i);
      const order = [...els.slice(start + (typed.current.text.length === 1 ? 1 : 0)), ...els.slice(0, start + 1)];
      const hit = order.find((el) => (el.textContent ?? '').trim().toLowerCase().startsWith(typed.current.text));
      hit?.focus();
    }
  };

  const select = (entry: Extract<MenuEntry, { onSelect: () => void }>) => {
    if (entry.disabled) return;
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
    entry.onSelect();
  };

  return (
    <>
      {trigger({
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: () => {
          focusOnOpen.current = 'first';
          setOpen(!open);
        },
        onKeyDown: onTriggerKey,
      })}
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchor={triggerRef}
        label={label}
        placement={placement}
        width={width}
        role="presentation"
        sheetTitle={label}
        trap={false}
        initialFocus="none"
        className={s.menuPanel}
      >
        {header}
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- focus moves to the menu items (roving), not the menu container */}
        <div
          ref={(el) => {
            list.current = el;
            if (el && open && !el.contains(document.activeElement)) {
              requestAnimationFrame(() => focusAt(focusOnOpen.current === 'last' ? -1 : 0));
            }
          }}
          id={id}
          role="menu"
          aria-label={label}
          className={s.list}
          onKeyDown={onListKey}
        >
          {items.map((entry) => {
            if (entry.type === 'divider') return <div key={entry.id} role="separator" className={s.divider} />;
            if (entry.type === 'heading')
              return (
                <div key={entry.id} className={s.heading} role="presentation">
                  {entry.label}
                </div>
              );
            const item = (
              <div
                key={entry.id}
                role={entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
                aria-checked={entry.checked}
                aria-disabled={entry.disabled || undefined}
                tabIndex={-1}
                className={`${s.item} ${entry.danger ? s.danger : ''}`}
                onClick={() => select(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(entry);
                  }
                }}
                onPointerMove={(e) => {
                  if (e.pointerType === 'mouse' && document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true });
                }}
              >
                {entry.icon && <Icon name={entry.icon} size={16} className={s.icon} />}
                <span className={s.text}>
                  <span className={s.label}>{entry.label}</span>
                  {entry.description && <span className={s.description}>{entry.description}</span>}
                </span>
                {entry.checked && <Icon name="check" size={16} className={s.check} />}
                {entry.shortcut && <span className={s.shortcut}>{entry.shortcut}</span>}
              </div>
            );
            return entry.disabled && entry.reason ? (
              <Tooltip key={entry.id} content={entry.reason} placement="left">
                {item}
              </Tooltip>
            ) : (
              item
            );
          })}
        </div>
      </Popover>
    </>
  );
}
