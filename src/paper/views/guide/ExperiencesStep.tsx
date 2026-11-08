import { useEffect, useMemo, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import { fullName } from '@/store/selectors';
import type { CalendarSettings, PortalAccent, PortalSettings } from '@/store/types';
import { Icon, type IconName } from '../../ui/Icon';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Switch } from '../../ui/form/Switch';
import { Select } from '../../ui/form/Select';
import { Calendar } from '../../ui/form/DateField';
import { Avatar } from '../../ui/display';
import { EventLogo } from '../../shell/EventLogo';
import { ConfiguredStatus } from './ConfiguredCheck';
import { toast } from '../../ui/toastStore';
import { formatDateLong, formatDateRange, formatTimeRange, formatWeekdayShort, todayIn } from '../../lib/format';
import c from '../../ui/cards.module.scss';
import s from './guide.module.scss';

type Exp = 'portal' | 'calendar';
const ITEMS: Array<{ key: Exp; title: string; desc: string; icon: IconName }> = [
  { key: 'portal', title: 'Attendee Portal', desc: "Manage the portal that attendees will see after they've registered for your event.", icon: 'monitor' },
  { key: 'calendar', title: 'Attendee Calendar', desc: 'Manage what the attendee can see on their personal event calendar.', icon: 'calendar-range' },
];

