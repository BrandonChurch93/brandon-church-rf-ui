import { useEffect, useMemo, useRef, useState } from 'react';
import type { ViewProps } from '../../shell/ViewSwitch';
import { ViewHeader } from '../../shell/ViewHeader';
import { useStore, selectActive } from '@/store/store';
import { codeStatus, type CodeStatus } from '@/store/selectors';
import type { EventRecord, RegCode, RegCodeType } from '@/store/types';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { CopyButton } from '../../ui/CopyButton';
import { Chip, EmptyState, FilterChip, ProgressBar } from '../../ui/display';
import { Switch } from '../../ui/form/Switch';
import { Checkbox } from '../../ui/form/Checkbox';
import { DisabledReason } from '../../ui/DisabledReason';
import { Tooltip } from '../../ui/Tooltip';
import { Popover } from '../../ui/overlay/Popover';
import { SearchField } from '../../ui/SearchField';
import { SortHeader, cycleSort, tableStyles as t, type SortState } from '../../ui/Table';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { copyText } from '../../lib/clipboard';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { useShell, registerIntent } from '../../shellStore';
import { flash, useFlipList } from '@/motion/flip';
import { formatDate, formatNumber, plural, todayIn } from '../../lib/format';
import { CodeEditor } from './CodeEditor';
import { generateCode } from '@/store/slices/codes';
import { BulkGenerate } from './BulkGenerate';
import l from '../shared/lists.module.scss';
import a from '../attendees/attendees.module.scss';
import s from './codes.module.scss';

registerIntent('generate-code');

export const TYPE_META: Record<RegCodeType, { label: string; tone: 'accent' | 'berry' | 'neutral' }> = {
  comp: { label: 'Comp', tone: 'accent' },
  discount: { label: 'Discount', tone: 'berry' },
  access: { label: 'Access', tone: 'neutral' },
};
const STATUS_LABEL: Record<CodeStatus, string> = { active: 'Active', inactive: 'Inactive', expired: 'Expired', exhausted: 'Exhausted' };
type SortKey = 'code' | 'label' | 'type' | 'uses' | 'expires';

/** What the code links to, shown under its label. */
export function linkCaption(ev: EventRecord, c: RegCode): { text: string; missing?: boolean } | null {
  if (c.type === 'discount') {
    const d = ev.discounts.find((x) => x.id === c.discountId);
    return d ? { text: `Applies ${d.name}` } : { text: 'Discount removed', missing: true };
  }
  if (c.type === 'access' && c.grantsTypeId) {
    const ty = ev.attendeeTypes.find((x) => x.id === c.grantsTypeId);
    return ty ? { text: `Grants ${ty.name}` } : null;
  }
  return null;
}

