import { useStore, selectActive } from '@/store/store';
import type { RegCode, RegCodeType } from '@/store/types';
import { generateCode } from '@/store/slices/codes';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Input } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { NumberField } from '../../ui/form/NumberField';
import { DateField } from '../../ui/form/DateField';
import { Switch } from '../../ui/form/Switch';
import { IconButton } from '../../ui/IconButton';
import { useDraft } from '../../hooks/useDraft';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { SheetFooter } from '../guide/SettingSheets';
import { toast } from '../../ui/toastStore';
import { formatNumber, todayIn } from '../../lib/format';
import l from '../shared/lists.module.scss';

type Draft = Pick<RegCode, 'label' | 'type' | 'discountId' | 'grantsTypeId' | 'maxUses' | 'expiresOn' | 'active' | 'code'>;
export const CODE_RE = /^[A-Z0-9-]{6,20}$/;
const NONE = '__none__';

export function codePrefix(codes: string[]) {
  return codes[0]?.split('-')[0] || 'RF';
}

/** Generate a new code or edit one. Codes are uppercase, 6 to 20 characters, unique. */
export function CodeEditor({ id, onClose, onCreated }: { id: string | 'new' | null; onClose: () => void; onCreated: (id: string) => void }) {
  const ev = useStore(selectActive);
  const add = useStore((st) => st.addCode);
  const update = useStore((st) => st.updateCode);
  const flow = useSaveFlow();
  const existing = id && id !== 'new' ? ev.regCodes.find((c) => c.id === id) : null;
  const open = id !== null;
  const taken = (except?: string) => ev.regCodes.filter((c) => c.id !== except).map((c) => c.code);
  const f = useDraft<Draft>(open, () =>
    existing
      ? { label: existing.label, type: existing.type, discountId: existing.discountId, grantsTypeId: existing.grantsTypeId, maxUses: existing.maxUses, expiresOn: existing.expiresOn, active: existing.active, code: existing.code }
      : { label: '', type: 'comp', discountId: null, grantsTypeId: null, maxUses: null, expiresOn: null, active: true, code: generateCode(taken(), codePrefix(ev.regCodes.map((c) => c.code))) },
  );
  const d = f.draft;
  const today = todayIn(ev.timezone);
  const errors: Record<string, string | undefined> = {};
  if (!d.label.trim()) errors.label = 'Enter a label, like Speaker comp';
  if (!CODE_RE.test(d.code)) errors.code = 'Use 6 to 20 letters, digits or dashes';
  else if (taken(existing?.id).includes(d.code)) errors.code = 'Another code already uses this';
  if (d.type === 'discount' && !ev.discounts.some((x) => x.id === d.discountId)) errors.discount = 'Choose a discount';
  if (d.maxUses !== null && existing && d.maxUses < existing.uses) errors.maxUses = `Already used ${formatNumber(existing.uses)} times`;
  if (d.maxUses !== null && d.maxUses < 1) errors.maxUses = 'Use at least 1, or leave blank for unlimited';
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);
  // A code that lost its discount shows the problem immediately.
  const discountError = existing && d.type === 'discount' ? errors.discount : f.show(errors, 'discount');

  const submit = () => {
    f.setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const record = { ...d, label: d.label.trim(), discountId: d.type === 'discount' ? d.discountId : null, grantsTypeId: d.type === 'access' ? d.grantsTypeId : null };
    flow.run(() => {
      if (existing) {
        update(existing.id, record);
        toast.success(`Saved ${record.code}`);
      } else {
        const newId = add(record);
        toast.success(`Generated ${record.code}`);
        onCreated(newId);
      }
    }, onClose);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Edit code' : 'Generate code'}
      subtitle={existing ? (existing.maxUses !== null ? `${formatNumber(existing.uses)} of ${formatNumber(existing.maxUses)} used` : `${formatNumber(existing.uses)} used`) : undefined}
      dirty={f.dirty && flow.state === 'idle'}
      footer={<SheetFooter onCancel={() => void cancel()} onSave={submit} saving={flow.loading} success={flow.success} label={existing ? 'Save' : 'Generate'} />}
    >
      <form
        className={l.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Input label="Label" required value={d.label} onChange={(e) => f.set('label', e.target.value)} onBlur={() => f.touch('label')} error={f.show(errors, 'label')} placeholder="Speaker comp" autoFocus={!existing} />
        <div className={l.fieldGroup}>
          <span className={l.fieldLabel}>Type</span>
          <SegmentedControl<RegCodeType>
            label="Type"
            value={d.type}
            fullWidth
            onChange={(v) => f.set('type', v)}
            options={[
              { value: 'comp', label: 'Comp' },
              { value: 'discount', label: 'Discount' },
              { value: 'access', label: 'Access' },
            ]}
          />
          <span className={l.help}>{d.type === 'comp' ? 'Registers for free.' : d.type === 'discount' ? 'Applies a discount at checkout.' : 'Unlocks an attendee type or hidden packages.'}</span>
        </div>
        {d.type === 'discount' && (
          <Select
            label="Applies discount"
            required
            value={ev.discounts.some((x) => x.id === d.discountId) ? d.discountId : null}
            onChange={(v) => f.set('discountId', v)}
            onBlur={() => f.touch('discount')}
            error={discountError}
            placeholder="Choose a discount"
            options={ev.discounts.map((x) => ({ value: x.id, label: x.active ? x.name : `${x.name} (inactive)` }))}
            help={ev.discounts.length === 0 ? 'Create a discount first on the Discounts page.' : undefined}
          />
        )}
        {d.type === 'access' && (
          <Select
            label="Grants attendee type"
            value={d.grantsTypeId ?? NONE}
            onChange={(v) => f.set('grantsTypeId', v === NONE ? null : v)}
            options={[{ value: NONE, label: 'No type change' }, ...ev.attendeeTypes.map((t) => ({ value: t.id, label: t.name }))]}
          />
        )}
        <Input
          label="Code"
          required
          mono
          value={d.code}
          onChange={(e) => f.set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
          onBlur={() => f.touch('code')}
          error={f.show(errors, 'code')}
          maxLength={20}
          help="Letters, digits and dashes, 6 to 20 characters"
          suffix={!existing && <IconButton icon="refresh" label="Regenerate code" size={30} onClick={() => f.set('code', generateCode(taken(), codePrefix(ev.regCodes.map((c) => c.code))))} />}
        />
        <div className={l.row2}>
          <NumberField label="Max uses" value={d.maxUses} onChange={(v) => f.set('maxUses', v)} onBlur={() => f.touch('maxUses')} min={1} max={100000} placeholder="Unlimited" error={f.show(errors, 'maxUses')} help="Blank means unlimited" />
          <DateField label="Expires" value={d.expiresOn} onChange={(v) => f.set('expiresOn', v)} timeZone={ev.timezone} help={d.expiresOn && d.expiresOn < today ? 'This date has passed, so the code is expired' : 'Optional'} />
        </div>
        <Switch checked={d.active} onChange={(v) => f.set('active', v)} label="Active" />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
