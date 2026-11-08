import { useEffect, useMemo, useState } from 'react';
import { Sheet, useCloseGuard } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/form/Input';
import { DateField } from '../ui/form/DateField';
import { Select } from '../ui/form/Select';
import { EventLogo } from './EventLogo';
import { LogoEditor } from './LogoEditor';
import { useStore, selectActive, newEventRecord, type EventDetailsInput } from '@/store/store';
import { useShell } from '../shellStore';
import { useSaveFlow } from '../hooks/useSaveFlow';
import { TIMEZONES, utcOffsetLabel } from '../lib/timezones';
import { toast } from '../ui/toastStore';
import { todayIn, addDays } from '../lib/format';
import type { Currency, EventLogo as Logo } from '@/store/types';
import s from './editor.module.scss';

const CURRENCIES: Array<{ value: Currency; label: string }> = [
  { value: 'USD', label: 'USD · US dollar' },
  { value: 'EUR', label: 'EUR · Euro' },
  { value: 'GBP', label: 'GBP · British pound' },
  { value: 'CAD', label: 'CAD · Canadian dollar' },
  { value: 'AUD', label: 'AUD · Australian dollar' },
];
const DESCRIPTION_MAX = 280;

type Draft = Omit<EventDetailsInput, 'logo'> & { logo: Logo | null };

function validate(d: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.name.trim()) e.name = 'Event name is required';
  if (!d.startDate) e.startDate = 'Start date is required';
  if (d.endDate && d.startDate && d.endDate < d.startDate) e.endDate = 'End date must be on or after the start date';
  if (!d.location.trim()) e.location = 'Location is required';
  if (d.description.length > DESCRIPTION_MAX) e.description = `Keep the description to ${DESCRIPTION_MAX} characters`;
  return e;
}

