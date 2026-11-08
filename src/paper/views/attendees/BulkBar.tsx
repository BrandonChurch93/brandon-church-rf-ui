import { useEffect, useRef, useState } from 'react';
import type { AttendeeStatus, EventRecord } from '@/store/types';
import { useStore } from '@/store/store';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Popover } from '../../ui/overlay/Popover';
import { toast } from '../../ui/toastStore';
import { announce } from '../../lib/announce';
import { formatNumber, plural } from '../../lib/format';
import { STATUSES } from './query';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import m from '../../ui/menu.module.scss';
import s from './attendees.module.scss';

interface Props {
  ev: EventRecord;
  ids: string[];
  count: number;
  canSelectAll: boolean;
  totalMatching: number;
  onSelectAll: () => void;
  onClear: () => void;
  onExport: () => void;
  onRemove: () => void;
}

/** Appears with a selection: change type or status, export, remove. Escape clears. */
export function BulkBar({ ev, ids, count, canSelectAll, totalMatching, onSelectAll, onClear, onExport, onRemove }: Props) {
  const setType = useStore((st) => st.bulkSetType);
  const setStatus = useStore((st) => st.bulkSetStatus);
  const [picker, setPicker] = useState<null | 'type' | 'status'>(null);
  const { isMobile } = useBreakpoint();
  const typeBtn = useRef<HTMLButtonElement>(null);
  const statusBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => announce(`${formatNumber(count)} selected. Bulk actions are available.`), [count]);

  const pick = (label: string, run: () => import('@/store/undo').UndoToken) => {
    const token = run();
    setPicker(null);
    toast.undo(`Changed ${plural(count, 'attendee')} to ${label}`, token);
  };

  return (
    <div className={s.bulk} role="region" aria-label="Bulk actions">
      <span className={s.bulkCount} aria-live="polite">
        {formatNumber(count)} selected
      </span>
      {canSelectAll && (
        <Button size="sm" variant="ghost" onClick={onSelectAll}>
          Select all {formatNumber(totalMatching)}
        </Button>
      )}
      <span className={s.bulkDivider} />
      {isMobile ? (
        <span className={s.bulkIcons}>
          <IconButton ref={typeBtn} icon="tag" label="Change type" aria-haspopup="menu" aria-expanded={picker === 'type'} onClick={() => setPicker('type')} />
          <IconButton ref={statusBtn} icon="user-check" label="Change status" aria-haspopup="menu" aria-expanded={picker === 'status'} onClick={() => setPicker('status')} />
          <IconButton icon="download" label="Export selected" onClick={onExport} />
          <IconButton icon="trash" label="Remove" onClick={onRemove} />
        </span>
      ) : (
        <>
          <Button ref={typeBtn} size="sm" variant="secondary" icon="tag" aria-haspopup="menu" aria-expanded={picker === 'type'} onClick={() => setPicker('type')}>
            Change type
          </Button>
          <Button ref={statusBtn} size="sm" variant="secondary" icon="user-check" aria-haspopup="menu" aria-expanded={picker === 'status'} onClick={() => setPicker('status')}>
            Change status
          </Button>
          <Button size="sm" variant="secondary" icon="download" onClick={onExport}>
            Export selected
          </Button>
          <Button size="sm" variant="danger-ghost" icon="trash" onClick={onRemove}>
            Remove
          </Button>
        </>
      )}
      <IconButton icon="x" label="Clear selection" size={30} onClick={onClear} />
      <Popover open={picker === 'type'} onClose={() => setPicker(null)} anchor={typeBtn} label="Change type" sheetTitle="Change type" placement="top-start" width={220} role="presentation">
        <div role="menu" aria-label="Attendee types" className={m.list}>
          {ev.attendeeTypes.map((t) => (
            <button key={t.id} type="button" role="menuitem" className={m.item} onClick={() => pick(t.name, () => setType(ids, t.id))}>
              <i style={{ width: 8, height: 8, borderRadius: 4, background: `var(--sw-${t.swatch})` }} aria-hidden="true" />
              <span className={m.text}>
                <span className={m.label}>{t.name}</span>
              </span>
            </button>
          ))}
        </div>
      </Popover>
      <Popover open={picker === 'status'} onClose={() => setPicker(null)} anchor={statusBtn} label="Change status" sheetTitle="Change status" placement="top-start" width={220} role="presentation">
        <div role="menu" aria-label="Statuses" className={m.list}>
          {STATUSES.map((x) => (
            <button key={x.value} type="button" role="menuitem" className={m.item} onClick={() => pick(x.label, () => setStatus(ids, x.value as AttendeeStatus))}>
              <i style={{ width: 8, height: 8, borderRadius: 4, background: `var(--${x.tone === 'neutral' ? 'muted' : x.tone})` }} aria-hidden="true" />
              <span className={m.text}>
                <span className={m.label}>{x.label}</span>
              </span>
            </button>
          ))}
        </div>
      </Popover>
    </div>
  );
}
