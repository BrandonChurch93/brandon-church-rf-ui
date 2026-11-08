import { useEffect, useMemo, useRef, useState } from 'react';
import type { ViewProps } from '../../shell/ViewSwitch';
import { ViewHeader } from '../../shell/ViewHeader';
import { useStore, selectActive } from '@/store/store';
import type { EventRecord, Exhibitor, ExhibitorStatus, ExhibitorTier } from '@/store/types';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { Icon } from '../../ui/Icon';
import { EmptyState } from '../../ui/display';
import { Tooltip } from '../../ui/Tooltip';
import { SearchField } from '../../ui/SearchField';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { copyText } from '../../lib/clipboard';
import { plural } from '../../lib/format';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { useShell, registerIntent } from '../../shellStore';
import { animateOut, flash, useFlipList } from '@/motion/flip';
import { OptionFilter } from '../reg-codes/RegCodesView';
import { STATUS_META, TIERS, TIER_META, sortExhibitors } from './meta';
import { Monogram, TierChip } from './parts';
import { FloorMap } from './FloorMap';
import { AssignPopover, type AssignTarget } from './AssignPopover';
import { ExhibitorDetail } from './ExhibitorDetail';
import { AddExhibitor } from './AddExhibitor';
import c from '../../ui/cards.module.scss';
import l from '../shared/lists.module.scss';
import s from './exhibitors.module.scss';

registerIntent('add-exhibitor');

type BoothFilter = 'assigned' | 'unassigned';

/** Removes with a confirm, frees the booth, unlinks staff, and offers Undo. Returns whether it went ahead. */
export async function removeExhibitorFlow(ev: EventRecord, x: Exhibitor, before?: (done: () => void) => void) {
  const staff = ev.attendees.filter((a) => a.exhibitorId === x.id).length;
  const booth = ev.booths.find((b) => b.id === x.boothId);
  const parts = [booth ? `Booth ${booth.label} becomes free` : null, staff ? `${plural(staff, 'staff member')} stay as attendees, unlinked` : null].filter(Boolean);
  const ok = await confirmDialog({
    title: `Remove ${x.name}?`,
    body: parts.length ? `${parts.join('. ')}.` : 'They have no booth and no linked staff.',
    confirmLabel: 'Remove',
    danger: true,
  });
  if (!ok) return false;
  const run = () => {
    const token = useStore.getState().removeExhibitor(x.id);
    toast.undo(`Removed ${x.name}`, token, `Undo removing ${x.name}`);
  };
  if (before) before(run);
  else run();
  return true;
}

