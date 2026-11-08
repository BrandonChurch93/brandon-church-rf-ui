import { useStore, selectActive } from '@/store/store';
import type { ExhibitorStatus, ExhibitorTier } from '@/store/types';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Input } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { useDraft } from '../../hooks/useDraft';
import { SheetFooter, EMAIL_RE } from '../guide/SettingSheets';
import { PHONE_RE } from '../attendees/AttendeeDetail';
import { toast } from '../../ui/toastStore';
import { STATUS_META, TIERS, TIER_META, URL_RE, boothOrder, normalizeUrl } from './meta';
import l from '../shared/lists.module.scss';

type Draft = { name: string; tier: ExhibitorTier; tagline: string; website: string; contactName: string; email: string; phone: string; boothId: string; status: ExhibitorStatus };
const NO_BOOTH = '__none__';
const TAGLINE_MAX = 60;

/** Add exhibitor: name and contact email are required; booth and status are optional. */
export function AddExhibitor({ open, initialBooth, onClose, onCreated }: { open: boolean; initialBooth: string | null; onClose: () => void; onCreated: (id: string, boothId: string | null) => void }) {
  const ev = useStore(selectActive);
  const add = useStore((st) => st.addExhibitor);
  const flow = useSaveFlow();
  const f = useDraft<Draft>(open, () => ({ name: '', tier: 'gold', tagline: '', website: '', contactName: '', email: '', phone: '', boothId: initialBooth ?? NO_BOOTH, status: 'pending' }));
  const d = f.draft;
  const taken = new Set(ev.exhibitors.map((x) => x.boothId).filter(Boolean));
  const free = boothOrder(ev.booths.filter((b) => !taken.has(b.id)));

  const errors: Record<string, string | undefined> = {};
  if (!d.name.trim()) errors.name = 'Enter a company name';
  else if (ev.exhibitors.some((x) => x.name.toLowerCase() === d.name.trim().toLowerCase())) errors.name = 'An exhibitor with this name already exists';
  if (d.tagline.length > TAGLINE_MAX) errors.tagline = `Keep it to ${TAGLINE_MAX} characters`;
  const url = normalizeUrl(d.website);
  if (url && !URL_RE.test(url)) errors.website = 'Enter a web address, like https://example.com';
  if (!d.email.trim()) errors.email = 'Enter the contact email';
  else if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Enter a valid email address, like jane@example.com';
  if (d.phone.trim() && !PHONE_RE.test(d.phone.trim())) errors.phone = 'Use digits, spaces, dashes or a leading +';
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);

  const submit = () => {
    f.setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const boothId = d.boothId === NO_BOOTH ? null : d.boothId;
    flow.run(() => {
      const id = add({
        name: d.name.trim(),
        tier: d.tier,
        status: d.status,
        tagline: d.tagline.trim(),
        website: url,
        boothId,
        contact: { name: d.contactName.trim(), email: d.email.trim(), phone: d.phone.trim() || null },
        notes: '',
      });
      const booth = ev.booths.find((b) => b.id === boothId);
      toast.success(booth ? `Added ${d.name.trim()} in booth ${booth.label}` : `Added ${d.name.trim()}`);
      onCreated(id, boothId);
    }, onClose);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New exhibitor"
      dirty={f.dirty && flow.state === 'idle'}
      footer={<SheetFooter onCancel={() => void cancel()} onSave={submit} saving={flow.loading} success={flow.success} label="Add exhibitor" />}
    >
      <form
        className={l.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Input label="Company name" required value={d.name} onChange={(e) => f.set('name', e.target.value)} onBlur={() => f.touch('name')} error={f.show(errors, 'name')} placeholder="Horizon Badges" autoFocus />
        <div className={l.fieldGroup}>
          <span className={l.fieldLabel}>Tier</span>
          <SegmentedControl label="Tier" value={d.tier} onChange={(v) => f.set('tier', v)} options={TIERS.map((t) => ({ value: t, label: TIER_META[t].label }))} />
        </div>
        <Input label="Tagline" value={d.tagline} onChange={(e) => f.set('tagline', e.target.value)} maxCount={TAGLINE_MAX} error={f.show(errors, 'tagline')} placeholder="What they bring to the floor" />
        <Input label="Website" type="url" inputMode="url" value={d.website} onChange={(e) => f.set('website', e.target.value)} onBlur={() => f.touch('website')} error={f.show(errors, 'website')} placeholder="https://example.com" />
        <Input label="Contact name" value={d.contactName} onChange={(e) => f.set('contactName', e.target.value)} placeholder="Jordan Lee" autoComplete="off" />
        <div className={l.row2}>
          <Input label="Contact email" type="email" required value={d.email} onChange={(e) => f.set('email', e.target.value)} onBlur={() => f.touch('email')} error={f.show(errors, 'email')} placeholder="jordan@company.example" autoComplete="off" />
          <Input label="Contact phone" type="tel" value={d.phone} onChange={(e) => f.set('phone', e.target.value)} onBlur={() => f.touch('phone')} error={f.show(errors, 'phone')} autoComplete="off" />
        </div>
        <div className={l.row2}>
          <Select
            label="Booth"
            value={d.boothId}
            onChange={(v) => f.set('boothId', v)}
            options={[{ value: NO_BOOTH, label: 'No booth yet' }, ...free.map((b) => ({ value: b.id, label: b.label }))]}
            help={free.length ? `${free.length} free` : 'Every booth is taken'}
          />
          <Select label="Status" value={d.status} onChange={(v) => f.set('status', v)} options={(Object.keys(STATUS_META) as ExhibitorStatus[]).map((k) => ({ value: k, label: STATUS_META[k].label }))} />
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
