import { useEffect, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import { defaultType } from '@/store/selectors';
import type { AttendeeStatus } from '@/store/types';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { toast } from '../../ui/toastStore';
import { formatPrice } from '../../lib/format';
import { EMAIL_RE } from '../guide/SettingSheets';
import { PHONE_RE } from './AttendeeDetail';
import { STATUSES } from './query';
import s from './attendees.module.scss';

const NO_PACKAGE = '__none__';
interface Draft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  attendeeTypeId: string;
  packageId: string;
  status: AttendeeStatus;
  notes: string;
}

/** Add attendee: validates email (and that it is unique), inserts the row and flashes it. */
export function AddAttendee({ open, onClose, onAdded, onView }: { open: boolean; onClose: () => void; onAdded: (id: string) => void; onView: (id: string) => void }) {
  const ev = useStore(selectActive);
  const add = useStore((st) => st.addAttendee);
  const flow = useSaveFlow();
  const blank = (): Draft => ({ firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', attendeeTypeId: defaultType(ev).id, packageId: NO_PACKAGE, status: 'registered', notes: '' });
  const [d, setD] = useState<Draft>(blank);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (open) {
      setD(blank());
      setTouched({});
      setSubmitted(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const duplicate = ev.attendees.find((a) => a.email.toLowerCase() === d.email.trim().toLowerCase());
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!d.firstName.trim()) errors.firstName = 'Enter a first name';
  if (!d.lastName.trim()) errors.lastName = 'Enter a last name';
  if (!d.email.trim()) errors.email = 'Enter an email address';
  else if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Enter a valid email address, like jane@example.com';
  else if (duplicate) errors.email = 'An attendee with this email already exists';
  if (d.phone && !PHONE_RE.test(d.phone.trim())) errors.phone = 'Use digits, spaces, dashes or a leading +';
  const show = (k: keyof Draft) => (touched[k] || submitted ? errors[k] : undefined);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(d) !== JSON.stringify(blank());
  // Leaving a field flags it only once the form has been edited (D-25).
  const touch = (k: keyof Draft) => {
    if (dirty) setTouched((t) => ({ ...t, [k]: true }));
  };
  const cancel = useCloseGuard(dirty && flow.state === 'idle', onClose);

  const submit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    flow.run(
      () => {
        const id = add({
          firstName: d.firstName.trim(),
          lastName: d.lastName.trim(),
          email: d.email.trim(),
          phone: d.phone.trim() || null,
          company: d.company.trim() || null,
          jobTitle: d.jobTitle.trim() || null,
          attendeeTypeId: d.attendeeTypeId,
          packageId: d.packageId === NO_PACKAGE ? null : d.packageId,
          status: d.status,
          notes: d.notes.trim(),
        });
        toast.success(`Added ${d.firstName.trim()} ${d.lastName.trim()}`);
        window.setTimeout(() => onAdded(id), 340);
      },
      onClose,
    );
  };

  const emailError = show('email');
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add attendee"
      dirty={dirty && flow.state === 'idle'}
      footer={
        <>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={() => void cancel()}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={flow.loading} success={flow.success}>
            Add attendee
          </Button>
        </>
      }
    >
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <div className={s.row2}>
          <Input label="First name" required value={d.firstName} onChange={(e) => set('firstName', e.target.value)} onBlur={() => touch('firstName')} error={show('firstName')} autoComplete="off" />
          <Input label="Last name" required value={d.lastName} onChange={(e) => set('lastName', e.target.value)} onBlur={() => touch('lastName')} error={show('lastName')} autoComplete="off" />
        </div>
        <Input
          label="Email"
          type="email"
          required
          value={d.email}
          onChange={(e) => set('email', e.target.value)}
          onBlur={() => touch('email')}
          error={emailError}
          placeholder="jane@example.com"
          autoComplete="off"
          help={
            emailError === 'An attendee with this email already exists' && duplicate ? undefined : 'Used for the confirmation email'
          }
        />
        {emailError === 'An attendee with this email already exists' && duplicate && (
          <p className={s.duplicate} style={{ marginTop: -14, fontSize: 12 }}>
            <button type="button" onClick={() => onView(duplicate.id)}>
              View {duplicate.firstName} {duplicate.lastName}
            </button>
          </p>
        )}
        <div className={s.row2}>
          <Input label="Phone" type="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => touch('phone')} error={show('phone')} placeholder="(801) 555-0134" />
          <Input label="Company" value={d.company} onChange={(e) => set('company', e.target.value)} />
        </div>
        <Input label="Job title" value={d.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
        <div className={s.row2}>
          <Select label="Attendee type" value={d.attendeeTypeId} onChange={(v) => set('attendeeTypeId', v)} options={ev.attendeeTypes.map((t) => ({ value: t.id, label: t.name }))} />
          <Select label="Status" value={d.status} onChange={(v) => set('status', v)} options={STATUSES.map((x) => ({ value: x.value, label: x.label }))} />
        </div>
        <Select
          label="Package"
          value={d.packageId}
          onChange={(v) => set('packageId', v)}
          options={[{ value: NO_PACKAGE, label: 'None' }, ...ev.packages.filter((p) => p.status !== 'archived').map((p) => ({ value: p.id, label: p.name, hint: formatPrice(p.priceMinor, ev.currency) }))]}
        />
        <Textarea label="Notes" value={d.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
