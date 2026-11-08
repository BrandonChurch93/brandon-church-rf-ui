import { useEffect, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import { fullName } from '@/store/selectors';
import type { Attendee } from '@/store/types';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { InlineEdit } from '../../ui/InlineEdit';
import { Avatar, Chip, SectionLabel, StatusDot } from '../../ui/display';
import { Input, Textarea } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { Combobox } from '../../ui/form/Combobox';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { toast } from '../../ui/toastStore';
import { formatDateTimeAsDate, formatPrice, relativeTime } from '../../lib/format';
import { EMAIL_RE } from '../guide/SettingSheets';
import { statusMeta } from './query';
import s from './attendees.module.scss';

type Draft = Pick<Attendee, 'email' | 'phone' | 'company' | 'jobTitle' | 'attendeeTypeId' | 'packageId' | 'regCodeId' | 'notes'>;
const NO_PACKAGE = '__none__';
const NO_CODE = '__nocode__';
export const PHONE_RE = /^[+()\d\s.-]{7,20}$/;

/** The attendee detail sheet: details with an explicit Edit mode, and the activity timeline. */
export function AttendeeDetail({ id, onClose, onRemove }: { id: string | null; onClose: () => void; onRemove: (id: string) => void }) {
  const ev = useStore(selectActive);
  const update = useStore((st) => st.updateAttendee);
  const log = useStore((st) => st.logActivity);
  const live = id ? ev.attendees.find((a) => a.id === id) : null;
  const [last, setLast] = useState<Attendee | null>(live ?? null);
  useEffect(() => {
    if (live) setLast(live);
  }, [live]);
  const a = live ?? last;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const flow = useSaveFlow();

  useEffect(() => {
    setEditing(false);
    setSubmitted(false);
  }, [id]);

  const startEdit = () => {
    if (!a) return;
    setDraft({ email: a.email, phone: a.phone, company: a.company, jobTitle: a.jobTitle, attendeeTypeId: a.attendeeTypeId, packageId: a.packageId, regCodeId: a.regCodeId, notes: a.notes });
    setSubmitted(false);
    setEditing(true);
  };
  const dirty = Boolean(editing && draft && a && JSON.stringify(draft) !== JSON.stringify({ email: a.email, phone: a.phone, company: a.company, jobTitle: a.jobTitle, attendeeTypeId: a.attendeeTypeId, packageId: a.packageId, regCodeId: a.regCodeId, notes: a.notes }));
  const guardedCancel = useCloseGuard(dirty, () => setEditing(false));

  if (!a) return null;
  const name = fullName(a);
  const type = ev.attendeeTypes.find((t) => t.id === a.attendeeTypeId);
  const pkg = ev.packages.find((p) => p.id === a.packageId);
  const code = ev.regCodes.find((c) => c.id === a.regCodeId);
  const st = statusMeta(a.status);

  const d = draft;
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (d) {
    if (!d.email.trim()) errors.email = 'Enter an email address';
    else if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Enter a valid email address, like jane@example.com';
    else if (ev.attendees.some((x) => x.id !== a.id && x.email.toLowerCase() === d.email.trim().toLowerCase())) errors.email = 'Another attendee already uses this email';
    if (d.phone && !PHONE_RE.test(d.phone.trim())) errors.phone = 'Use digits, spaces, dashes or a leading +';
  }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((x) => (x ? { ...x, [k]: v } : x));
  const save = () => {
    setSubmitted(true);
    if (!d || Object.keys(errors).length) return;
    flow.run(
      () => {
        update(a.id, { ...d, email: d.email.trim(), phone: d.phone?.trim() || null, company: d.company?.trim() || null, jobTitle: d.jobTitle?.trim() || null });
        toast.success('Saved changes');
      },
      () => setEditing(false),
    );
  };

  return (
    <Sheet
      open={Boolean(live)}
      onClose={onClose}
      titleText={name}
      dirty={dirty}
      title={
        <span className={s.detailHeader}>
          <Avatar name={name} size={40} />
          <span className={s.detailName}>
            <InlineEdit
              value={name}
              label="Attendee name"
              requiredMessage="Name is required"
              maxLength={80}
              onCommit={(v) => {
                const [first, ...rest] = v.split(/\s+/);
                update(a.id, { firstName: first, lastName: rest.join(' ') });
                toast.success('Saved changes');
              }}
            />
            <span className={s.email}>{a.email}</span>
          </span>
        </span>
      }
      headerExtra={
        <Menu
          label={`More actions for ${name}`}
          width={230}
          items={[
            {
              id: 'resend',
              label: 'Resend confirmation',
              icon: 'send',
              disabled: a.status === 'cancelled',
              reason: 'Cancelled registrations do not get confirmations',
              onSelect: () => {
                log(a.id, 'Confirmation email resent');
                toast.success(`Confirmation sent to ${a.email}`);
              },
            },
            a.status === 'cancelled'
              ? { id: 'reinstate', label: 'Reinstate', icon: 'undo', onSelect: () => (update(a.id, { status: 'registered' }), toast.success(`Reinstated ${name}`)) }
              : {
                  id: 'cancel',
                  label: 'Cancel registration',
                  icon: 'ban',
                  danger: true,
                  onSelect: () => {
                    const prev = a.status;
                    update(a.id, { status: 'cancelled' });
                    toast.undo(`Cancelled ${name}'s registration`, { undo: () => update(a.id, { status: prev }) });
                  },
                },
          ]}
          trigger={(t) => <IconButton {...t} icon="ellipsis" label={`More actions for ${name}`} />}
        />
      }
      headerBelow={
        <div className={s.chips}>
          <Chip tone={st.tone === 'neutral' ? 'muted' : st.tone} dot>
            {st.label}
          </Chip>
          {type && <Chip swatch={type.swatch}>{type.name}</Chip>}
        </div>
      }
      footer={
        <>
          <Button variant="danger-ghost" icon="trash" onClick={() => onRemove(a.id)}>
            Remove attendee
          </Button>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <section className={s.section} aria-labelledby="att-details">
        <SectionLabel
          id="att-details"
          action={
            !editing && (
              <Button size="sm" variant="ghost" icon="pencil" onClick={startEdit}>
                Edit
              </Button>
            )
          }
        >
          Details
        </SectionLabel>
        {editing && d ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            noValidate
          >
            <div className={s.editGrid}>
              <Input fieldClassName={s.full} label="Email" type="email" required value={d.email} onChange={(e) => set('email', e.target.value)} error={submitted ? errors.email : undefined} autoFocus />
              <Input label="Phone" type="tel" value={d.phone ?? ''} onChange={(e) => set('phone', e.target.value || null)} error={submitted ? errors.phone : undefined} />
              <Input label="Company" value={d.company ?? ''} onChange={(e) => set('company', e.target.value || null)} />
              <Input label="Job title" value={d.jobTitle ?? ''} onChange={(e) => set('jobTitle', e.target.value || null)} />
              <Select label="Attendee type" value={d.attendeeTypeId} onChange={(v) => set('attendeeTypeId', v)} options={ev.attendeeTypes.map((t) => ({ value: t.id, label: t.name }))} />
              <Select
                fieldClassName={s.full}
                label="Package"
                value={d.packageId ?? NO_PACKAGE}
                onChange={(v) => set('packageId', v === NO_PACKAGE ? null : v)}
                options={[{ value: NO_PACKAGE, label: 'None' }, ...ev.packages.filter((p) => p.status !== 'archived' || p.id === d.packageId).map((p) => ({ value: p.id, label: p.name, hint: formatPrice(p.priceMinor, ev.currency) }))]}
              />
              <div className={s.full}>
                <Combobox
                  label="Reg code"
                  mono
                  value={d.regCodeId ?? NO_CODE}
                  onChange={(v) => set('regCodeId', v === NO_CODE || v === null ? null : v)}
                  options={[{ value: NO_CODE, label: 'No code' }, ...ev.regCodes.map((c) => ({ value: c.id, label: c.code, description: c.label }))]}
                  placeholder="Search codes"
                />
              </div>
              <Textarea fieldClassName={s.full} label="Notes" value={d.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
            </div>
            <div className={s.editActions}>
              <Button variant="secondary" onClick={() => void guardedCancel()}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={flow.loading} success={flow.success}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <dl className={s.dl}>
            <dt>Email</dt>
            <dd>{a.email}</dd>
            <dt>Phone</dt>
            <dd>{a.phone ?? <span className={s.none}>Not provided</span>}</dd>
            <dt>Company</dt>
            <dd>{a.company ?? <span className={s.none}>Not provided</span>}</dd>
            <dt>Job title</dt>
            <dd>{a.jobTitle ?? <span className={s.none}>Not provided</span>}</dd>
            <dt>Attendee type</dt>
            <dd>{type?.name}</dd>
            <dt>Package</dt>
            <dd>{pkg ? `${pkg.name} · ${formatPrice(pkg.priceMinor, ev.currency)}` : <span className={s.none}>None</span>}</dd>
            <dt>Reg code</dt>
            <dd>{code ? <span className={s.mono}>{code.code}</span> : <span className={s.none}>None</span>}</dd>
            <dt>Status</dt>
            <dd>
              <StatusDot tone={st.tone}>{st.label}</StatusDot>
            </dd>
            <dt>Registered on</dt>
            <dd>{formatDateTimeAsDate(a.registeredAt, ev.timezone)}</dd>
            <dt>Notes</dt>
            <dd>{a.notes || <span className={s.none}>No notes</span>}</dd>
          </dl>
        )}
      </section>
      <section className={s.section} aria-labelledby="att-activity">
        <SectionLabel id="att-activity">Activity</SectionLabel>
        <ol className={s.timeline}>
          {a.activity.map((x) => (
            <li key={x.id} className={s.event}>
              <span>{x.text}</span>
              <time dateTime={x.at}>{relativeTime(x.at)}</time>
            </li>
          ))}
        </ol>
      </section>
    </Sheet>
  );
}
