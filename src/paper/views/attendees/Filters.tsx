import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { AttendeeStatus, EventRecord } from '@/store/types';
import { FilterChip, Badge } from '../../ui/display';
import { Checkbox } from '../../ui/form/Checkbox';
import { Popover } from '../../ui/overlay/Popover';
import { BottomSheet } from '../../ui/overlay/BottomSheet';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/form/Select';
import { countBy } from '@/store/selectors';
import { formatNumber, plural } from '../../lib/format';
import type { SortState } from '../../ui/Table';
import { applyFilters, filterCount, NONE, STATUSES, type Filters, type SortKey } from './query';
import s from './attendees.module.scss';

type Group = 'types' | 'statuses' | 'packages';
interface Option {
  value: string;
  label: string;
  count: number;
  dot?: string;
}

function useOptions(ev: EventRecord): Record<Group, Option[]> {
  return useMemo(() => {
    const byType = countBy(ev.attendees, (a) => a.attendeeTypeId);
    const byStatus = countBy(ev.attendees, (a) => a.status);
    const byPkg = countBy(ev.attendees, (a) => a.packageId ?? NONE);
    return {
      types: ev.attendeeTypes.map((t) => ({ value: t.id, label: t.name, count: byType.get(t.id) ?? 0, dot: `var(--sw-${t.swatch})` })),
      statuses: STATUSES.map((x) => ({ value: x.value, label: x.label, count: byStatus.get(x.value) ?? 0 })),
      packages: [...ev.packages.map((p) => ({ value: p.id, label: p.name, count: byPkg.get(p.id) ?? 0 })), { value: NONE, label: 'No package', count: byPkg.get(NONE) ?? 0 }],
    };
  }, [ev]);
}

const LABEL: Record<Group, string> = { types: 'Type', statuses: 'Status', packages: 'Package' };

function OptionList({ options, value, onChange, labelledBy }: { options: Option[]; value: string[]; onChange: (v: string[]) => void; labelledBy?: string }) {
  return (
    <div className={s.filterList} role="group" aria-labelledby={labelledBy}>
      {options.map((o) => (
        <div key={o.value} className={s.filterOption}>
          <Checkbox
            checked={value.includes(o.value)}
            onChange={(on) => onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))}
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {o.dot && <i style={{ width: 8, height: 8, borderRadius: 4, background: o.dot }} aria-hidden="true" />}
                {o.label}
              </span>
            }
          />
          <span className={s.filterCount} aria-hidden="true">
            {formatNumber(o.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Desktop: one toggle chip per group, each opening a checkbox popover. */
export function FilterChips({ ev, filters, onChange }: { ev: EventRecord; filters: Filters; onChange: (f: Filters) => void }) {
  const options = useOptions(ev);
  return (
    <div className={s.filters}>
      {(['types', 'statuses', 'packages'] as Group[]).map((g) => (
        <FilterGroup key={g} group={g} options={options[g]} value={filters[g] as string[]} onChange={(v) => onChange({ ...filters, [g]: v })} />
      ))}
    </div>
  );
}

function FilterGroup({ group, options, value, onChange }: { group: Group; options: Option[]; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const chip = useRef<HTMLButtonElement>(null);
  const label = LABEL[group];
  return (
    <>
      <FilterChip ref={chip} label={label} count={value.length} onClear={() => onChange([])} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)} />
      <Popover open={open} onClose={() => setOpen(false)} anchor={chip} label={`${label} filter`} placement="bottom-start">
        <OptionList options={options} value={value} onChange={onChange} />
        <div className={s.filterFooter}>
          <Button size="sm" variant="ghost" disabled={!value.length} onClick={() => onChange([])}>
            Clear
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </Popover>
    </>
  );
}

const SORTS: Array<{ value: string; label: string; sort: SortState<SortKey> | null }> = [
  { value: 'registered-desc', label: 'Newest first', sort: null },
  { value: 'registered-asc', label: 'Oldest first', sort: { key: 'registered', dir: 'asc' } },
  { value: 'name-asc', label: 'Name A to Z', sort: { key: 'name', dir: 'asc' } },
  { value: 'name-desc', label: 'Name Z to A', sort: { key: 'name', dir: 'desc' } },
  { value: 'company-asc', label: 'Company A to Z', sort: { key: 'company', dir: 'asc' } },
  { value: 'status-asc', label: 'Status', sort: { key: 'status', dir: 'asc' } },
];
const sortValue = (s2: SortState<SortKey> | null) => (s2 ? `${s2.key}-${s2.dir}` : 'registered-desc');

/** Mobile: one Filters button with a count; a bottom sheet with the groups, sort and a live count. */
export function MobileFilters({ ev, filters, sort, onApply }: { ev: EventRecord; filters: Filters; sort: SortState<SortKey> | null; onApply: (f: Filters, s: SortState<SortKey> | null) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [draftSort, setDraftSort] = useState(sort);
  const options = useOptions(ev);
  const n = filterCount(filters);
  const live = applyFilters(ev, draft).length;
  const groups: Array<[Group, ReactNode]> = (['types', 'statuses', 'packages'] as Group[]).map((g) => [
    g,
    <OptionList key={g} labelledBy={`mf-${g}`} options={options[g]} value={draft[g] as string[]} onChange={(v) => setDraft({ ...draft, [g]: v as AttendeeStatus[] & string[] })} />,
  ]);
  return (
    <>
      <Button
        variant="secondary"
        icon="sliders"
        onClick={() => {
          setDraft(filters);
          setDraftSort(sort);
          setOpen(true);
        }}
        aria-label={n ? `Filters, ${n} active` : 'Filters'}
      >
        Filters {n > 0 && <Badge tone="accent">{n}</Badge>}
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} label="Filters" title="Filters" full>
        <div className={s.sheetGroups}>
          <Select label="Sort by" value={sortValue(draftSort)} onChange={(v) => setDraftSort(SORTS.find((x) => x.value === v)!.sort)} options={SORTS.map(({ value, label }) => ({ value, label }))} />
          {groups.map(([g, node]) => (
            <div key={g}>
              <div className={s.sheetGroupTitle} id={`mf-${g}`}>
                {LABEL[g]}
              </div>
              {node}
            </div>
          ))}
        </div>
        <div className={s.sheetFooter}>
          <Button variant="ghost" onClick={() => setDraft({ ...draft, types: [], statuses: [], packages: [] })}>
            Clear
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onApply(draft, draftSort);
              setOpen(false);
            }}
          >
            Show {plural(live, 'attendee')}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
