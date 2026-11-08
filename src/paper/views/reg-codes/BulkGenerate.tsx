import { useEffect, useMemo, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import type { RegCodeType } from '@/store/types';
import { generateCode } from '@/store/slices/codes';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/form/Input';
import { NumberField } from '../../ui/form/NumberField';
import { DateField } from '../../ui/form/DateField';
import { Select } from '../../ui/form/Select';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { toast } from '../../ui/toastStore';
import { codePrefix } from './CodeEditor';
import l from '../shared/lists.module.scss';
import s from './codes.module.scss';

/** Many codes at once: "Partner comp 01" to "Partner comp 10". Undo removes them all. */
export function BulkGenerate({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (ids: string[]) => void }) {
  const ev = useStore(selectActive);
  const bulkAdd = useStore((st) => st.bulkAddCodes);
  const [count, setCount] = useState<number | null>(10);
  const [prefix, setPrefix] = useState('Partner comp');
  const [type, setType] = useState<RegCodeType>('comp');
  const [discountId, setDiscountId] = useState<string | null>(null);
  const [grants, setGrants] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState<number | null>(1);
  const [expires, setExpires] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (open) {
      setCount(10);
      setPrefix('Partner comp');
      setType('comp');
      setDiscountId(null);
      setGrants(null);
      setMaxUses(1);
      setExpires(null);
      setSubmitted(false);
    }
  }, [open]);

  const n = count ?? 0;
  const pre = codePrefix(ev.regCodes.map((c) => c.code));
  const preview = useMemo(() => {
    const taken = ev.regCodes.map((c) => c.code);
    const out: string[] = [];
    for (let i = 0; i < 3; i++) out.push(generateCode([...taken, ...out], pre));
    return out;
    // A fresh sample when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const errors: Record<string, string | undefined> = {};
  if (!count || count < 1 || count > 100) errors.count = 'Choose 1 to 100 codes';
  if (!prefix.trim()) errors.prefix = 'Enter a label prefix';
  if (type === 'discount' && !discountId) errors.discount = 'Choose a discount';
  const pad = String(n).length < 2 ? 2 : String(n).length;

  const generate = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const taken = ev.regCodes.map((c) => c.code);
    const list = Array.from({ length: n }, (_, i) => {
      const code = generateCode(taken, pre);
      taken.push(code);
      return { code, label: `${prefix.trim()} ${String(i + 1).padStart(pad, '0')}`, type, discountId: type === 'discount' ? discountId : null, grantsTypeId: type === 'access' ? grants : null, maxUses, expiresOn: expires, active: true };
    });
    const { ids, undo } = bulkAdd(list);
    onClose();
    onCreated(ids);
    toast.undo(`Generated ${n} codes`, undo, `Undo generating ${n} codes`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk generate codes"
      width={480}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={generate}>
            Generate {n > 0 ? `${n} ${n === 1 ? 'code' : 'codes'}` : 'codes'}
          </Button>
        </>
      }
    >
      <div className={l.form}>
        <div className={l.row2}>
          <NumberField label="Count" required value={count} onChange={setCount} min={1} max={100} error={submitted ? errors.count : undefined} />
          <NumberField label="Max uses per code" value={maxUses} onChange={setMaxUses} min={1} max={100000} placeholder="Unlimited" />
        </div>
        <Input label="Label prefix" required value={prefix} onChange={(e) => setPrefix(e.target.value)} error={submitted ? errors.prefix : undefined} help={prefix.trim() ? `${prefix.trim()} ${'1'.padStart(pad, '0')} to ${prefix.trim()} ${String(n || 1).padStart(pad, '0')}` : undefined} />
        <div className={l.fieldGroup}>
          <span className={l.fieldLabel}>Type</span>
          <SegmentedControl<RegCodeType>
            label="Type"
            value={type}
            fullWidth
            onChange={setType}
            options={[
              { value: 'comp', label: 'Comp' },
              { value: 'discount', label: 'Discount' },
              { value: 'access', label: 'Access' },
            ]}
          />
        </div>
        {type === 'discount' && <Select label="Applies discount" required value={discountId} onChange={setDiscountId} error={submitted ? errors.discount : undefined} options={ev.discounts.map((x) => ({ value: x.id, label: x.active ? x.name : `${x.name} (inactive)` }))} placeholder="Choose a discount" />}
        {type === 'access' && <Select label="Grants attendee type" value={grants} onChange={setGrants} options={ev.attendeeTypes.map((t) => ({ value: t.id, label: t.name }))} placeholder="No type change" />}
        <DateField label="Expires" value={expires} onChange={setExpires} timeZone={ev.timezone} help="Optional" />
        <div>
          <span className={l.fieldLabel}>Preview</span>
          <div className={s.preview}>
            {preview.map((c) => (
              <code key={c}>{c}</code>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