/** Edit the active event, or create a new one (from the event switcher). */
export function EventEditor({ onCreated }: { onCreated?: (id: string) => void }) {
  const mode = useShell((st) => st.eventEditor);
  const setMode = useShell((st) => st.setEventEditor);
  const ev = useStore(selectActive);
  const events = useStore((st) => st.events);
  const update = useStore((st) => st.updateEventDetails);
  const setLogo = useStore((st) => st.setEventLogo);
  const create = useStore((st) => st.createEvent);
  const save = useSaveFlow();
  const [logoOpen, setLogoOpen] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const initial = useMemo((): Draft | null => {
    if (!mode) return null;
    if (mode === 'edit') return { name: ev.name, startDate: ev.startDate, endDate: ev.endDate, location: ev.location, timezone: ev.timezone, currency: ev.currency, description: ev.description, logo: ev.logo as Logo | null };
    const start = addDays(todayIn('America/Denver'), 60);
    return { name: '', startDate: start, endDate: null, location: '', timezone: ev.timezone, currency: 'USD' as Currency, description: '', logo: null };
    // The draft is taken once when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  const [draft, setDraft] = useState<Draft | null>(initial);
  useEffect(() => {
    setDraft(initial);
    setTouched({});
    setSubmitted(false);
  }, [initial]);

  const open = mode !== null;
  const d = draft ?? initial;
  const errors = d ? validate(d) : {};
  const show = (k: keyof Draft) => (touched[k] || submitted ? errors[k] : undefined);
  const dirty = Boolean(d && initial && JSON.stringify(d) !== JSON.stringify(initial));
  const valid = Object.keys(errors).length === 0;

  const monogramPreview = useMemo(() => {
    if (!d || mode !== 'create') return null;
    return newEventRecord({ ...d, logo: undefined, name: d.name || 'New event' }, Object.values(events)).logo;
  }, [d, mode, events]);
  const shownLogo: Logo | null = d?.logo ?? monogramPreview;
  const defaultLogo: Logo = mode === 'edit' && ev.id === 'evt-rainfocus-summit' ? { kind: 'bundled', key: 'rainfocus' } : (monogramPreview ?? (ev.logo.kind === 'monogram' ? ev.logo : { kind: 'monogram', letters: ev.name.slice(0, 2).toUpperCase(), swatch: 'grape' }));

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((cur) => (cur ? { ...cur, [k]: v } : cur));
  const blur = (k: keyof Draft) => setTouched((t) => ({ ...t, [k]: true }));
  const close = () => setMode(null);
  const cancel = useCloseGuard(dirty && save.state === 'idle', close);

  const submit = () => {
    setSubmitted(true);
    if (!d || !valid || !dirty) return;
    save.run(
      () => {
        if (mode === 'edit') {
          const { logo, ...rest } = d;
          update(rest);
          if (logo && JSON.stringify(logo) !== JSON.stringify(ev.logo)) setLogo(logo);
          toast.success('Saved changes');
        } else {
          const id = create({ ...d, logo: d.logo ?? undefined });
          toast.success(`Created ${d.name.trim()}`);
          onCreated?.(id);
        }
      },
      close,
    );
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={close}
        title={mode === 'create' ? 'Create event' : 'Edit event'}
        wide
        dirty={dirty && save.state === 'idle'}
        footer={
          <>
            <span className={s.footerHint}>{mode === 'edit' && !dirty ? 'No changes yet' : ''}</span>
            <span style={{ flex: 1 }} />
            <Button variant="secondary" onClick={() => void cancel()}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!dirty || (submitted && !valid)} loading={save.loading} success={save.success}>
              {mode === 'create' ? 'Create event' : 'Save changes'}
            </Button>
          </>
        }
      >
        {d && (
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            noValidate
          >
            <Input label="Event name" required value={d.name} onChange={(e) => set('name', e.target.value)} onBlur={() => blur('name')} error={show('name')} placeholder="RainFocus Summit" autoFocus={mode === 'create'} />
            <div className={s.logoRow}>
              <span className={s.logoLabel}>Logo</span>
              <div className={s.logoBox}>
                {shownLogo && <EventLogo logo={shownLogo} size={56} radius="lg" />}
                <Button variant="ghost" icon="camera" onClick={() => setLogoOpen(true)}>
                  Change
                </Button>
              </div>
            </div>
            <div className={s.row2}>
              <DateField label="Start date" required value={d.startDate} onChange={(v) => set('startDate', v ?? '')} onBlur={() => blur('startDate')} error={show('startDate')} timeZone={d.timezone} />
              <DateField label="End date" value={d.endDate} onChange={(v) => set('endDate', v)} onBlur={() => blur('endDate')} error={show('endDate')} min={d.startDate} help="Leave blank for a one-day event" timeZone={d.timezone} />
            </div>
            <Input label="Location" required value={d.location} onChange={(e) => set('location', e.target.value)} onBlur={() => blur('location')} error={show('location')} placeholder="City, State or venue" />
            <div className={s.row2}>
              <Select
                label="Timezone"
                value={d.timezone}
                onChange={(v) => set('timezone', v)}
                options={TIMEZONES.map((t) => ({ value: t.value, label: t.city, hint: utcOffsetLabel(t.value, new Date(`${d.startDate || '2026-12-15'}T12:00:00Z`)) }))}
              />
              <Select label="Currency" value={d.currency} onChange={(v) => set('currency', v as Currency)} options={CURRENCIES} help={mode === 'edit' ? 'Every price in the event reformats.' : undefined} />
            </div>
            <Textarea label="Description" value={d.description} onChange={(e) => set('description', e.target.value)} onBlur={() => blur('description')} error={show('description')} maxCount={DESCRIPTION_MAX} rows={4} placeholder="What attendees should know about the event" />
            <button type="submit" hidden />
          </form>
        )}
      </Sheet>
      {d && shownLogo && <LogoEditor open={logoOpen} onClose={() => setLogoOpen(false)} logo={shownLogo} defaultLogo={defaultLogo} onSave={(l) => set('logo', l)} />}
    </>
  );
}
