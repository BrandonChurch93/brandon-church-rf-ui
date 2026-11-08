import { useEffect, useMemo, useRef, useState } from 'react';
import type { ViewProps } from '../../shell/ViewSwitch';
import { ViewHeader } from '../../shell/ViewHeader';
import { useStore, selectActive } from '@/store/store';
import { packageSold } from '@/store/selectors';
import type { EventRecord, Package } from '@/store/types';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { Icon } from '../../ui/Icon';
import { Chip, EmptyState, ProgressBar } from '../../ui/display';
import { Tooltip } from '../../ui/Tooltip';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { useFlipList, animateOut, flash } from '@/motion/flip';
import { formatNumber, formatPrice, plural } from '../../lib/format';
import { useShell, registerIntent } from '../../shellStore';
import { PackageEditor } from './PackageEditor';
import c from '../../ui/cards.module.scss';
import s from './packages.module.scss';

registerIntent('add-package');

export function packageStatus(p: Package, sold: number): { label: string; tone: 'success' | 'neutral' | 'warning' | 'muted' } {
  if (p.status === 'archived') return { label: 'Archived', tone: 'muted' };
  if (p.status === 'draft') return { label: 'Draft', tone: 'neutral' };
  if (p.capacity !== null && sold >= p.capacity) return { label: 'Sold out', tone: 'warning' };
  return { label: 'Active', tone: 'success' };
}

/** Packages: a card grid with an editor sheet; archive instead of remove once anything has sold. */
export function PackagesView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);
  const sold = useMemo(() => packageSold(ev), [ev]);
  const list = ev.packages.filter((p) => (filter === 'archived' ? p.status === 'archived' : p.status !== 'archived'));

  useFlipList(grid, list.map((p) => p.id).join(','));
  useEffect(() => {
    if (intent?.type === 'add-package') {
      consume(intent.id);
      setEditing('new');
    }
  }, [intent, consume]);
  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => flash(grid.current?.querySelector<HTMLElement>(`[data-flip-id="${fresh}"]`) ?? null), 320);
    setFresh(null);
    return () => window.clearTimeout(t);
  }, [fresh]);

  return (
    <>
      <ViewHeader
        title="Packages"
        description="What attendees can buy, and what each option includes."
        actions={
          <div className={s.headerControls}>
            <SegmentedControl
              size="sm"
              label="Show packages"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <Button variant="primary" icon="plus" className="primary-action" onClick={() => setEditing('new')}>
              Add package
            </Button>
          </div>
        }
      />
      <section data-part aria-label={filter === 'active' ? 'Active packages' : 'Archived packages'}>
        {list.length === 0 ? (
          filter === 'active' ? (
            <div className={c.card}>
              <EmptyState icon="ticket" title="No packages yet" body="Create the options attendees choose from when they register." action={{ label: 'Add package', icon: 'plus', onClick: () => setEditing('new') }} />
            </div>
          ) : (
            <div className={c.card}>
              <EmptyState compact icon="archive" title="Nothing archived" body="Archived packages stop selling but keep their history." />
            </div>
          )
        ) : (
          <div className={c.gridWrap}>
            <div ref={grid} className={c.grid}>
              {list.map((p) => (
                <PackageCard key={p.id} ev={ev} p={p} sold={sold.get(p.id) ?? 0} onOpen={() => setEditing(p.id)} onDuplicated={(id) => setEditing(id)} />
              ))}
              {filter === 'active' && (
                <button type="button" className={`${c.add} ${s.addCard}`} data-add onClick={() => setEditing('new')}>
                  <span className={c.addCircle}>
                    <Icon name="plus" size={18} />
                  </span>
                  Add package
                </button>
              )}
            </div>
          </div>
        )}
      </section>
      <PackageEditor
        id={editing}
        onClose={() => setEditing(null)}
        onCreated={(id) => {
          setFilter('active');
          setFresh(id);
        }}
      />
    </>
  );
}

