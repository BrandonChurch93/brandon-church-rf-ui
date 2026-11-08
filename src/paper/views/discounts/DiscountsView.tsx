import { useEffect, useRef, useState } from 'react';
import type { ViewProps } from '../../shell/ViewSwitch';
import { ViewHeader } from '../../shell/ViewHeader';
import { useStore, selectActive } from '@/store/store';
import { discountWindow } from '@/store/selectors';
import type { Discount } from '@/store/types';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { Chip, EmptyState } from '../../ui/display';
import { Switch } from '../../ui/form/Switch';
import { DisabledReason } from '../../ui/DisabledReason';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { useFlipList, flash, animateOut } from '@/motion/flip';
import { formatNumber, plural, todayIn } from '../../lib/format';
import { useShell, registerIntent } from '../../shellStore';
import { ruleText, windowText } from './math';
import { DiscountEditor } from './DiscountEditor';
import l from '../shared/lists.module.scss';
import s from './discounts.module.scss';

registerIntent('add-discount');

/** Discounts read as sentences; the editor shows the new prices live. */
export function DiscountsView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const setActive = useStore((st) => st.setDiscountActive);
  const duplicate = useStore((st) => st.duplicateDiscount);
  const remove = useStore((st) => st.removeDiscount);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);
  const today = todayIn(ev.timezone);

  useFlipList(list, ev.discounts.map((d) => d.id).join(','));
  useEffect(() => {
    if (intent?.type === 'add-discount') {
      consume(intent.id);
      setEditing('new');
    }
  }, [intent, consume]);
  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => flash(list.current?.querySelector<HTMLElement>(`[data-flip-id="${fresh}"]`) ?? null), 300);
    setFresh(null);
    return () => window.clearTimeout(t);
  }, [fresh]);

  const onRemove = async (d: Discount, row: HTMLElement | null) => {
    const refs = ev.regCodes.filter((c) => c.discountId === d.id).length;
    const ok = await confirmDialog({
      title: `Remove ${d.name}?`,
      body: refs ? `${plural(refs, 'code')} ${refs === 1 ? 'references' : 'reference'} this discount and will stop applying it.` : 'No codes reference this discount.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    animateOut(row, () => {
      const token = remove(d.id);
      toast.undo(`Removed ${d.name}`, token, `Undo removing ${d.name}`);
    });
  };

  return (
    <>
      <ViewHeader
        title="Discounts"
        description="Reduce package prices for a window of time or a group of attendees."
        actions={
          <Button variant="primary" icon="plus" className="primary-action" onClick={() => setEditing('new')}>
            Add discount
          </Button>
        }
      />
      <section data-part aria-label="Discounts">
        {ev.discounts.length === 0 ? (
          <div className={l.card}>
            <EmptyState icon="percent" title="No discounts yet" body="Create a discount and attach it to a reg code or a window." action={{ label: 'Add discount', icon: 'plus', onClick: () => setEditing('new') }} />
          </div>
        ) : (
          <div ref={list} className={l.card}>
            {ev.discounts.map((d) => {
              const w = discountWindow(d, today);
              const ended = w === 'ended';
              const usage = d.limit !== null ? `${formatNumber(d.uses)} of ${formatNumber(d.limit)} uses` : plural(d.uses, 'use');
              return (
                <div key={d.id} data-flip-id={d.id} className={`${l.row} ${s.row}`} data-clickable>
                  <div className={s.main}>
                    <button type="button" className={s.name} onClick={() => setEditing(d.id)} aria-label={`${d.name}. ${ruleText(ev, d)}. ${windowText(d)}. Edit`}>
                      {d.name}
                    </button>
                    <span className={s.rule}>{ruleText(ev, d)}</span>
                  </div>
                  <div className={s.window} data-ended={ended || undefined}>
                    <span>{windowText(d)}</span>
                    {ended && <small>Ended</small>}
                    <span className={s.mobileUsage}>{usage}</span>
                  </div>
                  <span className={s.usage}>{usage}</span>
                  <div className={s.control}>
                    {w === 'scheduled' && <Chip>Scheduled</Chip>}
                    {ended ? (
                      <DisabledReason reason="This window has ended" label={`${d.name} has ended`}>
                        <Switch checked={false} disabled onChange={() => undefined} ariaLabel={`${d.name} active`} />
                      </DisabledReason>
                    ) : (
                      <Switch
                        checked={d.active}
                        ariaLabel={`${d.name} active`}
                        onChange={(on) => {
                          const token = setActive(d.id, on);
                          toast.undo(`${on ? 'Activated' : 'Deactivated'} ${d.name}`, token);
                        }}
                      />
                    )}
                  </div>
                  <span className={s.kebab}>
                    <Menu
                      label={`${d.name} actions`}
                      width={200}
                      items={[
                        { id: 'edit', label: 'Edit', icon: 'pencil', onSelect: () => setEditing(d.id) },
                        {
                          id: 'dup',
                          label: 'Duplicate',
                          icon: 'duplicate',
                          onSelect: () => {
                            const id = duplicate(d.id);
                            if (id) {
                              toast.success(`Duplicated ${d.name}`);
                              setFresh(id);
                            }
                          },
                        },
                        { id: 'div', type: 'divider' },
                        { id: 'remove', label: 'Remove', icon: 'trash', danger: true, onSelect: () => void onRemove(d, list.current?.querySelector(`[data-flip-id="${d.id}"]`) ?? null) },
                      ]}
                      trigger={(t) => <IconButton {...t} icon="ellipsis" label={`${d.name} actions`} size={30} />}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <DiscountEditor id={editing} onClose={() => setEditing(null)} onCreated={setFresh} />
    </>
  );
}