/** Exhibitors: a card grid and an SVG floor map over the same data, with detail, add and assign flows. */
export function ExhibitorsView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const setStatus = useStore((st) => st.setExhibitorStatus);
  const { isMobile } = useBreakpoint();
  const [view, setView] = useState<'cards' | 'map'>('cards');
  const [q, setQ] = useState('');
  const [tiers, setTiers] = useState<ExhibitorTier[]>([]);
  const [statuses, setStatuses] = useState<ExhibitorStatus[]>([]);
  const [boothF, setBoothF] = useState<BoothFilter[]>([]);
  const [detail, setDetail] = useState<{ id: string; edit: boolean } | null>(null);
  const [adding, setAdding] = useState<{ boothId: string | null } | null>(null);
  const [assign, setAssign] = useState<AssignTarget | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [freshBooth, setFreshBooth] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);
  const lastEvent = useRef(ev.id);

  useEffect(() => {
    if (lastEvent.current === ev.id) return;
    lastEvent.current = ev.id;
    setQ('');
    setTiers([]);
    setStatuses([]);
    setBoothF([]);
    setDetail(null);
    setAssign(null);
  }, [ev.id]);
  useEffect(() => {
    if (intent?.type === 'add-exhibitor') {
      consume(intent.id);
      setAdding({ boothId: null });
    }
  }, [intent, consume]);

  const all = useMemo(() => sortExhibitors(ev.exhibitors), [ev.exhibitors]);
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((x) => {
      if (needle && !x.name.toLowerCase().includes(needle) && !x.contact.name.toLowerCase().includes(needle)) return false;
      if (tiers.length && !tiers.includes(x.tier)) return false;
      if (statuses.length && !statuses.includes(x.status)) return false;
      if (boothF.length && !boothF.includes(x.boothId ? 'assigned' : 'unassigned')) return false;
      return true;
    });
  }, [all, q, tiers, statuses, boothF]);
  const filtered = Boolean(q.trim() || tiers.length || statuses.length || boothF.length);
  const clear = () => {
    setQ('');
    setTiers([]);
    setStatuses([]);
    setBoothF([]);
  };

  useFlipList(grid, view === 'cards' ? matches.map((x) => x.id).join(',') : '');
  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => flash(grid.current?.querySelector<HTMLElement>(`[data-flip-id="${fresh}"]`) ?? null), 320);
    setFresh(null);
    return () => window.clearTimeout(t);
  }, [fresh]);

  useEffect(() => {
    if (!freshBooth) return;
    const t = window.setTimeout(() => setFreshBooth(null), 900);
    return () => window.clearTimeout(t);
  }, [freshBooth]);

  const openAssign = (target: AssignTarget, el: Element | null) => {
    anchor.current = el as HTMLElement | null;
    setAssign(target);
  };
  const markStatus = (x: Exhibitor, status: ExhibitorStatus) => {
    const prev = x.status;
    setStatus(x.id, status);
    toast.undo(`Marked ${x.name} ${STATUS_META[status].label.toLowerCase()}`, { undo: () => useStore.getState().setExhibitorStatus(x.id, prev) }, `Undo marking ${x.name} ${STATUS_META[status].label.toLowerCase()}`);
  };

  const emptyAll = ev.exhibitors.length === 0;
  const empty = emptyAll ? (
    <EmptyState icon="store" title="No exhibitors yet" body="Add exhibitors and place them on the floor map." action={{ label: 'Add exhibitor', icon: 'plus', onClick: () => setAdding({ boothId: null }) }} />
  ) : matches.length === 0 ? (
    <EmptyState icon="search-x" title="No exhibitors match" body="Try a different search or clear the filters." action={{ label: 'Clear filters', onClick: clear }} />
  ) : null;

  return (
    <>
      <ViewHeader
        title="Exhibitors"
        description="Companies on the expo floor and where to find them."
        actions={
          <div className={s.headerControls}>
            <SegmentedControl
              size={isMobile ? 'md' : 'sm'}
              label="Exhibitor layout"
              value={view}
              onChange={setView}
              fullWidth={isMobile}
              options={[
                { value: 'cards', label: 'Cards', icon: 'grid' },
                { value: 'map', label: 'Floor map', icon: 'map' },
              ]}
            />
            <Button variant="primary" icon="plus" className="primary-action" fullWidth={isMobile} onClick={() => setAdding({ boothId: null })}>
              Add exhibitor
            </Button>
          </div>
        }
      />
      {!emptyAll && (
        <div className={l.toolbar} data-part>
          <SearchField className={l.search} label="Search exhibitors" placeholder="Search exhibitors" value={q} onChange={setQ} />
          <div className={s.filters}>
            <OptionFilter label="Tier" value={tiers} onChange={(v) => setTiers(v as ExhibitorTier[])} options={TIERS.map((t) => ({ value: t, label: TIER_META[t].label }))} />
            <OptionFilter label="Status" value={statuses} onChange={(v) => setStatuses(v as ExhibitorStatus[])} options={(Object.keys(STATUS_META) as ExhibitorStatus[]).map((k) => ({ value: k, label: STATUS_META[k].label }))} />
            <OptionFilter
              label="Booth"
              value={boothF}
              onChange={(v) => setBoothF(v as BoothFilter[])}
              options={[
                { value: 'assigned', label: 'Assigned' },
                { value: 'unassigned', label: 'Unassigned' },
              ]}
            />
            {filtered && (
              <Button size="sm" variant="ghost" onClick={clear}>
                Clear filters
              </Button>
            )}
          </div>
          <span className={l.count} aria-live="polite">
            {filtered ? `${matches.length} of ${plural(all.length, 'exhibitor')}` : plural(all.length, 'exhibitor')}
          </span>
        </div>
      )}
      <section data-part aria-label={view === 'cards' ? 'Exhibitor cards' : 'Floor map'} key={view} className={s.viewBody}>
        {view === 'cards' ? (
          empty ? (
            <div className={c.card}>{empty}</div>
          ) : (
            <div className={c.gridWrap}>
              <div ref={grid} className={c.grid}>
                {matches.map((x) => (
                  <ExhibitorCard
                    key={x.id}
                    ev={ev}
                    x={x}
                    onOpen={(edit) => setDetail({ id: x.id, edit })}
                    onAssign={(el) => openAssign({ kind: 'booth-for', exhibitorId: x.id }, el)}
                    onStatus={(st) => markStatus(x, st)}
                  />
                ))}
                <button type="button" className={c.add} data-add onClick={() => setAdding({ boothId: null })}>
                  <span className={c.addCircle}>
                    <Icon name="plus" size={18} />
                  </span>
                  Add exhibitor
                </button>
              </div>
            </div>
          )
        ) : (
          <>
            {!emptyAll && matches.length === 0 && (
              <p className={s.mapNote} role="status">
                No exhibitors match the filters, so every booth is dimmed.{' '}
                <button type="button" onClick={clear}>
                  Clear filters
                </button>
              </p>
            )}
            <FloorMap
              ev={ev}
              visible={filtered ? new Set(matches.map((x) => x.id)) : null}
              freshBooth={freshBooth}
              activeBooth={assign?.kind === 'exhibitor-for' ? assign.boothId : null}
              onOpen={(id) => setDetail({ id, edit: false })}
              onAssign={(boothId, el) => openAssign({ kind: 'exhibitor-for', boothId }, el)}
            />
          </>
        )}
      </section>
      <AssignPopover
        target={assign}
        anchor={anchor}
        onClose={() => setAssign(null)}
        onAssigned={(boothId) => setFreshBooth(boothId)}
        onAddNew={(boothId) => {
          setAssign(null);
          setAdding({ boothId });
        }}
      />
      <ExhibitorDetail
        id={detail?.id ?? null}
        startEditing={detail?.edit ?? false}
        onClose={() => setDetail(null)}
        onRemove={(x) =>
          void removeExhibitorFlow(ev, x, (run) => {
            setDetail(null);
            const card = grid.current?.querySelector<HTMLElement>(`[data-flip-id="${x.id}"]`) ?? null;
            window.setTimeout(() => animateOut(card, run), card ? 200 : 0);
          })
        }
      />
      <AddExhibitor
        open={adding !== null}
        initialBooth={adding?.boothId ?? null}
        onClose={() => setAdding(null)}
        onCreated={(id, boothId) => {
          clear();
          setFresh(id);
          if (boothId) setFreshBooth(boothId);
        }}
      />
    </>
  );
}

