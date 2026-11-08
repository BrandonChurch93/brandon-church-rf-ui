import { useEffect, useRef } from 'react';
import type { Attendee, EventRecord } from '@/store/types';
import { fullName } from '@/store/selectors';
import { Avatar, Chip, StatusDot } from '../../ui/display';
import { Checkbox } from '../../ui/form/Checkbox';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { flash, useFlipList } from '@/motion/flip';
import { formatNumber } from '../../lib/format';
import { statusMeta } from './query';
import s from './attendees.module.scss';

const LONG_PRESS_MS = 500;

interface Props {
  ev: EventRecord;
  rows: Attendee[];
  total: number;
  selected: Set<string>;
  selectMode: boolean;
  leaving: Set<string>;
  highlight: string | null;
  onToggle: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: (id: string) => void;
  onMore: () => void;
}

/** Mobile: one card per attendee. Long-press (or Select) enters selection mode; tap opens the detail. */
export function AttendeeCards({ ev, rows, total, selected, selectMode, leaving, highlight, onToggle, onLongPress, onOpen, onMore }: Props) {
  const list = useRef<HTMLDivElement>(null);
  const press = useRef<{ t: number; id: string; fired: boolean } | null>(null);
  const typeOf = new Map(ev.attendeeTypes.map((x) => [x.id, x]));
  useFlipList(list, rows.map((r) => r.id).join(','), { enter: false });
  useEffect(() => {
    if (!highlight) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-flip-id="${highlight}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    flash(el ?? null);
  }, [highlight, rows]);

  return (
    <>
      <div ref={list} className={s.cards}>
        {rows.map((a) => {
          const name = fullName(a);
          const type = typeOf.get(a.attendeeTypeId);
          const st = statusMeta(a.status);
          const sel = selected.has(a.id);
          return (
            <div
              key={a.id}
              data-flip-id={a.id}
              className={s.card}
              data-selected={sel || undefined}
              style={leaving.has(a.id) ? { opacity: 0, transform: 'scale(0.96)', transition: 'opacity 280ms var(--ease-in), transform 280ms var(--ease-in)' } : undefined}
              onPointerDown={() => {
                const id = a.id;
                const t = window.setTimeout(() => {
                  if (press.current?.id === id) {
                    press.current.fired = true;
                    onLongPress(id);
                    navigator.vibrate?.(10);
                  }
                }, LONG_PRESS_MS);
                press.current = { t, id, fired: false };
              }}
              onPointerUp={() => press.current && window.clearTimeout(press.current.t)}
              onPointerCancel={() => press.current && window.clearTimeout(press.current.t)}
              onPointerMove={(e) => {
                if (press.current && (Math.abs(e.movementY) > 4 || Math.abs(e.movementX) > 4)) window.clearTimeout(press.current.t);
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {selectMode && (
                <span className={s.cardCheck}>
                  <Checkbox checked={sel} onChange={() => onToggle(a.id)} ariaLabel={`Select ${name}`} />
                </span>
              )}
              <Avatar name={name} size={40} />
              <div className={s.cardBody}>
                <button
                  type="button"
                  className={s.cardOpen}
                  onClick={() => {
                    if (press.current?.fired) {
                      press.current = null;
                      return;
                    }
                    if (selectMode) onToggle(a.id);
                    else onOpen(a.id);
                  }}
                  aria-label={selectMode ? `${sel ? 'Deselect' : 'Select'} ${name}` : `${name}, ${type?.name ?? ''}, ${st.label}. Open details`}
                >
                  <span className={s.cardName}>{name}</span>
                </button>
                <span className={s.email}>{a.email}</span>
                <div className={s.cardRow}>
                  {type && <Chip swatch={type.swatch}>{type.name}</Chip>}
                  <StatusDot tone={st.tone}>{st.label}</StatusDot>
                  {a.company && <span>{a.company}</span>}
                </div>
              </div>
              {!selectMode && <Icon name="chevron-right" size={18} className={s.cardChevron} />}
            </div>
          );
        })}
      </div>
      <div className={s.loadMore}>
        <span>
          Showing {formatNumber(rows.length)} of {formatNumber(total)}
        </span>
        {rows.length < total && (
          <Button variant="secondary" fullWidth onClick={onMore}>
            Load {Math.min(25, total - rows.length)} more
          </Button>
        )}
      </div>
    </>
  );
}
