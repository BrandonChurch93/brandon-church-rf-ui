import { useStore, selectActive } from '@/store/store';
import type { Discount } from '@/store/types';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Input } from '../../ui/form/Input';
import { NumberField } from '../../ui/form/NumberField';
import { CurrencyField } from '../../ui/form/CurrencyField';
import { DateField } from '../../ui/form/DateField';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { Checkbox } from '../../ui/form/Checkbox';
import { Switch } from '../../ui/form/Switch';
import { Icon } from '../../ui/Icon';
import { useDraft } from '../../hooks/useDraft';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { SheetFooter } from '../guide/SettingSheets';
import { toast } from '../../ui/toastStore';
import { currencySymbol, formatMoney, formatPrice } from '../../lib/format';
import { appliesTo, discounted } from './math';
import l from '../shared/lists.module.scss';
import s from './discounts.module.scss';

type Draft = Omit<Discount, 'id' | 'uses' | 'amount'> & { amount: number | null };

/** New or existing discount, with a live preview of every affected price. */
export function DiscountEditor({ id, onClose, onCreated }: { id: string | 'new' | null; onClose: () => void; onCreated: (id: string) => void }) {
  const ev = useStore(selectActive);
  const add = useStore((st) => st.addDiscount);
  const update = useStore((st) => st.updateDiscount);
  const flow = useSaveFlow();
  const existing = id && id !== 'new' ? ev.discounts.find((x) => x.id === id) : null;
  const open = id !== null;
  const f = useDraft<Draft>(open, () =>
    existing
      ? { name: existing.name, kind: existing.kind, amount: existing.amount, packageIds: [...existing.packageIds], startsOn: existing.startsOn, endsOn: existing.endsOn, limit: existing.limit, active: existing.active }
      : { name: '', kind: 'percent', amount: null, packageIds: [], startsOn: null, endsOn: null, limit: null, active: true },
  );
  const d = f.draft;
  const choosable = ev.packages.filter((p) => p.status !== 'archived');
  const all = d.packageIds.length === 0;
  const targets = appliesTo(ev, d.packageIds);
  const paid = targets.filter((p) => p.priceMinor > 0);
  const lowest = paid.length ? Math.min(...paid.map((p) => p.priceMinor)) : null;

  const errors: Record<string, string | undefined> = {};
  if (!d.name.trim()) errors.name = 'Enter a name';
  if (d.amount === null) errors.amount = d.kind === 'percent' ? 'Enter a percentage' : 'Enter an amount';
  else if (d.kind === 'percent' && (d.amount < 1 || d.amount > 100 || !Number.isInteger(d.amount))) errors.amount = 'Use a whole number from 1 to 100';
  else if (d.kind === 'fixed' && d.amount <= 0) errors.amount = 'Enter an amount above zero';
  else if (d.kind === 'fixed' && lowest !== null && d.amount > lowest) errors.amount = `Cannot exceed the lowest selected package price (${formatMoney(lowest, ev.currency)})`;
  if (d.startsOn && d.endsOn && d.endsOn < d.startsOn) errors.endsOn = 'Must be on or after the start date';
  if (choosable.length === 0) errors.packages = 'Add a package first';
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);

  const submit = () => {
    f.setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const record = { ...d, name: d.name.trim(), amount: d.amount ?? 0 };
    flow.run(() => {
      if (existing) {
        update(existing.id, record);
        toast.success(`Saved ${record.name}`);
      } else {
        const newId = add(record);
        toast.success(`Added ${record.name}`);
        onCreated(newId);
      }
    }, onClose);
  };

  const amountError = d.kind === 'fixed' && errors.amount?.startsWith('Cannot exceed') ? errors.amount : f.show(errors, 'amount');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Edit discount' : 'New discount'}
      subtitle={existing ? `${existing.uses} uses so far` : undefined}
      dirty={f.dirty && flow.state === 'idle'}
      footer={<SheetFooter onCancel={() => void cancel()} onSave={submit} saving={flow.loading} success={flow.success} label={existing ? 'Save' : 'Add discount'} />}
    >
      <form
        className={l.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Input label="Name" required value={d.name} onChange={(e) => f.set('name', e.target.value)} onBlur={() => f.touch('name')} error={f.show(errors, 'name')} placeholder="Early bird" autoFocus={!existing} />
        <div className={s.amountRow}>
          <div className={l.fieldGroup}>
            <span className={l.fieldLabel}>Type</span>
            <SegmentedControl
              label="Discount type"
              value={d.kind}
              onChange={(v) => {
                f.set('kind', v);
                f.set('amount', null);
              }}
              options={[
                { value: 'percent', label: '%' },
                { value: 'fixed', label: currencySymbol(ev.currency) },
              ]}
            />
          </div>
          {d.kind === 'percent' ? (
            <NumberField label="Amount" required value={d.amount} onChange={(v) => f.set('amount', v)} onBlur={() => f.touch('amount')} min={1} max={100} suffix="%" error={amountError} placeholder="25" />
          ) : (
            <CurrencyField label="Amount" required value={d.amount} onChange={(v) => f.set('amount', v)} onBlur={() => f.touch('amount')} currency={ev.currency} error={amountError} placeholder="50" />
          )}
        </div>
        <div className={l.fieldGroup} role="group" aria-labelledby="applies-to">
          <span className={l.fieldLabel} id="applies-to">
            Applies to
          </span>
          <div className={l.checklist}>
            <Checkbox checked={all} onChange={(on) => f.set('packageIds', on ? [] : [choosable[0]?.id].filter(Boolean) as string[])} label="All packages" />
            <div className={l.checkDivider} />
            {choosable.map((p) => (
              <Checkbox
                key={p.id}
                checked={all || d.packageIds.includes(p.id)}
                onChange={(on) => {
                  const base = all ? choosable.map((x) => x.id) : d.packageIds;
                  const next = on ? [...base, p.id] : base.filter((x) => x !== p.id);
                  f.set('packageIds', next.length === choosable.length ? [] : next.length === 0 ? base : next);
                }}
                label={`${p.name}${p.status === 'draft' ? ' (draft)' : ''}`}
                description={formatPrice(p.priceMinor, ev.currency)}
              />
            ))}
          </div>
          {errors.packages && <span className={l.error}>{errors.packages}</span>}
        </div>
        <div className={l.row2}>
          <DateField label="Starts" value={d.startsOn} onChange={(v) => f.set('startsOn', v)} timeZone={ev.timezone} help="Optional" />
          <DateField label="Ends" value={d.endsOn} onChange={(v) => f.set('endsOn', v)} min={d.startsOn} timeZone={ev.timezone} onBlur={() => f.touch('endsOn')} error={f.show(errors, 'endsOn')} help="Optional. Both blank means always." />
        </div>
        <NumberField label="Limit" value={d.limit} onChange={(v) => f.set('limit', v)} min={1} max={100000} placeholder="Unlimited" help="Total uses allowed. Blank means unlimited." />
        <Switch checked={d.active} onChange={(v) => f.set('active', v)} label="Active" />
        <section className={s.preview} aria-label="Price preview" aria-live="polite">
          <h4>Preview</h4>
          <div className={s.previewList}>
            {targets.map((p) => {
              const next = d.amount !== null && !errors.amount ? discounted(p.priceMinor, d.kind, d.amount) : null;
              return (
                <div key={p.id} className={s.previewRow} data-preview={p.name}>
                  <span>{p.name}</span>
                  <span className="sr-only"> · </span>
                  {p.priceMinor === 0 ? (
                    <span>Free · no change</span>
                  ) : next === null ? (
                    <span>{formatMoney(p.priceMinor, ev.currency)}</span>
                  ) : (
                    <span>
                      <s>{formatMoney(p.priceMinor, ev.currency)}</s>
                      <Icon name="arrow-right" size={12} className={s.arrow} />
                      <span className="sr-only"> → </span>
                      <strong>{next === 0 ? 'Free' : formatMoney(next, ev.currency)}</strong>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