function ExhibitorCard({ ev, x, onOpen, onAssign, onStatus }: { ev: EventRecord; x: Exhibitor; onOpen: (edit: boolean) => void; onAssign: (el: Element | null) => void; onStatus: (s: ExhibitorStatus) => void }) {
  const card = useRef<HTMLDivElement>(null);
  const boothRef = useRef<HTMLSpanElement>(null);
  const booth = ev.booths.find((b) => b.id === x.boothId);
  const st = STATUS_META[x.status];
  const tier = TIER_META[x.tier].label;

  const copyEmail = async () => {
    if (await copyText(x.contact.email)) toast.success(`Copied ${x.contact.email}`);
    else toast.danger('Could not copy. Select the address in the details instead.');
  };
  const onRemove = () => void removeExhibitorFlow(ev, x, (run) => animateOut(card.current, run));

  return (
    <div ref={card} data-flip-id={x.id} className={`${c.card} ${c.clickable} ${s.card}`}>
      <div className={s.top}>
        <Monogram name={x.name} tier={x.tier} />
        <div className={s.titleBlock}>
          <button type="button" className={`${c.stretch} ${s.name}`} onClick={() => onOpen(false)} aria-label={`${x.name}, ${tier}, ${st.label}, ${booth ? `booth ${booth.label}` : 'no booth'}. Open details`}>
            {x.name}
          </button>
          <span className={s.chipRow}>
            <TierChip tier={x.tier} />
            <Tooltip content={st.label} describe={false}>
              <span className={s.dot} role="img" aria-label={`Status: ${st.label}`} tabIndex={-1}>
                <i style={{ background: st.color }} />
              </span>
            </Tooltip>
          </span>
        </div>
      </div>
      <p className={s.tagline}>{x.tagline || 'No tagline yet'}</p>
      <div className={s.bottom}>
        <span ref={boothRef} className={s.boothSlot}>
          {booth ? (
            <span className={s.booth}>Booth {booth.label}</span>
          ) : (
            <>
              <span>No booth</span>
              <button type="button" className={s.assign} onClick={() => onAssign(boothRef.current)} aria-label={`Assign a booth to ${x.name}`}>
                Assign
              </button>
            </>
          )}
        </span>
        {x.contact.name && (
          <>
            <span aria-hidden="true">·</span>
            <span className={s.contact}>{x.contact.name}</span>
          </>
        )}
      </div>
      <div className={c.actions}>
        <IconButton icon="mail" label={`Copy ${x.name} contact email`} size={30} onClick={() => void copyEmail()} />
        <Menu
          label={`${x.name} actions`}
          width={220}
          items={[
            { id: 'edit', label: 'Edit', icon: 'pencil', onSelect: () => onOpen(true) },
            { id: 'booth', label: booth ? 'Change booth' : 'Assign booth', icon: 'map-pin', onSelect: () => onAssign(boothRef.current) },
            x.status === 'confirmed'
              ? { id: 'pending', label: 'Mark pending', icon: 'clock', onSelect: () => onStatus('pending') }
              : { id: 'confirmed', label: 'Mark confirmed', icon: 'circle-check', onSelect: () => onStatus('confirmed') },
            { id: 'div', type: 'divider' },
            { id: 'remove', label: 'Remove', icon: 'trash', danger: true, onSelect: onRemove },
          ]}
          trigger={(t) => <IconButton {...t} icon="ellipsis" label={`More actions for ${x.name}`} size={30} />}
        />
      </div>
    </div>
  );
}
