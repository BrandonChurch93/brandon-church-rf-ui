import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewProps } from '../../shell/ViewSwitch';
import { ViewHeader } from '../../shell/ViewHeader';
import { useStore, selectActive } from '@/store/store';
import { fullName } from '@/store/selectors';
import type { Attendee, AttendeeStatus } from '@/store/types';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { SearchField } from '../../ui/SearchField';
import { EmptyState } from '../../ui/display';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { cycleSort, type SortState } from '../../ui/Table';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { useShell, registerIntent } from '../../shellStore';
import { setPillAside } from '@/app/layerStack';
import { downloadText } from '../../lib/clipboard';
import { plural, formatNumber, todayIn } from '../../lib/format';
import { applyFilters, applySort, emptyFilters, isFiltered, type Filters, type SortKey } from './query';
import { attendeesCsv } from './csv';
import { AttendeeTable } from './AttendeeTable';
import { AttendeeCards } from './AttendeeCards';
import { FilterChips, MobileFilters } from './Filters';
import { BulkBar } from './BulkBar';
import { AttendeeDetail } from './AttendeeDetail';
import { AddAttendee } from './AddAttendee';
import { RowActionsHost, type RowAction } from './RowActions';
import s from './attendees.module.scss';

registerIntent('add-attendee', 'open-attendee');

