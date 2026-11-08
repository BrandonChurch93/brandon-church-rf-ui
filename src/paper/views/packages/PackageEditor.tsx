import { useStore, selectActive } from '@/store/store';
import { packageSold } from '@/store/selectors';
import type { Package } from '@/store/types';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Input, Textarea } from '../../ui/form/Input';
import { CurrencyField } from '../../ui/form/CurrencyField';
import { NumberField } from '../../ui/form/NumberField';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { TagInput } from '../../ui/form/TagInput';
import { Checkbox } from '../../ui/form/Checkbox';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { useDraft } from '../../hooks/useDraft';
import { SheetFooter } from '../guide/SettingSheets';
import { toast } from '../../ui/toastStore';
import { formatNumber } from '../../lib/format';
import l from '../shared/lists.module.scss';

type Draft = Omit<Package, 'id' | 'priceMinor'> & { priceMinor: number | null };
const DESC_MAX = 200;

/** New or existing package: price, capacity, status, includes and who can buy it. */
export function PackageEditor({ id, onClose, onCreated }: { id: string | 'new' | null; onClose: () => void; onCreated: (id: string) => void }) {
  const ev = useStore(selectActive);
  const add = useStore((st) => st.addPackage);
  const update = useStore((st) => st.updatePackage);
  const flow = useSaveFlow();
  const existing = id && id !== 'new' ? ev.packages.find((p) => p.id === id) : null;
  const sold = existing ? (packageSold(ev).get(existing.id) ?? 0) : 0;
  const open = id !== null;
  const f = useDraft<Draft>(open, () =>
    existing ? structuredClone({ ...existing, id: undefined }) : { name: '', priceMinor: null, capacity: null, status: 'draft', description: '', includes: [], attendeeTypeIds: [] },
  );
  const d = f.draft;
  const errors: Record<string, string | undefined> = {};
  if (!d.name.trim()) errors.name = 'Enter a name';
  else if (ev.packages.some((p) => p.id !== existing?.id && p.name.toLowerCase() === d.name.trim().toLowerCase())) errors.name = 'Another package already has this name';
  if (d.priceMinor === null) errors.price = 'Enter a price, or 0 for free';
  else if (d.priceMinor < 0) errors.price = 'Price cannot be negative';
  if (d.capacity !== null && d.capacity < Math.max(1, sold)) errors.capacity = sold > 0 ? `Already ${formatNumber(sold)} sold, so capacity must be at least ${formatNumber(sold)}` : 'Use at least 1, or leave blank for unlimited';
  if (d.description.length > DESC_MAX) errors.description = `Keep it to ${DESC_MAX} characters`;
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);
  const suggestions = Array.from(new Set(ev.packages.flatMap((p) => p.includes)));
  const allTypes = d.attendeeTypeIds.length === 0;

  const submit = () => {
    f.setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const record = { ...d, name: d.name.trim(), description: d.description.trim(), priceMinor: d.priceMinor ?? 0 };
    delete (record as { id?: string }).id;
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

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Edit package' : 'New package'}
      subtitle={existing ? `${formatNumber(sold)} sold` : undefined}
      dirty={f.dirty && flow.state === 'idle'}
      footer={<SheetFooter onCancel={() => void cancel()} onSave={submit} saving={flow.loading} success={flow.success} label={existing ? 'Save' : 'Add package'} />}
    >
      <form
        className={l.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Input label="Name" required value={d.name} onChange={(e) => f.set('name', e.target.value)} onBlur={() => f.touch('name')} error={f.show(errors, 'name')} placeholder="Full Conference" autoFocus={!existing} />
        <div className={l.row2}>
          <CurrencyField label="Price" required value={d.priceMinor} onChange={(v) => f.set('priceMinor', v)} onBlur={() => f.touch('price')} currency={ev.currency} error={f.show(errors, 'price')} help="0 makes it free" />
          <NumberField label="Capacity" value={d.capacity} onChange={(v) => f.set('capacity', v)} onBlur={() => f.touch('capacity')} min={1} max={100000} placeholder="Unlimited" error={f.show(errors, 'capacity')} help="Leave blank for unlimited" />
        </div>
        {d.status !== 'archived' ? (
          <div className={l.fieldGroup}>
            <span className={l.fieldLabel}>Status</span>
            <SegmentedControl
              label="Status"
              value={d.status as 'draft' | 'active'}
              onChange={(v) => f.set('status', v)}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
              ]}
            />
            <span className={l.help}>{d.status === 'active' ? 'On sale to the attendee types below.' : 'Hidden from registration until it is active.'}</span>
          </div>
        ) : (
          <p className={l.help}>This package is archived. Unarchive it from its card menu to sell it again.</p>
        )}
        <Textarea label="Description" value={d.description} onChange={(e) => f.set('description', e.target.value)} maxCount={DESC_MAX} rows={3} error={f.show(errors, 'description')} placeholder="What the package gets you" />
        <TagInput label="Includes" value={d.includes} onChange={(v) => f.set('includes', v)} suggestions={suggestions} max={12} />
        <div className={l.fieldGroup} role="group" aria-labelledby="available-to">
          <span className={l.fieldLabel} id="available-to">
            Available to
          </span>
          <div className={l.checklist}>
            <Checkbox checked={allTypes} onChange={(on) => on && f.set('attendeeTypeIds', [])} label="All attendee types" description={allTypes ? 'Anyone can buy this package' : undefined} />
            <div className={l.checkDivider} />
            {ev.attendeeTypes.map((t) => (
              <Checkbox
                key={t.id}
                checked={!allTypes && d.attendeeTypeIds.includes(t.id)}
                onChange={(on) => f.set('attendeeTypeIds', on ? [...d.attendeeTypeIds, t.id] : d.attendeeTypeIds.filter((x) => x !== t.id))}
                label={t.name}
              />
            ))}
          </div>
          <span className={l.help}>{allTypes ? 'All attendee types' : `${d.attendeeTypeIds.length} of ${ev.attendeeTypes.length} types`}</span>
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
