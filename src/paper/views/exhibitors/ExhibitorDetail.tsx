import { useEffect, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import { fullName } from '@/store/selectors';
import type { Exhibitor, ExhibitorStatus, ExhibitorTier } from '@/store/types';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { InlineEdit } from '../../ui/InlineEdit';
import { Avatar, SectionLabel, StatusDot } from '../../ui/display';
import { Input, Textarea } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { Combobox } from '../../ui/form/Combobox';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { toast } from '../../ui/toastStore';
import { copyText } from '../../lib/clipboard';
import { EMAIL_RE } from '../guide/SettingSheets';
import { PHONE_RE } from '../attendees/AttendeeDetail';
import { STATUS_META, TIERS, TIER_META, URL_RE, boothOrder, displayUrl, normalizeUrl, staffTypeIds } from './meta';
import { Monogram, TierChip } from './parts';
import a from '../attendees/attendees.module.scss';
import s from './exhibitors.module.scss';

const TAGLINE_MAX = 60;
const NO_BOOTH = '__none__';
type DetailsDraft = { tier: ExhibitorTier; status: ExhibitorStatus; tagline: string; website: string; boothId: string; notes: string };
type ContactDraft = { name: string; email: string; phone: string };

/** One exhibitor: details and contact with explicit Edit modes, linked staff, remove. */
export function ExhibitorDetail({ id, startEditing, onClose, onRemove }: { id: string | null; startEditing: boolean; onClose: () => void; onRemove: (x: Exhibitor) => void }) {
  const ev = useStore(selectActive);
  const update = useStore((st) => st.updateExhibitor);
  const linkStaff = useStore((st) => st.linkStaff);
  const unlinkStaff = useStore((st) => st.unlinkStaff);
  const live = id ? ev.exhibitors.find((x) => x.id === id) : null;
  const [last, setLast] = useState<Exhibitor | null>(live ?? null);
  useEffect(() => {
    if (live) setLast(live);
  }, [live]);
  const x = live ?? last;

  const [details, setDetails] = useState<DetailsDraft | null>(null);
  const [contact, setContact] = useState<ContactDraft | null>(null);
  const [submitted, setSubmitted] = useState({ details: false, contact: false });
  const detailsFlow = useSaveFlow();
  const contactFlow = useSaveFlow();

  const detailsBase = (e: Exhibitor): DetailsDraft => ({ tier: e.tier, status: e.status, tagline: e.tagline, website: e.website ?? '', boothId: e.boothId ?? NO_BOOTH, notes: e.notes });
  const contactBase = (e: Exhibitor): ContactDraft => ({ name: e.contact.name, email: e.contact.email, phone: e.contact.phone ?? '' });

  useEffect(() => {
    setContact(null);
    setSubmitted({ details: false, contact: false });
    const e = id ? useStore.getState().events[useStore.getState().activeEventId].exhibitors.find((v) => v.id === id) : null;
    setDetails(startEditing && e ? detailsBase(e) : null);
  }, [id, startEditing]);

  const detailsDirty = Boolean(details && x && JSON.stringify(details) !== JSON.stringify(detailsBase(x)));
  const contactDirty = Boolean(contact && x && JSON.stringify(contact) !== JSON.stringify(contactBase(x)));
  const cancelDetails = useCloseGuard(detailsDirty, () => setDetails(null));
  const cancelContact = useCloseGuard(contactDirty, () => setContact(null));

  if (!x) return null;
  const booth = ev.booths.find((b) => b.id === x.boothId);
  const st = STATUS_META[x.status];
  const staff = ev.attendees.filter((p) => p.exhibitorId === x.id);
  const staffTypes = staffTypeIds(ev.attendeeTypes);
  const candidates = ev.attendees.filter((p) => staffTypes.includes(p.attendeeTypeId) && !p.exhibitorId && p.status !== 'cancelled');
  const occupant = new Map(ev.exhibitors.filter((e) => e.boothId && e.id !== x.id).map((e) => [e.boothId as string, e.name]));

  const dErr: Partial<Record<keyof DetailsDraft, string>> = {};
  if (details) {
    if (details.tagline.length > TAGLINE_MAX) dErr.tagline = `Keep it to ${TAGLINE_MAX} characters`;
    const url = normalizeUrl(details.website);
    if (url && !URL_RE.test(url)) dErr.website = 'Enter a web address, like https://example.com';
  }
  const cErr: Partial<Record<keyof ContactDraft, string>> = {};
  if (contact) {
    if (!contact.email.trim()) cErr.email = 'Enter an email address';
    else if (!EMAIL_RE.test(contact.email.trim())) cErr.email = 'Enter a valid email address, like jane@example.com';
    if (contact.phone.trim() && !PHONE_RE.test(contact.phone.trim())) cErr.phone = 'Use digits, spaces, dashes or a leading +';
  }

  const saveDetails = () => {
    setSubmitted((v) => ({ ...v, details: true }));
    if (!details || Object.keys(dErr).length) return;
    detailsFlow.run(() => {
      update(x.id, { tier: details.tier, status: details.status, tagline: details.tagline.trim(), website: normalizeUrl(details.website), boothId: details.boothId === NO_BOOTH ? null : details.boothId, notes: details.notes.trim() });
      toast.success('Saved changes');
    }, () => setDetails(null));
  };
  const saveContact = () => {
    setSubmitted((v) => ({ ...v, contact: true }));
    if (!contact || Object.keys(cErr).length) return;
    contactFlow.run(() => {
      update(x.id, { contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() || null } });
      toast.success('Saved contact');
    }, () => setContact(null));
  };
  const copyEmail = async () => {
    if (await copyText(x.contact.email)) toast.success(`Copied ${x.contact.email}`);
    else toast.danger('Could not copy. Select the address instead.');
  };

  return (
    <Sheet
      open={Boolean(live)}
      onClose={onClose}
      titleText={x.name}
      dirty={detailsDirty || contactDirty}
      title={
        <span className={s.detailHead}>
          <Monogram name={x.name} tier={x.tier} size={48} />
          <span className={s.detailName}>
            <InlineEdit
              value={x.name}
              label="Exhibitor name"
              requiredMessage="Name is required"
              maxLength={60}
              onCommit={(v) => {
                if (ev.exhibitors.some((e) => e.id !== x.id && e.name.toLowerCase() === v.trim().toLowerCase())) {
                  toast.danger(`Another exhibitor is already called ${v.trim()}`);
                  return;
                }
                update(x.id, { name: v.trim() });
                toast.success('Saved changes');
              }}
            />
            <TierChip tier={x.tier} />
          </span>
        </span>
      }
      footer={
        <>
          <Button variant="danger-ghost" icon="trash" onClick={() => onRemove(x)}>
            Remove exhibitor
          </Button>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <section className={a.section} aria-labelledby="ex-details">
        <SectionLabel
          id="ex-details"
          action={
            !details && (
              <Button size="sm" variant="ghost" icon="pencil" onClick={() => (setDetails(detailsBase(x)), setSubmitted((v) => ({ ...v, details: false })))} aria-label="Edit details">
                Edit
              </Button>
            )
          }
        >
          Details
        </SectionLabel>
        {details ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDetails();
            }}
            noValidate
            aria-label="Edit details"
          >
            <div className={a.editGrid}>
              <Select label="Tier" value={details.tier} onChange={(v) => setDetails({ ...details, tier: v })} options={TIERS.map((t) => ({ value: t, label: TIER_META[t].label }))} />
              <Select label="Status" value={details.status} onChange={(v) => setDetails({ ...details, status: v })} options={(Object.keys(STATUS_META) as ExhibitorStatus[]).map((k) => ({ value: k, label: STATUS_META[k].label }))} />
              <Input fieldClassName={a.full} label="Tagline" value={details.tagline} onChange={(e) => setDetails({ ...details, tagline: e.target.value })} maxCount={TAGLINE_MAX} error={submitted.details ? dErr.tagline : undefined} autoFocus />
              <Input fieldClassName={a.full} label="Website" type="url" inputMode="url" value={details.website} onChange={(e) => setDetails({ ...details, website: e.target.value })} placeholder="https://example.com" error={submitted.details ? dErr.website : undefined} />
              <Select
                fieldClassName={a.full}
                label="Booth"
                value={details.boothId}
                onChange={(v) => setDetails({ ...details, boothId: v })}
                options={[{ value: NO_BOOTH, label: 'Unassigned' }, ...boothOrder(ev.booths).map((b) => ({ value: b.id, label: b.label, hint: occupant.get(b.id), disabled: occupant.has(b.id) }))]}
                help="Occupied booths show who has them"
              />
              <Textarea fieldClassName={a.full} label="Notes" value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} rows={3} />
            </div>
            <div className={a.editActions}>
              <Button variant="secondary" onClick={() => void cancelDetails()}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={detailsFlow.loading} success={detailsFlow.success}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <dl className={a.dl}>
            <dt>Tier</dt>
            <dd>{TIER_META[x.tier].label}</dd>
            <dt>Status</dt>
            <dd>
              <StatusDot tone={st.tone}>{st.label}</StatusDot>
            </dd>
            <dt>Tagline</dt>
            <dd>{x.tagline || <span className={a.none}>No tagline</span>}</dd>
            <dt>Website</dt>
            <dd>
              {x.website ? (
                <a className={s.link} href={x.website} target="_blank" rel="noreferrer noopener">
                  {displayUrl(x.website)}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <span className={a.none}>Not provided</span>
              )}
            </dd>
            <dt>Booth</dt>
            <dd>{booth ? <span className={s.booth}>{booth.label}</span> : <span className={a.none}>Unassigned</span>}</dd>
            <dt>Notes</dt>
            <dd>{x.notes || <span className={a.none}>No notes</span>}</dd>
          </dl>
        )}
      </section>

      <section className={a.section} aria-labelledby="ex-contact">
        <SectionLabel
          id="ex-contact"
          action={
            !contact && (
              <span className={s.sectionActions}>
                <Button size="sm" variant="ghost" icon="copy" onClick={() => void copyEmail()}>
                  Copy email
                </Button>
                <Button size="sm" variant="ghost" icon="pencil" onClick={() => (setContact(contactBase(x)), setSubmitted((v) => ({ ...v, contact: false })))} aria-label="Edit contact">
                  Edit
                </Button>
              </span>
            )
          }
        >
          Contact
        </SectionLabel>
        {contact ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveContact();
            }}
            noValidate
            aria-label="Edit contact"
          >
            <div className={a.editGrid}>
              <Input fieldClassName={a.full} label="Name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoFocus />
              <Input label="Email" type="email" required value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={submitted.contact ? cErr.email : undefined} />
              <Input label="Phone" type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} error={submitted.contact ? cErr.phone : undefined} />
            </div>
            <div className={a.editActions}>
              <Button variant="secondary" onClick={() => void cancelContact()}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={contactFlow.loading} success={contactFlow.success}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <dl className={a.dl}>
            <dt>Name</dt>
            <dd>{x.contact.name || <span className={a.none}>Not provided</span>}</dd>
            <dt>Email</dt>
            <dd>
              <a className={s.link} href={`mailto:${x.contact.email}`}>
                {x.contact.email}
              </a>
            </dd>
            <dt>Phone</dt>
            <dd>{x.contact.phone ?? <span className={a.none}>Not provided</span>}</dd>
          </dl>
        )}
      </section>

      <section className={a.section} aria-labelledby="ex-staff">
        <SectionLabel id="ex-staff">Staff</SectionLabel>
        {staff.length ? (
          <ul className={s.staff} aria-label={`${x.name} staff`}>
            {staff.map((p) => {
              const name = fullName(p);
              return (
                <li key={p.id} className={s.staffRow}>
                  <Avatar name={name} size={32} />
                  <span className={s.staffText}>
                    {name}
                    <small>{p.email}</small>
                  </span>
                  <IconButton
                    icon="x"
                    label={`Unlink ${name}`}
                    size={30}
                    onClick={() => {
                      const token = unlinkStaff(p.id);
                      toast.undo(`Unlinked ${name} from ${x.name}`, token, `Undo unlinking ${name}`);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={s.empty}>No staff linked yet. Staff are attendees of the Exhibitor staff type.</p>
        )}
        <Combobox
          label="Add staff"
          value={null}
          clearOnSelect
          onChange={(pid) => {
            const p = ev.attendees.find((v) => v.id === pid);
            if (!p) return;
            linkStaff(p.id, x.id);
            toast.success(`Linked ${fullName(p)} to ${x.name}`);
          }}
          options={candidates.map((p) => ({ value: p.id, label: fullName(p), description: p.company ?? p.email }))}
          placeholder={staffTypes.length ? 'Search exhibitor staff' : 'Add an Exhibitor staff type first'}
          emptyText={staffTypes.length ? 'Every exhibitor staff attendee is linked' : 'No attendee type for exhibitor staff yet'}
          help="Unlinking keeps the attendee registered."
        />
      </section>
    </Sheet>
  );
}
