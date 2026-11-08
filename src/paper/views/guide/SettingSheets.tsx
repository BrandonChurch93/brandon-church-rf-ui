import { useEffect, useMemo, useRef } from 'react';
import { useDraft } from '../../hooks/useDraft';
import { useStore, selectActive } from '@/store/store';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { NumberField } from '../../ui/form/NumberField';
import { DateField } from '../../ui/form/DateField';
import { Switch } from '../../ui/form/Switch';
import { IconButton } from '../../ui/IconButton';
import { DisabledReason } from '../../ui/DisabledReason';
import { SortableList } from '../../ui/Sortable';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { toast } from '../../ui/toastStore';
import { uid } from '@/store/ids';
import { addDays } from '../../lib/format';
import type { AttributeField, AttributeType, CommunicationsSettings, GeneralSettings } from '@/store/types';
import s from './guide.module.scss';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SheetProps {
  open: boolean;
  onClose: () => void;
}

export function SheetFooter({ onCancel, onSave, saving, success, label = 'Save' }: { onCancel: () => void; onSave: () => void; saving: boolean; success: boolean; label?: string }) {
  return (
    <>
      <span style={{ flex: 1 }} />
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSave} loading={saving} success={success}>
        {label}
      </Button>
    </>
  );
}

// ---------- General ----------
type GeneralDraft = { eventType: string | null; capacity: number | null; registrationOpens: string | null; registrationCloses: string | null; supportEmail: string };
const EVENT_TYPES = ['Conference', 'Summit', 'Workshop', 'Meetup', 'Webinar'];

