/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- the table body is a focusable region with arrow-key row focus (09, Table keyboard) */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Attendee, EventRecord } from '@/store/types';
import { fullName } from '@/store/selectors';
import { Avatar, Chip, StatusDot } from '../../ui/display';
import { Checkbox } from '../../ui/form/Checkbox';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { Tooltip } from '../../ui/Tooltip';
import { Pagination } from '../../ui/Pagination';
import { SortHeader, tableStyles as t, type SortState } from '../../ui/Table';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { useFlipList, flash } from '@/motion/flip';
import { formatDateTimeAsDate } from '../../lib/format';
import { mergeRefs } from '../../lib/refs';
import { statusMeta, type SortKey } from './query';
import { rowMenu, type RowAction } from './RowActions';
import s from './attendees.module.scss';

interface Props {
  ev: EventRecord;
  rows: Attendee[];
  empty: ReactNode;
  sort: SortState<SortKey> | null;
  onSort: (k: SortKey) => void;
  selected: Set<string>;
  leaving: Set<string>;
  highlight: string | null;
  allOnPageSelected: boolean;
  onToggle: (id: string) => void;
  onTogglePage: (on: boolean) => void;
  onOpen: (id: string) => void;
  onAction: (a: RowAction) => void;
  pagination: { page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize: (n: number) => void };
}