/** Attendees: search, filters, sorting, selection, bulk actions, export, detail and add. */
export function AttendeesView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const removeAttendees = useStore((st) => st.removeAttendees);
  const { isMobile } = useBreakpoint();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<SortState<SortKey> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [shownCount, setShownCount] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [rowAction, setRowAction] = useState<RowAction | null>(null);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);

  const filtered = useMemo(() => applyFilters(ev, filters), [ev, filters]);
  const sorted = useMemo(() => applySort(ev, filtered, sort), [ev, filtered, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = isMobile ? sorted.slice(0, shownCount) : sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const total = ev.attendees.length;

  const updateFilters = (f: Filters) => {
    setFilters(f);
    setPage(1);
    setShownCount(25);
  };
  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setSelectMode(false);
  }, []);

  // Escape with nothing else open clears the selection.
  useEffect(() => {
    const onEsc = () => clearSelection();
    window.addEventListener('rf:escape', onEsc);
    return () => window.removeEventListener('rf:escape', onEsc);
  }, [clearSelection]);

  // On mobile, selection mode owns the bottom of the screen: the pill steps aside.
  const mobileSelecting = isMobile && (selectMode || selected.size > 0);
  useEffect(() => {
    setPillAside('attendee-selection', mobileSelecting);
    return () => setPillAside('attendee-selection', false);
  }, [mobileSelecting]);

  // Palette intents.
  useEffect(() => {
    if (!intent) return;
    if (intent.type === 'add-attendee') {
      consume(intent.id);
      setAdding(true);
    } else if (intent.type === 'open-attendee' && intent.payload) {
      consume(intent.id);
      setDetailId(intent.payload);
    }
  }, [intent, consume]);

  // Selection resets when the event changes (not on first mount, where an intent may open a detail).
  const lastEvent = useRef(ev.id);
  useEffect(() => {
    if (lastEvent.current === ev.id) return;
    lastEvent.current = ev.id;
    clearSelection();
    setDetailId(null);
    updateFilters(emptyFilters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev.id]);

  const exportCsv = (list: Attendee[]) => {
    downloadText(`${ev.slug}-attendees-${todayIn(ev.timezone)}.csv`, attendeesCsv(ev, list));
    toast.success(`Exported ${plural(list.length, 'attendee')}`);
  };

  /** Confirm, fade the rows out, remove, offer undo. */
  const remove = async (ids: string[]) => {
    const one = ids.length === 1 ? ev.attendees.find((a) => a.id === ids[0]) : null;
    const label = one ? fullName(one) : plural(ids.length, 'attendee');
    const ok = await confirmDialog({
      title: `Remove ${label}?`,
      body: 'This cannot be undone after the undo window closes.',
      confirmLabel: one ? 'Remove' : `Remove ${label}`,
      danger: true,
    });
    if (!ok) return;
    setLeaving(new Set(ids));
    window.setTimeout(() => {
      const token = removeAttendees(ids);
      setLeaving(new Set());
      setSelected((sel) => new Set([...sel].filter((id) => !ids.includes(id))));
      if (detailId && ids.includes(detailId)) setDetailId(null);
      toast.undo(`Removed ${label}`, token, `Undo removing ${label}`);
    }, 280);
  };

  const onAdded = (id: string) => {
    // Show the new row: clear anything that would hide it, go to its page, flash it.
    const fresh = useStore.getState().events[ev.id];
    const list = applySort(fresh, applyFilters(fresh, filters), sort);
    let index = list.findIndex((a) => a.id === id);
    if (index < 0) {
      updateFilters(emptyFilters());
      index = applySort(fresh, fresh.attendees, sort).findIndex((a) => a.id === id);
    }
    if (isMobile) setShownCount((c) => Math.max(c, index + 1));
    else setPage(Math.floor(Math.max(0, index) / pageSize) + 1);
    setHighlight(id);
    window.setTimeout(() => setHighlight(null), 1400);
  };

  const filteredOut = isFiltered(filters);
  const noAttendees = total === 0;
  const empty = noAttendees ? (
    <EmptyState
      icon="users"
      title="No attendees yet"
      body="Attendees appear here as they register, or add them yourself."
      action={{ label: 'Add attendee', icon: 'plus', onClick: () => setAdding(true) }}
      secondary={{
        label: 'Restore demo data',
        onClick: async () => {
          if (await confirmDialog({ title: 'Reset demo data?', body: 'This restores every event to its seeded state. Your changes will be lost.', confirmLabel: 'Reset', danger: true })) {
            useStore.getState().resetDemoData();
            toast.success('Demo data restored');
          }
        },
      }}
    />
  ) : sorted.length === 0 ? (
    <EmptyState icon="search-x" title="No attendees match" body="Try a different search or clear the filters." action={{ label: 'Clear filters', onClick: () => updateFilters(emptyFilters()) }} />
  ) : null;

  const countText = filteredOut ? `${formatNumber(sorted.length)} of ${plural(total, 'attendee')}` : plural(total, 'attendee');
  const selectedRows = ev.attendees.filter((a) => selected.has(a.id));
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <>
      <ViewHeader
        title="Attendees"
        description={`Everyone registered for ${ev.name}.`}
        aside={
          isMobile && (
            <Menu
              label="More attendee actions"
              items={[{ id: 'export', label: 'Export CSV', icon: 'download', disabled: sorted.length === 0, onSelect: () => exportCsv(sorted) }]}
              trigger={(t) => <IconButton {...t} icon="ellipsis" label="More actions" variant="subtle" />}
            />
          )
        }
        actions={
          isMobile ? (
            <Button variant="primary" icon="plus" className="primary-action" fullWidth onClick={() => setAdding(true)}>
              Add attendee
            </Button>
          ) : (
            <>
              <Button variant="secondary" icon="download" onClick={() => exportCsv(sorted)} disabled={sorted.length === 0}>
                Export CSV
              </Button>
              <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>
                Add attendee
              </Button>
            </>
          )
        }
      />

      <div className={s.toolbar} data-part>
        <SearchField className={s.search} label="Search attendees" placeholder="Search by name, email or company" value={filters.q} debounce={150} onChange={(q) => updateFilters({ ...filters, q })} />
        {isMobile ? (
          <div className={s.mobileTools}>
            <MobileFilters ev={ev} filters={filters} sort={sort} onApply={(f, so) => (updateFilters(f), setSort(so))} />
            <Button variant={selectMode ? 'secondary' : 'ghost'} onClick={() => (selectMode ? clearSelection() : setSelectMode(true))} aria-pressed={selectMode}>
              {selectMode ? 'Done' : 'Select'}
            </Button>
            <span className={s.count} aria-live="polite">
              {countText}
            </span>
          </div>
        ) : (
          <>
            <FilterChips ev={ev} filters={filters} onChange={updateFilters} />
            {filteredOut && (
              <Button variant="ghost" size="sm" onClick={() => updateFilters(emptyFilters())}>
                Clear filters
              </Button>
            )}
            <span className={s.count} aria-live="polite">
              {countText}
            </span>
          </>
        )}
      </div>

      <section data-part aria-label="Attendee list">
        {isMobile ? (
          empty ?? (
            <AttendeeCards
              ev={ev}
              rows={rows}
              total={sorted.length}
              selected={selected}
              selectMode={selectMode || selected.size > 0}
              leaving={leaving}
              highlight={highlight}
              onToggle={(id) => setSelected((sel) => toggle(sel, id))}
              onLongPress={(id) => {
                setSelectMode(true);
                setSelected((sel) => new Set(sel).add(id));
              }}
              onOpen={setDetailId}
              onMore={() => setShownCount((c) => c + 25)}
            />
          )
        ) : (
          <AttendeeTable
            ev={ev}
            rows={rows}
            empty={empty}
            sort={sort}
            onSort={(k) => (setSort((cur) => (k === 'registered' && !cur ? { key: 'registered', dir: 'asc' } : cycleSort(cur, k))), setPage(1))}
            selected={selected}
            leaving={leaving}
            highlight={highlight}
            allOnPageSelected={allOnPageSelected}
            onToggle={(id) => setSelected((sel) => toggle(sel, id))}
            onTogglePage={(on) =>
              setSelected((sel) => {
                const next = new Set(sel);
                rows.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)));
                return next;
              })
            }
            onOpen={setDetailId}
            onAction={setRowAction}
            pagination={{ page: safePage, pageSize, total: sorted.length, onPage: setPage, onPageSize: (n) => (setPageSize(n), setPage(1)) }}
          />
        )}
        {selected.size > 0 && (
          <BulkBar
            ev={ev}
            count={selected.size}
            canSelectAll={selected.size < sorted.length && allOnPageSelected}
            totalMatching={sorted.length}
            onSelectAll={() => setSelected(new Set(sorted.map((a) => a.id)))}
            onClear={clearSelection}
            onExport={() => exportCsv(selectedRows)}
            onRemove={() => void remove([...selected])}
            ids={[...selected]}
          />
        )}
      </section>

      <RowActionsHost ev={ev} action={rowAction} onDone={() => setRowAction(null)} onOpen={setDetailId} onRemove={(id) => void remove([id])} />
      <AttendeeDetail id={detailId} onClose={() => setDetailId(null)} onRemove={(id) => void remove([id])} />
      <AddAttendee open={adding} onClose={() => setAdding(false)} onAdded={onAdded} onView={(id) => (setAdding(false), setDetailId(id))} />
    </>
  );
}

function toggle(sel: Set<string>, id: string) {
  const next = new Set(sel);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export type { AttendeeStatus };