/** Step 3: post-registration experiences, each with a live preview built from the event's data. */
export function ExperiencesStep() {
  const ev = useStore(selectActive);
  const [open, setOpen] = useState<Exp | null>(null);
  useEffect(() => setOpen(null), [ev.id]);
  return (
    <div className={s.step}>
      <div className={s.stepLabel}>
        <h3 className={s.stepName}>
          <strong>Step 3</strong>
          <span>Design post-registration experiences</span>
        </h3>
      </div>
      <div className={c.gridWrap}>
        <div className={c.grid}>
          {ITEMS.map((it) => {
            const done = Boolean(ev.guide.experiences[it.key]);
            return (
              <div key={it.key} className={`${c.card} ${c.clickable} ${s.experienceCard}`}>
                <div className={s.cardTop}>
                  <Icon name={it.icon} size={20} className={s.cardIcon} />
                  <button type="button" className={`${c.stretch} ${s.cardTitle}`} onClick={() => setOpen(it.key)} aria-label={`${it.title}, ${done ? 'configured' : 'not configured'}. Open the preview`}>
                    {it.title}
                  </button>
                  <ConfiguredStatus done={done} />
                </div>
                <p className={s.cardDesc}>{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
      <PortalPreview open={open === 'portal'} onClose={() => setOpen(null)} />
      <CalendarPreview open={open === 'calendar'} onClose={() => setOpen(null)} />
    </div>
  );
}

function Device({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={s.device} role="img" aria-label={label}>
      <div className={s.deviceBar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{label}</span>
      </div>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

const ACCENTS: Array<{ value: PortalAccent; label: string }> = [
  { value: 'grape', label: 'Grape' },
  { value: 'berry', label: 'Berry' },
  { value: 'teal', label: 'Teal' },
  { value: 'slate', label: 'Slate' },
];

function useSortedSessions() {
  const ev = useStore(selectActive);
  return useMemo(() => [...ev.sessions].sort((a, b) => a.date.localeCompare(b.date) || a.startMinutes - b.startMinutes), [ev.sessions]);
}

function PortalPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ev = useStore(selectActive);
  const save = useStore((st) => st.savePortal);
  const sessions = useSortedSessions();
  const [cfg, setCfg] = useState<PortalSettings>({ showAgenda: true, showNetworking: false, accent: 'grape' });
  useEffect(() => {
    if (open) setCfg(ev.guide.experiences.portal ?? { showAgenda: true, showNetworking: false, accent: 'grape' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const me = ev.attendees[ev.attendees.length - 1] ?? null;
  const myType = me ? ev.attendeeTypes.find((t) => t.id === me.attendeeTypeId)?.name : null;
  const myPackage = me ? (ev.packages.find((p) => p.id === me.packageId)?.name ?? 'No package') : null;
  const when = ev.endDate ? formatDateRange(ev.startDate, ev.endDate) : formatDateLong(ev.startDate);
  const style = { ['--portal-accent' as string]: `var(--sw-${cfg.accent})`, ['--portal-ink' as string]: `var(--sw-${cfg.accent}-ink)`, ['--portal-soft' as string]: `var(--sw-${cfg.accent}-soft)` };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendee Portal"
      width={840}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              save(cfg);
              toast.success('Saved the attendee portal');
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className={s.previewLayout}>
        <Device label="Preview of the attendee portal">
          <div className={s.portal} style={style}>
            <div className={s.portalHeader}>
              <EventLogo logo={ev.logo} size={40} radius="md" />
              <div>
                <div className={s.portalName}>{ev.name}</div>
                <div className={s.portalMeta}>
                  {when} · {ev.location}
                </div>
              </div>
            </div>
            <div className={s.portalCard}>
              <h4>Your registration</h4>
              {me ? (
                <div className={s.portalPerson}>
                  <Avatar name={fullName(me)} size={32} />
                  <span>
                    <strong>{fullName(me)}</strong>
                    {myType} · {myPackage}
                  </span>
                </div>
              ) : (
                <span className={s.portalMeta}>Registrations will appear here.</span>
              )}
              <span className={s.portalButton}>View my badge</span>
            </div>
            {cfg.showAgenda && (
              <div className={s.portalCard}>
                <h4>Your sessions</h4>
                <div className={s.portalSessions}>
                  {sessions.slice(0, 3).map((x) => (
                    <div key={x.id} className={s.portalSession}>
                      <span>{formatTimeRange(x.startMinutes, x.durationMinutes)}</span>
                      <div>
                        {x.title}
                        {x.speaker && <small> · {x.speaker.name}</small>}
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && <span className={s.portalMeta}>The agenda is published soon.</span>}
                </div>
              </div>
            )}
            {cfg.showNetworking && (
              <div className={s.portalCard}>
                <h4>Networking</h4>
                <div className={s.portalPerson}>
                  <span className={s.avatars}>
                    {ev.attendees.slice(0, 5).map((a) => (
                      <Avatar key={a.id} name={fullName(a)} size={28} />
                    ))}
                  </span>
                  <span>Meet {Math.max(0, ev.attendees.length - 1)} other attendees</span>
                </div>
                <span className={s.portalButton}>Find people</span>
              </div>
            )}
            <div className={s.portalFooter}>Powered by RainFocus</div>
          </div>
        </Device>
        <div className={s.settingsStrip}>
          <Switch checked={cfg.showAgenda} onChange={(v) => setCfg((x) => ({ ...x, showAgenda: v }))} label="Show agenda" />
          <Switch checked={cfg.showNetworking} onChange={(v) => setCfg((x) => ({ ...x, showNetworking: v }))} label="Show networking" />
          <Select label="Accent color" size="sm" value={cfg.accent} onChange={(v) => setCfg((x) => ({ ...x, accent: v }))} options={ACCENTS.map((a) => ({ ...a, leading: <i style={{ width: 10, height: 10, borderRadius: 5, background: `var(--sw-${a.value})` }} aria-hidden="true" /> }))} />
        </div>
      </div>
    </Modal>
  );
}

function CalendarPreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ev = useStore(selectActive);
  const save = useStore((st) => st.saveCalendar);
  const sessions = useSortedSessions();
  const [cfg, setCfg] = useState<CalendarSettings>({ allowAdd: true, showRooms: true, firstDay: 'sunday' });
  useEffect(() => {
    if (open) setCfg(ev.guide.experiences.calendar ?? { allowAdd: true, showRooms: true, firstDay: 'sunday' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const days: string[] = [];
  for (let d = ev.startDate; d <= (ev.endDate ?? ev.startDate); d = new Date(Date.parse(`${d}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10)) days.push(d);
  const first = sessions.filter((x) => x.date === ev.startDate);
  const track = (id: string) => ev.tracks.find((t) => t.id === id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendee Calendar"
      width={840}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              save(cfg);
              toast.success('Saved the attendee calendar');
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className={s.previewLayout}>
        <Device label="Preview of the attendee calendar">
          <div className={s.calendarPreview}>
            <Calendar key={cfg.firstDay} value={null} today={todayIn(ev.timezone)} highlight={days} initialMonth={ev.startDate} firstDay={cfg.firstDay === 'monday' ? 1 : 0} readOnly onSelect={() => undefined} />
            <div className={s.calendarDay}>
              <h4>{formatWeekdayShort(ev.startDate)}</h4>
              {first.length === 0 && <span className={s.portalMeta}>No sessions on this day yet.</span>}
              {first.slice(0, 6).map((x) => (
                <div key={x.id} className={s.calendarItem} style={{ ['--track' as string]: `var(--sw-${track(x.trackId)?.swatch ?? 'grape'})` }}>
                  <div>
                    <strong>{x.title}</strong>
                    <span>
                      {formatTimeRange(x.startMinutes, x.durationMinutes)}
                      {cfg.showRooms && x.room ? ` · ${x.room}` : ''}
                    </span>
                  </div>
                  {cfg.allowAdd && <span className={s.calendarAdd}>Add</span>}
                </div>
              ))}
              {first.length > 6 && <span className={s.portalMeta}>And {first.length - 6} more sessions</span>}
            </div>
          </div>
        </Device>
        <div className={s.settingsStrip}>
          <Switch checked={cfg.allowAdd} onChange={(v) => setCfg((x) => ({ ...x, allowAdd: v }))} label="Allow adding sessions to personal calendar" />
          <Switch checked={cfg.showRooms} onChange={(v) => setCfg((x) => ({ ...x, showRooms: v }))} label="Show room names" />
          <Select
            label="First day of week"
            size="sm"
            value={cfg.firstDay}
            onChange={(v) => setCfg((x) => ({ ...x, firstDay: v }))}
            options={[
              { value: 'sunday', label: 'Sunday' },
              { value: 'monday', label: 'Monday' },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