function PackageCard({ ev, p, sold, onOpen, onDuplicated }: { ev: EventRecord; p: Package; sold: number; onOpen: () => void; onDuplicated: (id: string) => void }) {
  const duplicate = useStore((st) => st.duplicatePackage);
  const setArchived = useStore((st) => st.setPackageArchived);
  const remove = useStore((st) => st.removePackage);
  const card = useRef<HTMLDivElement>(null);
  const st = packageStatus(p, sold);
  const pct = p.capacity ? sold / p.capacity : 0;
  const bar = sold >= (p.capacity ?? Infinity) ? 'danger' : pct >= 0.9 ? 'warning' : 'solid';
  const shown = p.includes.slice(0, 4);
  const extra = p.includes.slice(4);

  const archive = (on: boolean) =>
    animateOut(card.current, () => {
      const token = setArchived(p.id, on);
      toast.undo(`${on ? 'Archived' : 'Restored'} ${p.name}`, token, `Undo ${on ? 'archiving' : 'restoring'} ${p.name}`);
    });
  const onRemove = async () => {
    if (!(await confirmDialog({ title: `Remove ${p.name}?`, body: 'Nobody holds this package, so nothing else changes.', confirmLabel: 'Remove', danger: true }))) return;
    animateOut(card.current, () => {
      const token = remove(p.id);
      if (token) toast.undo(`Removed ${p.name}`, token, `Undo removing ${p.name}`);
    });
  };

  return (
    <div ref={card} data-flip-id={p.id} className={`${c.card} ${c.clickable} ${s.card}`}>
      <div className={s.top}>
        <button type="button" className={`${c.stretch} ${s.name}`} onClick={onOpen} aria-label={`${p.name}, ${st.label}, ${formatPrice(p.priceMinor, ev.currency)}. Edit package`}>
          {p.name}
        </button>
        <span className={c.hoverHide}>
          <Chip tone={st.tone} dot>
            {st.label}
          </Chip>
        </span>
      </div>
      <div className={s.price}>
        <strong>{formatPrice(p.priceMinor, ev.currency)}</strong>
        {p.priceMinor > 0 && <span>per attendee</span>}
      </div>
      <p className={s.desc}>{p.description || 'No description yet.'}</p>
      {p.includes.length > 0 && (
        <div className={s.includes}>
          {shown.map((x) => (
            <Chip key={x}>{x}</Chip>
          ))}
          {extra.length > 0 && (
            <Tooltip content={extra.join(', ')}>
              <span className={s.more} tabIndex={-1}>
                <Chip tone="outline">+{extra.length} more</Chip>
              </span>
            </Tooltip>
          )}
        </div>
      )}
      <div className={s.capacity}>
        {p.capacity !== null ? (
          <>
            <ProgressBar value={Math.min(sold, p.capacity)} max={p.capacity} label={`${p.name} sold, ${sold} of ${p.capacity}`} variant={bar} />
            <span className={s.capText}>
              {formatNumber(sold)} of {formatNumber(p.capacity)} sold
            </span>
          </>
        ) : (
          <span className={s.capText}>{formatNumber(sold)} sold · Unlimited</span>
        )}
      </div>
      <div className={c.actions}>
        <IconButton icon="pencil" label={`Edit ${p.name}`} size={30} onClick={onOpen} />
        <Menu
          label={`${p.name} actions`}
          width={240}
          items={[
            {
              id: 'dup',
              label: 'Duplicate',
              icon: 'duplicate',
              onSelect: () => {
                const id = duplicate(p.id);
                if (id) {
                  toast.success(`Duplicated ${p.name}`);
                  onDuplicated(id);
                }
              },
            },
            p.status === 'archived'
              ? { id: 'unarchive', label: 'Unarchive', icon: 'archive-restore', onSelect: () => archive(false) }
              : { id: 'archive', label: 'Archive', icon: 'archive', onSelect: () => archive(true) },
            { id: 'div', type: 'divider' },
            { id: 'remove', label: 'Remove', icon: 'trash', danger: true, disabled: sold > 0, reason: 'Packages with sales can be archived, not removed', onSelect: () => void onRemove() },
          ]}
          trigger={(t) => <IconButton {...t} icon="ellipsis" label={`More actions for ${p.name}`} size={30} />}
        />
      </div>
      <span className="sr-only">{plural(sold, 'attendee')} hold this package.</span>
    </div>
  );
}