/** The desktop table: sortable, selectable, keyboard navigable (Up, Down, Enter, Space, Cmd or Ctrl+A). */
export function AttendeeTable({ ev, rows, empty, sort: sortProp, onSort, selected, leaving, highlight, allOnPageSelected, onToggle, onTogglePage, onOpen, onAction, pagination }: Props) {
  const { isLg } = useBreakpoint();
  // The default order (newest first) shows on the Registered header.
  const sort: SortState<SortKey> = sortProp ?? { key: 'registered', dir: 'desc' };
  const tbody = useRef<HTMLTableSectionElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const kebabs = useRef(new Map<string, HTMLButtonElement | null>());
  const [focusRow, setFocusRow] = useState(0);
  const [bodyFocused, setBodyFocused] = useState(false);
  const typeOf = new Map(ev.attendeeTypes.map((x) => [x.id, x]));
  const pkgOf = new Map(ev.packages.map((x) => [x.id, x]));
  const someSelected = rows.some((r) => selected.has(r.id));

  useFlipList(tbody, rows.map((r) => r.id).join(','), { enter: false, duration: 0.48, ease: 'power2.inOut' });
  useEffect(() => setFocusRow((i) => Math.min(i, Math.max(0, rows.length - 1))), [rows.length]);
  useEffect(() => {
    if (pagination.page) scroller.current?.scrollTo({ top: 0 });
  }, [pagination.page]);
  useEffect(() => {
    if (!highlight) return;
    const row = tbody.current?.querySelector<HTMLElement>(`[data-flip-id="${highlight}"]`);
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    flash(row ?? null);
  }, [highlight, rows]);

  const onKey = (e: KeyboardEvent) => {
    if (e.target !== tbody.current) return;
    const r = rows[focusRow];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(rows.length - 1, Math.max(0, focusRow + (e.key === 'ArrowDown' ? 1 : -1)));
      setFocusRow(n);
      tbody.current?.querySelectorAll('tr')[n]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setFocusRow(e.key === 'Home' ? 0 : rows.length - 1);
    } else if (e.key === 'Enter' && r) {
      e.preventDefault();
      onOpen(r.id);
    } else if (e.key === ' ' && r) {
      e.preventDefault();
      onToggle(r.id);
    } else if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onTogglePage(true);
    }
  };

  const showCompany = !isLg;

  return (
    <div className={`${t.card} ${s.tableCard}`}>
      <div ref={scroller} className={t.scroller}>
        <table className={`${t.table} ${s.table}`} aria-label="Attendees" aria-rowcount={pagination.total + 1}>
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ minWidth: 220 }} />
            {showCompany && <col style={{ width: 160 }} />}
            <col style={{ width: 156 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 116 }} />
            <col style={{ width: 52 }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={s.checkCell}>
                <Checkbox checked={allOnPageSelected} indeterminate={someSelected && !allOnPageSelected} onChange={(v) => onTogglePage(v)} ariaLabel="Select all attendees on this page" />
              </th>
              <SortHeader sortKey="name" sort={sort} onSort={onSort}>
                Name
              </SortHeader>
              {showCompany && (
                <SortHeader sortKey="company" sort={sort} onSort={onSort}>
                  Company
                </SortHeader>
              )}
              <SortHeader sortKey="type" sort={sort} onSort={onSort}>
                Type
              </SortHeader>
              <SortHeader sortKey="package" sort={sort} onSort={onSort}>
                Package
              </SortHeader>
              <SortHeader sortKey="status" sort={sort} onSort={onSort}>
                Status
              </SortHeader>
              <SortHeader sortKey="registered" sort={sort} onSort={onSort}>
                Registered
              </SortHeader>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody
            ref={tbody}
            className={s.tbody}
            tabIndex={rows.length ? 0 : -1}
            aria-label="Attendee rows. Up and Down move, Enter opens, Space selects."
            onFocus={(e) => e.target === tbody.current && setBodyFocused(true)}
            onBlur={() => setBodyFocused(false)}
            onKeyDown={onKey}
          >
            {empty && (
              <tr>
                <td colSpan={showCompany ? 8 : 7} className={s.emptyCell}>
                  {empty}
                </td>
              </tr>
            )}
            {rows.map((a, i) => {
              const type = typeOf.get(a.attendeeTypeId);
              const pkg = a.packageId ? pkgOf.get(a.packageId) : null;
              const st = statusMeta(a.status);
              const name = fullName(a);
              const sel = selected.has(a.id);
              return (
                <tr
                  key={a.id}
                  id={`row-${a.id}`}
                  data-flip-id={a.id}
                  data-clickable
                  data-selected={sel || undefined}
                  data-focused={bodyFocused && i === focusRow ? true : undefined}
                  style={leaving.has(a.id) ? { opacity: 0, transform: 'scale(0.98)', transition: 'opacity 280ms var(--ease-in), transform 280ms var(--ease-in)' } : undefined}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, input, a, [role="menu"]')) return;
                    setFocusRow(i);
                    onOpen(a.id);
                  }}
                >
                  <td className={s.checkCell}>
                    <Checkbox checked={sel} onChange={() => onToggle(a.id)} ariaLabel={`Select ${name}`} />
                  </td>
                  <td>
                    <div className={s.nameCell}>
                      <Avatar name={name} size={32} />
                      <div className={s.nameText}>
                        <Tooltip content={name.length > 26 ? name : null} describe={false}>
                          <button type="button" className={s.nameButton} onClick={() => onOpen(a.id)}>
                            {name}
                          </button>
                        </Tooltip>
                        <span className={s.email} title={a.email}>
                          {a.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  {showCompany && (
                    <td>
                      <div className={s.cellStack}>
                        <span>{a.company ?? <span className={s.none}>None</span>}</span>
                        {a.jobTitle && <span>{a.jobTitle}</span>}
                      </div>
                    </td>
                  )}
                  <td>{type && <Chip swatch={type.swatch}>{type.name}</Chip>}</td>
                  <td>
                    <div className={s.cellStack}>
                      <span>{pkg ? pkg.name : <span className={s.none}>None</span>}</span>
                    </div>
                  </td>
                  <td>
                    <StatusDot tone={st.tone}>{st.label}</StatusDot>
                  </td>
                  <td className={s.date}>{formatDateTimeAsDate(a.registeredAt, ev.timezone)}</td>
                  <td className={s.actionsCell}>
                    <Menu
                      label={`Actions for ${name}`}
                      width={230}
                      items={rowMenu(a, (kind) => onAction({ kind, id: a.id, anchor: kebabs.current.get(a.id) ?? null }))}
                      trigger={(tp) => (
                        <IconButton
                          {...tp}
                          ref={mergeRefs(tp.ref, (el: HTMLButtonElement | null) => {
                            kebabs.current.set(a.id, el);
                          })}
                          icon="ellipsis"
                          label={`Actions for ${name}`}
                          size={30}
                          className={t.rowActions}
                        />
                      )}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!empty && <Pagination page={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onPage={pagination.onPage} onPageSize={pagination.onPageSize} />}
    </div>
  );
}
