import { useId, type RefObject } from 'react';
import { useStore, selectActive } from '@/store/store';
import { Popover } from '../../ui/overlay/Popover';
import { Combobox } from '../../ui/form/Combobox';
import { Button } from '../../ui/Button';
import { toast } from '../../ui/toastStore';
import { STATUS_META, TIER_META, boothOrder, sortExhibitors } from './meta';
import s from './exhibitors.module.scss';

export type AssignTarget = { kind: 'exhibitor-for'; boothId: string } | { kind: 'booth-for'; exhibitorId: string };
const NONE = '__none__';

/** Assign booth: from an empty booth (pick an exhibitor) or from an exhibitor (pick a free booth). */
export function AssignPopover({ target, anchor, onClose, onAssigned, onAddNew }: { target: AssignTarget | null; anchor: RefObject<HTMLElement | null>; onClose: () => void; onAssigned: (boothId: string) => void; onAddNew: (boothId: string) => void }) {
  const ev = useStore(selectActive);
  const assignBooth = useStore((st) => st.assignBooth);
  const titleId = useId();
  const open = target !== null;

  let title = '';
  let body = null;
  if (target?.kind === 'exhibitor-for') {
    const booth = ev.booths.find((b) => b.id === target.boothId);
    const candidates = sortExhibitors(ev.exhibitors.filter((x) => !x.boothId));
    title = `Assign booth ${booth?.label ?? ''}`;
    body = (
      <>
        <Combobox
          label="Exhibitors without a booth"
          inline
          autoFocus
          value={null}
          onChange={(id) => {
            const x = ev.exhibitors.find((e) => e.id === id);
            if (!x || !booth) return;
            const token = assignBooth(x.id, booth.id);
            onClose();
            onAssigned(booth.id);
            toast.undo(`Assigned ${x.name} to ${booth.label}`, token, `Undo assigning ${x.name} to ${booth.label}`);
          }}
          options={candidates.map((x) => ({ value: x.id, label: x.name, description: `${TIER_META[x.tier].label} · ${STATUS_META[x.status].label}` }))}
          placeholder="Search exhibitors"
          emptyText={candidates.length ? 'No matches' : 'Every exhibitor has a booth'}
        />
        <div className={s.assignFoot}>
          <Button size="sm" variant="ghost" icon="plus" onClick={() => booth && onAddNew(booth.id)}>
            Add a new exhibitor here
          </Button>
        </div>
      </>
    );
  } else if (target?.kind === 'booth-for') {
    const x = ev.exhibitors.find((e) => e.id === target.exhibitorId);
    const current = ev.booths.find((b) => b.id === x?.boothId);
    const taken = new Set(ev.exhibitors.map((e) => e.boothId).filter(Boolean));
    const free = boothOrder(ev.booths.filter((b) => !taken.has(b.id)));
    title = current ? `Move ${x?.name ?? ''}` : `Assign a booth to ${x?.name ?? ''}`;
    body = (
      <Combobox
        label={current ? `Now in booth ${current.label}. Choose a free booth` : 'Free booths'}
        inline
        autoFocus
        value={null}
        onChange={(id) => {
          if (!x || !id) return;
          const booth = id === NONE ? null : ev.booths.find((b) => b.id === id);
          const token = assignBooth(x.id, booth?.id ?? null);
          onClose();
          if (booth) onAssigned(booth.id);
          const msg = booth ? (current ? `Moved ${x.name} to ${booth.label}` : `Assigned ${x.name} to ${booth.label}`) : `Removed ${x.name} from ${current?.label}`;
          toast.undo(msg, token, `Undo: ${msg}`);
        }}
        options={[
          ...free.map((b) => ({ value: b.id, label: b.label, description: `Row ${b.row}${b.row === 'D' && b.col >= 2 && b.col <= 5 ? ', near the entrance' : ''}` })),
          ...(current ? [{ value: NONE, label: 'No booth', description: `Frees booth ${current.label}` }] : []),
        ]}
        placeholder="Search booths"
        emptyText="Every booth is taken"
      />
    );
  }

  return (
    <Popover open={open} onClose={onClose} anchor={anchor} label={title || 'Assign booth'} sheetTitle={title} placement="bottom-start" width={320} labelledBy={titleId}>
      <div className={s.assignPanel}>
        <h2 className={s.assignTitle} id={titleId}>
          {title}
        </h2>
        {body}
      </div>
    </Popover>
  );
}