export function GeneralSheet({ open, onClose }: SheetProps) {
  const ev = useStore(selectActive);
  const save = useStore((st) => st.saveGeneral);
  const flow = useSaveFlow();
  const f = useDraft<GeneralDraft>(open, () => ev.guide.settings.general ?? { eventType: null, capacity: null, registrationOpens: null, registrationCloses: null, supportEmail: '' });
  const d = f.draft;
  const errors: Partial<Record<keyof GeneralDraft, string>> = {};
  if (!d.eventType) errors.eventType = 'Choose an event type';
  if (d.capacity === null) errors.capacity = 'Enter a capacity';
  else if (d.capacity < 1 || d.capacity > 100000) errors.capacity = 'Use a number from 1 to 100,000';
  if (!d.registrationOpens) errors.registrationOpens = 'Choose when registration opens';
  if (!d.registrationCloses) errors.registrationCloses = 'Choose when registration closes';
  else if (d.registrationOpens && d.registrationCloses < d.registrationOpens) errors.registrationCloses = 'Must be on or after the opening date';
  else if (d.registrationCloses > ev.startDate) errors.registrationCloses = 'Must be on or before the event starts';
  if (!d.supportEmail.trim()) errors.supportEmail = 'Enter a support email';
  else if (!EMAIL_RE.test(d.supportEmail.trim())) errors.supportEmail = 'Enter a valid email address, like help@example.com';
  const show = (k: keyof GeneralDraft) => (f.touched[k] || f.submitted ? errors[k] : undefined);
  const set = <K extends keyof GeneralDraft>(k: K, v: GeneralDraft[K]) => f.setDraft((x) => ({ ...x, [k]: v }));
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);

  const submit = () => {
    f.setSubmitted(true);
    if (Object.keys(errors).length) return;
    flow.run(() => {
      save({ ...(d as GeneralSettings), supportEmail: d.supportEmail.trim() });
      toast.success('Saved general settings');
    }, onClose);
  };
  return (
    <Sheet open={open} onClose={onClose} title="General" subtitle="Event basics, capacity and registration window." dirty={f.dirty && flow.state === 'idle'} footer={<SheetFooter onCancel={() => void cancel()} onSave={submit} saving={flow.loading} success={flow.success} />}>
      <form className={s.form} onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        <div className={s.row2}>
          <Select label="Event type" required value={d.eventType} onChange={(v) => set('eventType', v)} onBlur={() => f.touch('eventType')} error={show('eventType')} options={EVENT_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Choose a type" />
          <NumberField label="Capacity" required value={d.capacity} onChange={(v) => set('capacity', v)} onBlur={() => f.touch('capacity')} error={show('capacity')} min={1} max={100000} step={10} placeholder="600" />
        </div>
        <div className={s.row2}>
          <DateField label="Registration opens" required value={d.registrationOpens} onChange={(v) => set('registrationOpens', v)} onBlur={() => f.touch('registrationOpens')} error={show('registrationOpens')} timeZone={ev.timezone} max={ev.startDate} />
          <DateField label="Registration closes" required value={d.registrationCloses} onChange={(v) => set('registrationCloses', v)} onBlur={() => f.touch('registrationCloses')} error={show('registrationCloses')} timeZone={ev.timezone} min={d.registrationOpens} max={ev.startDate} />
        </div>
        <Input label="Attendee support email" required type="email" value={d.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} onBlur={() => f.touch('supportEmail')} error={show('supportEmail')} placeholder="summit@example.com" help="Shown in confirmation emails and on the attendee portal" />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

// ---------- Attendee attributes ----------
const ATTR_TYPES: Array<{ value: AttributeType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
];
const DEFAULT_FIELDS = (): AttributeField[] => [
  { id: uid(), label: 'Full name', type: 'text', required: true },
  { id: uid(), label: 'Email', type: 'email', required: true },
  { id: uid(), label: 'Company', type: 'text', required: false },
  { id: uid(), label: 'Job title', type: 'text', required: false },
  { id: uid(), label: 'Dietary needs', type: 'select', required: false },
  { id: uid(), label: 'Accessibility needs', type: 'text', required: false },
];
const LOCKED = ['full name', 'email'];
const isLocked = (a: AttributeField, list: AttributeField[]) => {
  const key = a.label.trim().toLowerCase();
  return LOCKED.includes(key) && list.find((x) => x.label.trim().toLowerCase() === key)?.id === a.id;
};
const LOCK_REASON = 'Required by the registration form';

export function AttributesSheet({ open, onClose }: SheetProps) {
  const ev = useStore(selectActive);
  const save = useStore((st) => st.saveAttributes);
  const flow = useSaveFlow();
  const f = useDraft<AttributeField[]>(open, () => structuredClone(ev.guide.settings.attributes?.fields ?? DEFAULT_FIELDS()));
  const list = f.draft;
  const focusId = useRef<string | null>(null);
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);

  const labelError = (a: AttributeField) => {
    const t = a.label.trim();
    if (!t) return 'Add a label';
    if (list.filter((x) => x.label.trim().toLowerCase() === t.toLowerCase()).length > 1) return 'Labels must be unique';
    return null;
  };
  const anyError = list.some((a) => labelError(a));
  const update = (id: string, patch: Partial<AttributeField>) => f.setDraft((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (a: AttributeField) => {
    const index = list.findIndex((x) => x.id === a.id);
    f.setDraft((l) => l.filter((x) => x.id !== a.id));
    toast.undo(`Removed ${a.label || 'attribute'}`, {
      undo: () =>
        f.setDraft((l) => {
          const next = [...l];
          next.splice(Math.min(index, next.length), 0, a);
          return next;
        }),
    });
  };
  const add = () => {
    const id = uid();
    focusId.current = id;
    f.setDraft((l) => [...l, { id, label: '', type: 'text', required: false }]);
  };
  useEffect(() => {
    if (focusId.current) {
      document.getElementById(`attr-${focusId.current}`)?.focus();
      focusId.current = null;
    }
  }, [list.length]);

  const submit = () => {
    f.setSubmitted(true);
    if (anyError) return;
    const fields = list.map((a) => (isLocked(a, list) ? { ...a, required: true } : { ...a, label: a.label.trim() }));
    flow.run(() => {
      save(fields);
      toast.success('Saved attendee attributes');
    }, onClose);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Attendee attributes" subtitle="The fields attendees fill in when they register." wide dirty={f.dirty && flow.state === 'idle'} footer={<SheetFooter onCancel={() => void cancel()} onSave={submit} saving={flow.loading} success={flow.success} />}>
      <div className={s.form}>
        <div className={s.attrList}>
          <SortableList
            items={list}
            getId={(a) => a.id}
            getName={(a) => a.label || 'New attribute'}
            onReorder={(ids) => f.setDraft((l) => ids.map((id) => l.find((a) => a.id === id)!))}
            render={(a, p) => {
              const locked = isLocked(a, list);
              const err = f.submitted ? labelError(a) : null;
              return (
                <div ref={p.setNodeRef} style={p.style} className={s.attrRow} data-dragging={p.isDragging || undefined}>
                  {p.handle}
                  <Input id={`attr-${a.id}`} label="Label" value={a.label} onChange={(e) => update(a.id, { label: e.target.value })} readOnly={locked} error={err} placeholder="Badge name" size="sm" maxLength={40} />
                  <Select label="Type" value={a.type} onChange={(v) => update(a.id, { type: v })} options={ATTR_TYPES} disabled={locked} size="sm" />
                  <div className={s.requiredToggle}>
                    <span id={`req-${a.id}`}>Required</span>
                    {locked ? (
                      <DisabledReason reason={LOCK_REASON} label={`${a.label} is always required`}>
                        <Switch checked disabled onChange={() => undefined} ariaLabel={`${a.label} required`} />
                      </DisabledReason>
                    ) : (
                      <Switch checked={a.required} onChange={(v) => update(a.id, { required: v })} ariaLabel={`${a.label || 'New attribute'} required`} />
                    )}
                  </div>
                  {locked ? (
                    <DisabledReason reason={LOCK_REASON} label={`Remove ${a.label}, unavailable`}>
                      <IconButton icon="trash" label={`Remove ${a.label}`} size={30} disabled tooltip={false} tabIndex={-1} />
                    </DisabledReason>
                  ) : (
                    <IconButton icon="trash" label={`Remove ${a.label || 'new attribute'}`} size={30} onClick={() => remove(a)} />
                  )}
                </div>
              );
            }}
          />
        </div>
        <div>
          <Button variant="secondary" icon="plus" onClick={add} disabled={list.length >= 20}>
            Add attribute
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

// ---------- Communications ----------
export function CommunicationsSheet({ open, onClose }: SheetProps) {
  const ev = useStore(selectActive);
  const save = useStore((st) => st.saveCommunications);
  const flow = useSaveFlow();
  const f = useDraft<CommunicationsSettings>(
    open,
    () =>
      ev.guide.settings.communications ?? {
        senderName: ev.name,
        replyTo: ev.guide.settings.general?.supportEmail ?? '',
        subject: "You're registered for {event}",
        body: 'Hi {first_name},\n\nThanks for registering for {event}. Your confirmation and agenda will be waiting in the attendee portal.\n\nSee you there.',
        reminder: true,
      },
  );
  const d = f.draft;
  const errors: Partial<Record<keyof CommunicationsSettings, string>> = {};
  if (!d.senderName.trim()) errors.senderName = 'Enter a sender name';
  if (!d.replyTo.trim()) errors.replyTo = 'Enter a reply-to address';
  else if (!EMAIL_RE.test(d.replyTo.trim())) errors.replyTo = 'Enter a valid email address, like help@example.com';
  if (!d.subject.trim()) errors.subject = 'Enter a subject';
  const show = (k: keyof CommunicationsSettings) => (f.touched[k] || f.submitted ? errors[k] : undefined);
  const set = <K extends keyof CommunicationsSettings>(k: K, v: CommunicationsSettings[K]) => f.setDraft((x) => ({ ...x, [k]: v }));
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);
  const reminderDate = useMemo(() => addDays(ev.startDate, -1), [ev.startDate]);

  const submit = () => {
    f.setSubmitted(true);
    if (Object.keys(errors).length) return;
    flow.run(() => {
      save({ ...d, senderName: d.senderName.trim(), replyTo: d.replyTo.trim(), subject: d.subject.trim() });
      toast.success('Saved communications');
    }, onClose);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Communications" subtitle="Confirmation email and reminders." dirty={f.dirty && flow.state === 'idle'} footer={<SheetFooter onCancel={() => void cancel()} onSave={submit} saving={flow.loading} success={flow.success} />}>
      <form className={s.form} onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        <div className={s.row2}>
          <Input label="Sender name" required value={d.senderName} onChange={(e) => set('senderName', e.target.value)} onBlur={() => f.touch('senderName')} error={show('senderName')} />
          <Input label="Reply-to" required type="email" value={d.replyTo} onChange={(e) => set('replyTo', e.target.value)} onBlur={() => f.touch('replyTo')} error={show('replyTo')} placeholder="help@example.com" />
        </div>
        <Input label="Confirmation subject" required value={d.subject} onChange={(e) => set('subject', e.target.value)} onBlur={() => f.touch('subject')} error={show('subject')} maxCount={120} />
        <Textarea
          label="Confirmation body"
          value={d.body}
          onChange={(e) => set('body', e.target.value)}
          rows={7}
          help={
            <span className={s.note}>
              <code>{'{first_name}'}</code> and <code>{'{event}'}</code> are replaced for each attendee.
            </span>
          }
        />
        <Switch checked={d.reminder} onChange={(v) => set('reminder', v)} label="Send a reminder 1 day before" describedBy="reminder-help" />
        <p id="reminder-help" className={s.note} style={{ marginTop: -12 }}>
          {d.reminder ? `Goes out on ${new Date(`${reminderDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}.` : 'No reminder will be sent.'}
        </p>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