/** Registration codes: generate, bulk generate, copy, activate, expire. */
export function RegCodesView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const setActive = useStore((st) => st.setCodeActive);
  const removeCode = useStore((st) => st.removeCode);
  const duplicateCode = useStore((st) => st.duplicateCode);
  const { isMobile, isLg } = useBreakpoint();
  const today = todayIn(ev.timezone);
  const [q, setQ] = useState('');
  const [types, setTypes] = useState<RegCodeType[]>([]);
  const [statuses, setStatuses] = useState<CodeStatus[]>([]);
  const [sort, setSort] = useState<SortState<SortKey> | null>(null);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [bulk, setBulk] = useState(false);
  const [streaming, setStreaming] = useState<string[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const body = useRef<HTMLElement>(null);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);

  useEffect(() => {
    if (intent?.type === 'generate-code') {
      consume(intent.id);
      setEditing('new');
    }
  }, [intent, consume]);

  const rows = useMemo(() => {
    const norm = (x: string) => x.replace(/-/g, '').toLowerCase();
    const query = norm(q.trim());
    const list = ev.regCodes.filter((c) => {
      if (query && !norm(c.code).includes(query) && !c.label.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (types.length && !types.includes(c.type)) return false;
      if (statuses.length && !statuses.includes(codeStatus(c, today))) return false;
      return true;
    });
    if (!sort) return list;
    const val = (c: RegCode): string | number => (sort.key === 'code' ? c.code : sort.key === 'label' ? c.label.toLowerCase() : sort.key === 'type' ? c.type : sort.key === 'uses' ? c.uses : (c.expiresOn ?? '9999'));
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((x, y) => (val(x) < val(y) ? -dir : val(x) > val(y) ? dir : 0));
  }, [ev.regCodes, q, types, statuses, sort, today]);

  useFlipList(body, rows.map((r) => r.id).join(','), { enter: false });
  useEffect(() => {
    if (!fresh) return;
    const tm = window.setTimeout(() => flash(body.current?.querySelector<HTMLElement>(`[data-flip-id="${fresh}"]`) ?? null), 200);
    setFresh(null);
    return () => window.clearTimeout(tm);
  }, [fresh]);

  const filtered = Boolean(q.trim() || types.length || statuses.length);
  const clear = () => {
    setQ('');
    setTypes([]);
    setStatuses([]);
  };
  const toggleActive = (c: RegCode, on: boolean) => {
    const token = setActive(c.id, on);
    toast.undo(`${on ? 'Activated' : 'Deactivated'} ${c.code}`, token, `Undo ${on ? 'activating' : 'deactivating'} ${c.code}`);
  };
  const onRemove = async (c: RegCode) => {
    if (!(await confirmDialog({ title: `Remove ${c.code}?`, body: 'Attendees who used it keep their registrations.', confirmLabel: 'Remove', danger: true }))) return;
    const token = removeCode(c.id);
    toast.undo(`Removed ${c.code}`, token, `Undo removing ${c.code}`);
  };
  const menuFor = (c: RegCode) => [
    { id: 'edit', label: 'Edit', icon: 'pencil' as const, onSelect: () => setEditing(c.id) },
    {
      id: 'copy',
      label: 'Copy code',
      icon: 'copy' as const,
      onSelect: async () => {
        if (await copyText(c.code)) toast.success(`Copied ${c.code}`);
      },
    },
    {
      id: 'dup',
      label: 'Duplicate',
      icon: 'duplicate' as const,
      onSelect: () => {
        const id = duplicateCode(c.id, generateCode(ev.regCodes.map((x) => x.code), ev.regCodes[0]?.code.split('-')[0] || 'RF'));
        if (id) {
          toast.success(`Duplicated ${c.code}`);
          setFresh(id);
        }
      },
    },
    { id: 'div', type: 'divider' as const },
    { id: 'remove', label: 'Remove', icon: 'trash' as const, danger: true, onSelect: () => void onRemove(c) },
  ];

  const activeSwitch = (c: RegCode) => {
    const st = codeStatus(c, today);
    if (st === 'expired' || st === 'exhausted')
      return (
        <DisabledReason reason={st === 'expired' ? 'Expired codes cannot be activated' : 'All uses consumed'} label={`${c.code} is ${STATUS_LABEL[st].toLowerCase()}`}>
          <Switch checked={false} disabled onChange={() => undefined} ariaLabel={`${c.code} active`} />
        </DisabledReason>
      );
    return <Switch checked={c.active} onChange={(on) => toggleActive(c, on)} ariaLabel={`${c.code} active`} />;
  };

  const empty =
    ev.regCodes.length === 0 ? (
      <EmptyState icon="key-round" title="No codes yet" body="Generate codes for comps, discounts or special access." action={{ label: 'Generate code', icon: 'plus', onClick: () => setEditing('new') }} />
    ) : rows.length === 0 ? (
      <EmptyState icon="search-x" title="No codes match" body="Try a different search or clear the filters." action={{ label: 'Clear filters', onClick: clear }} />
    ) : null;

  const uses = (c: RegCode) =>
    c.maxUses !== null ? (
      <div className={s.uses}>
        <span>
          {formatNumber(c.uses)} of {formatNumber(c.maxUses)}
        </span>
        <ProgressBar value={Math.min(c.uses, c.maxUses)} max={c.maxUses} label={`${c.code} uses, ${c.uses} of ${c.maxUses}`} thin variant={c.uses >= c.maxUses ? 'warning' : 'solid'} />
      </div>
    ) : (
      <div className={s.uses}>
        <span>{formatNumber(c.uses)} used</span>
      </div>
    );
  const expiry = (c: RegCode) =>
    c.expiresOn ? <span className={c.expiresOn < today ? s.expired : undefined}>{formatDate(c.expiresOn)}</span> : <span className={s.none}>No expiry</span>;

  return (
    <>
      <ViewHeader
        title="Reg codes"
        description="Codes attendees enter or follow to register with special access or pricing."
        aside={
          isMobile && (
            <Menu
              label="More code actions"
              items={[{ id: 'bulk', label: 'Bulk generate', icon: 'layers', onSelect: () => setBulk(true) }]}
              trigger={(tp) => <IconButton {...tp} icon="ellipsis" label="More actions" variant="subtle" />}
            />
          )
        }
        actions={
          <>
            {!isMobile && (
              <Button variant="secondary" icon="layers" onClick={() => setBulk(true)}>
                Bulk generate
              </Button>
            )}
            <Button variant="primary" icon="plus" className="primary-action" fullWidth={isMobile} onClick={() => setEditing('new')}>
              Generate code
            </Button>
          </>
        }
      />
      <div className={l.toolbar} data-part>
        <SearchField className={l.search} label="Search codes" placeholder="Search codes or labels" value={q} onChange={setQ} />
        <OptionFilter label="Type" value={types} onChange={(v) => setTypes(v as RegCodeType[])} options={(Object.keys(TYPE_META) as RegCodeType[]).map((k) => ({ value: k, label: TYPE_META[k].label }))} />
        <OptionFilter label="Status" value={statuses} onChange={(v) => setStatuses(v as CodeStatus[])} options={(Object.keys(STATUS_LABEL) as CodeStatus[]).map((k) => ({ value: k, label: STATUS_LABEL[k] }))} />
        {filtered && (
          <Button size="sm" variant="ghost" onClick={clear}>
            Clear filters
          </Button>
        )}
        <span className={l.count} aria-live="polite">
          {filtered ? `${rows.length} of ${plural(ev.regCodes.length, 'code')}` : plural(ev.regCodes.length, 'code')}
        </span>
      </div>
      <section data-part aria-label="Codes">
        {isMobile ? (
          empty ? (
            <div className={t.card}>{empty}</div>
          ) : (
            <div ref={body as React.RefObject<HTMLDivElement>} className={s.cards}>
              {rows.map((c) => {
                const link = linkCaption(ev, c);
                return (
                  <div key={c.id} data-flip-id={c.id} className={`${s.mcard} ${streaming.includes(c.id) ? s.streaming : ''}`} style={streaming.includes(c.id) ? { animationDelay: `${Math.min(streaming.indexOf(c.id), 9) * 40}ms` } : undefined}>
                    <div className={s.mbody}>
                      <div className={s.mcode}>
                        <button type="button" onClick={() => setEditing(c.id)} aria-label={`${c.code}, ${c.label}. Edit`}>
                          {c.code}
                        </button>
                        <CopyButton text={c.code} label={`Copy ${c.code}`} />
                      </div>
                      <span>{c.label}</span>
                      <div className={s.mrow}>
                        <Chip tone={TYPE_META[c.type].tone}>{TYPE_META[c.type].label}</Chip>
                        <span>{c.maxUses !== null ? `${formatNumber(c.uses)} of ${formatNumber(c.maxUses)} used` : `${formatNumber(c.uses)} used`}</span>
                        {expiry(c)}
                        {link && <span className={link.missing ? s.warn : undefined}>{link.missing && <i />}{link.text}</span>}
                      </div>
                    </div>
                    <div className={s.mside}>{activeSwitch(c)}</div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className={t.card}>
            <div className={t.scroller}>
              <table className={`${t.table} ${s.table}`} aria-label="Registration codes">
                <colgroup>
                  <col style={{ width: 220 }} />
                  <col />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 160 }} />
                  {!isLg && <col style={{ width: 130 }} />}
                  <col style={{ width: 80 }} />
                  <col style={{ width: 56 }} />
                </colgroup>
                <thead>
                  <tr>
                    <SortHeader sortKey="code" sort={sort} onSort={(k) => setSort((cur) => cycleSort(cur, k))}>
                      Code
                    </SortHeader>
                    <SortHeader sortKey="label" sort={sort} onSort={(k) => setSort((cur) => cycleSort(cur, k))}>
                      Label
                    </SortHeader>
                    <SortHeader sortKey="type" sort={sort} onSort={(k) => setSort((cur) => cycleSort(cur, k))}>
                      Type
                    </SortHeader>
                    <SortHeader sortKey="uses" sort={sort} onSort={(k) => setSort((cur) => cycleSort(cur, k))}>
                      Uses
                    </SortHeader>
                    {!isLg && (
                      <SortHeader sortKey="expires" sort={sort} onSort={(k) => setSort((cur) => cycleSort(cur, k))}>
                        Expires
                      </SortHeader>
                    )}
                    <th scope="col">Active</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody ref={body as React.RefObject<HTMLTableSectionElement>}>
                  {empty && (
                    <tr>
                      <td colSpan={isLg ? 6 : 7} className={a.emptyCell}>
                        {empty}
                      </td>
                    </tr>
                  )}
                  {rows.map((c) => {
                    const link = linkCaption(ev, c);
                    const isStreaming = streaming.includes(c.id);
                    return (
                      <tr
                        key={c.id}
                        data-flip-id={c.id}
                        data-clickable
                        className={isStreaming ? s.streaming : undefined}
                        style={isStreaming ? { animationDelay: `${Math.min(streaming.indexOf(c.id), 9) * 40}ms` } : undefined}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button, input, [role="switch"], [role="group"]')) return;
                          setEditing(c.id);
                        }}
                      >
                        <td>
                          <div className={s.codeCell}>
                            <button type="button" className={s.code} onClick={() => setEditing(c.id)} aria-label={`${c.code}. Edit`}>
                              {c.code}
                            </button>
                            <CopyButton text={c.code} label={`Copy ${c.code}`} className={s.copy} />
                          </div>
                        </td>
                        <td>
                          <div className={s.stack}>
                            <span>{c.label}</span>
                            {link &&
                              (link.missing ? (
                                <Tooltip content="Discount missing">
                                  <span className={s.warn} tabIndex={-1}>
                                    <i aria-hidden="true" />
                                    {link.text}
                                  </span>
                                </Tooltip>
                              ) : (
                                <span>{link.text}</span>
                              ))}
                            {isLg && <span>{c.expiresOn ? `Expires ${formatDate(c.expiresOn)}` : 'No expiry'}</span>}
                          </div>
                        </td>
                        <td>
                          <Chip tone={TYPE_META[c.type].tone}>{TYPE_META[c.type].label}</Chip>
                        </td>
                        <td>{uses(c)}</td>
                        {!isLg && <td>{expiry(c)}</td>}
                        <td>{activeSwitch(c)}</td>
                        <td style={{ textAlign: 'right', paddingLeft: 0 }}>
                          <Menu label={`Actions for ${c.code}`} width={200} items={menuFor(c)} trigger={(tp) => <IconButton {...tp} icon="ellipsis" label={`Actions for ${c.code}`} size={30} className={t.rowActions} />} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      <CodeEditor
        id={editing}
        onClose={() => setEditing(null)}
        onCreated={(id) => {
          clear();
          setSort(null);
          setFresh(id);
        }}
      />
      <BulkGenerate
        open={bulk}
        onClose={() => setBulk(false)}
        onCreated={(ids) => {
          clear();
          setSort(null);
          setStreaming(ids);
          window.setTimeout(() => setStreaming([]), 1200);
        }}
      />
    </>
  );
}

/** A filter chip with a checkbox popover (codes and exhibitors). */
export function OptionFilter({ label, value, onChange, options }: { label: string; value: string[]; onChange: (v: string[]) => void; options: Array<{ value: string; label: string }> }) {
  const [open, setOpen] = useState(false);
  const chip = useRef<HTMLButtonElement>(null);
  return (
    <>
      <FilterChip ref={chip} label={label} count={value.length} onClear={() => onChange([])} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)} />
      <Popover open={open} onClose={() => setOpen(false)} anchor={chip} label={`${label} filter`} placement="bottom-start" width={220}>
        <div className={a.filterList}>
          {options.map((o) => (
            <div key={o.value} className={a.filterOption}>
              <Checkbox checked={value.includes(o.value)} onChange={(on) => onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))} label={o.label} />
            </div>
          ))}
        </div>
      </Popover>
    </>
  );
}
