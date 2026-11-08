import { useMemo } from 'react';
import { useStore, selectActive } from '@/store/store';
import { eventDays } from '@/store/selectors';
import { checkSession } from '@/store/slices/content';
import type { ISODate, Session } from '@/store/types';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { TimeField } from '../../ui/form/TimeField';
import { NumberField } from '../../ui/form/NumberField';
import { TagInput } from '../../ui/form/TagInput';
import { InlineEdit } from '../../ui/InlineEdit';
import { Avatar } from '../../ui/display';
import { Icon } from '../../ui/Icon';
import { useDraft } from '../../hooks/useDraft';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { formatTime, formatTimeRange, formatWeekdayShort } from '../../lib/format';
import l from '../shared/lists.module.scss';
import s from './content.module.scss';

export type SessionRequest = { kind: 'new'; day: ISODate; trackId?: string; start?: number } | { kind: 'edit'; id: string };
const DURATIONS = [30, 45, 60, 75, 90, 120];

interface Draft {
  title: string;
  trackId: string;
  date: ISODate;
  startMinutes: number;
  durationMinutes: number;
  speakerName: string;
  speakerTitle: string;
  description: string;
  capacity: number | null;
  room: string;
  tags: string[];
}

/** Create or edit a session. The time range must fit the agenda and not overlap its track. */
export function SessionSheet({ request, onClose }: { request: SessionRequest | null; onClose: () => void }) {
  const ev = useStore(selectActive);
  const add = useStore((st) => st.addSession);
  const update = useStore((st) => st.updateSession);
  const removeSession = useStore((st) => st.removeSession);
  const flow = useSaveFlow();
  const existing = request?.kind === 'edit' ? ev.sessions.find((x) => x.id === request.id) : null;
  const open = request !== null && (request.kind === 'new' || Boolean(existing));

  const firstFree = (trackId: string, day: ISODate) => {
    for (let m = ev.agenda.startMinutes; m + 45 <= ev.agenda.endMinutes; m += 15) if (!checkSession(ev, { trackId, date: day, startMinutes: m, durationMinutes: 45 })) return m;
    return ev.agenda.startMinutes;
  };
  const f = useDraft<Draft>(open, () => {
    if (existing)
      return {
        title: existing.title,
        trackId: existing.trackId,
        date: existing.date,
        startMinutes: existing.startMinutes,
        durationMinutes: existing.durationMinutes,
        speakerName: existing.speaker?.name ?? '',
        speakerTitle: existing.speaker?.title ?? '',
        description: existing.description,
        capacity: existing.capacity,
        room: existing.room ?? '',
        tags: [...existing.tags],
      };
    const r = request?.kind === 'new' ? request : null;
    const trackId = r?.trackId ?? ev.tracks[0]?.id ?? '';
    const day = r?.day ?? ev.startDate;
    return { title: 'New session', trackId, date: day, startMinutes: r?.start ?? firstFree(trackId, day), durationMinutes: 45, speakerName: '', speakerTitle: '', description: '', capacity: null, room: '', tags: [] };
  });
  const d = f.draft;
  const check = useMemo(() => (d.trackId ? checkSession(ev, { trackId: d.trackId, date: d.date, startMinutes: d.startMinutes, durationMinutes: d.durationMinutes }, existing?.id) : null), [ev, d.trackId, d.date, d.startMinutes, d.durationMinutes, existing?.id]);
  const conflictMsg = !check ? null : check.ok === false && check.conflict ? `Overlaps '${check.conflict.title}' (${formatTimeRange(check.conflict.startMinutes, check.conflict.durationMinutes)}) in this track` : `Ends after the agenda closes at ${formatTime(ev.agenda.endMinutes)}`;
  const titleError = !d.title.trim() ? 'Enter a title' : null;
  const cancel = useCloseGuard(f.dirty && flow.state === 'idle', onClose);
  const tagSuggestions = Array.from(new Set(ev.sessions.flatMap((x) => x.tags)));

  const record = (): Omit<Session, 'id'> => ({
    title: d.title.trim(),
    trackId: d.trackId,
    date: d.date,
    startMinutes: d.startMinutes,
    durationMinutes: d.durationMinutes,
    speaker: d.speakerName.trim() ? { name: d.speakerName.trim(), title: d.speakerTitle.trim() } : null,
    description: d.description.trim(),
    capacity: d.capacity,
    room: d.room.trim() || null,
    tags: d.tags,
  });
  const submit = () => {
    f.setSubmitted(true);
    if (titleError || conflictMsg) return;
    flow.run(() => {
      const rec = record();
      if (existing) {
        update(existing.id, rec);
        toast.success(`Saved ${rec.title}`);
      } else {
        add(rec);
        toast.success(`Added ${rec.title}`);
      }
    }, onClose);
  };
  const remove = async () => {
    if (!existing) return;
    if (!(await confirmDialog({ title: `Remove ${existing.title}?`, body: 'It leaves the agenda, the portal and personal calendars.', confirmLabel: 'Remove', danger: true }))) return;
    const token = removeSession(existing.id);
    onClose();
    toast.undo(`Removed ${existing.title}`, token, `Undo removing ${existing.title}`);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      titleText={d.title || 'Session'}
      title={<InlineEdit value={d.title} label="Session title" requiredMessage="Enter a title" maxLength={90} onCommit={(v) => f.set('title', v)} />}
      subtitle={`${formatWeekdayShort(d.date)} · ${formatTimeRange(d.startMinutes, d.durationMinutes)}`}
      dirty={f.dirty && flow.state === 'idle'}
      footer={
        <>
          {existing && (
            <Button variant="danger-ghost" icon="trash" onClick={() => void remove()}>
              Remove session
            </Button>
          )}
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={() => void cancel()}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={flow.loading} success={flow.success}>
            {existing ? 'Save' : 'Add session'}
          </Button>
        </>
      }
    >
      <form
        className={l.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {f.submitted && titleError && (
          <p className={l.error} role="alert">
            {titleError}
          </p>
        )}
        <Select label="Track" value={d.trackId} onChange={(v) => f.set('trackId', v)} options={ev.tracks.map((t) => ({ value: t.id, label: t.name, leading: <i style={{ width: 8, height: 8, borderRadius: 4, background: `var(--sw-${t.swatch})` }} aria-hidden="true" /> }))} />
        <div className={l.row2}>
          <Select label="Date" value={d.date} onChange={(v) => f.set('date', v)} options={eventDays(ev).map((x) => ({ value: x, label: formatWeekdayShort(x) }))} />
          <TimeField label="Start" value={d.startMinutes} onChange={(v) => f.set('startMinutes', v)} from={ev.agenda.startMinutes} to={ev.agenda.endMinutes} />
        </div>
        <Select label="Duration" value={String(d.durationMinutes)} onChange={(v) => f.set('durationMinutes', Number(v))} options={DURATIONS.map((m) => ({ value: String(m), label: `${m} minutes` }))} />
        {conflictMsg && (
          <p className={s.conflict} role="alert">
            <Icon name="triangle-alert" size={16} />
            {conflictMsg}
          </p>
        )}
        <div className={s.speakerRow}>
          <Avatar name={d.speakerName || '?'} size={40} />
          <Input label="Speaker" value={d.speakerName} onChange={(e) => f.set('speakerName', e.target.value)} placeholder="Priya Natarajan" />
          <Input label="Title and company" value={d.speakerTitle} onChange={(e) => f.set('speakerTitle', e.target.value)} placeholder="Head of Platform, Horizon" />
        </div>
        <Textarea label="Description" value={d.description} onChange={(e) => f.set('description', e.target.value)} maxCount={400} rows={4} error={d.description.length > 400 ? 'Keep it to 400 characters' : null} />
        <div className={l.row2}>
          <NumberField label="Capacity" value={d.capacity} onChange={(v) => f.set('capacity', v)} min={1} max={100000} placeholder="No limit" />
          <Input label="Room" value={d.room} onChange={(e) => f.set('room', e.target.value)} placeholder="Ballroom A" />
        </div>
        <TagInput label="Tags" value={d.tags} onChange={(v) => f.set('tags', v)} suggestions={tagSuggestions} max={8} />
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
