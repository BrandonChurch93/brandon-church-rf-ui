import { useEffect, useMemo, useState } from 'react';
import type { ViewProps } from '../../shell/ViewSwitch';
import { ViewHeader } from '../../shell/ViewHeader';
import { useStore, selectActive } from '@/store/store';
import { eventDays } from '@/store/selectors';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { Icon } from '../../ui/Icon';
import { Tabs } from '../../ui/Tabs';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { Checkbox } from '../../ui/form/Checkbox';
import { Badge, EmptyState } from '../../ui/display';
import { BottomSheet } from '../../ui/overlay/BottomSheet';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { useShell, registerIntent } from '../../shellStore';
import { formatTime, formatTimeRange, formatWeekdayShort, plural } from '../../lib/format';
import { AgendaGrid } from './AgendaGrid';
import { SessionSheet, type SessionRequest } from './SessionSheet';
import { ManageTracks } from './ManageTracks';
import s from './content.module.scss';

registerIntent('add-session');

/** Content: the agenda as a grid (drag to reschedule) or a list, with a session sheet. */
export function ContentView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const { isMobile } = useBreakpoint();
  const days = eventDays(ev);
  const [day, setDay] = useState(days[0]);
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [hidden, setHidden] = useState<string[]>([]);
  const [request, setRequest] = useState<SessionRequest | null>(null);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [trackSheet, setTrackSheet] = useState(false);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);

  useEffect(() => {
    if (!days.includes(day)) setDay(days[0]);
  }, [days, day]);
  useEffect(() => {
    if (intent?.type === 'add-session') {
      consume(intent.id);
      setRequest({ kind: 'new', day });
    }
  }, [intent, consume, day]);

  const visibleTracks = ev.tracks.filter((t) => !hidden.includes(t.id));
  const sessions = useMemo(() => ev.sessions.filter((x) => x.date === day && !hidden.includes(x.trackId)), [ev.sessions, day, hidden]);
  const dayCount = ev.sessions.filter((x) => x.date === day).length;
  const showList = isMobile || mode === 'list';
  const toggleTrack = (id: string) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  return (
    <>
      <ViewHeader
        title="Content"
        description="Sessions, speakers and the schedule attendees will see."
        aside={
          isMobile && (
            <Menu
              label="More content actions"
              items={[{ id: 'tracks', label: 'Manage tracks', icon: 'rows', onSelect: () => setTracksOpen(true) }]}
              trigger={(tp) => <IconButton {...tp} icon="ellipsis" label="More actions" variant="subtle" />}
            />
          )
        }
        actions={
          <>
            {!isMobile && (
              <SegmentedControl
                size="sm"
                label="Agenda view"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'grid', label: 'Grid', icon: 'grid' },
                  { value: 'list', label: 'List', icon: 'list' },
                ]}
              />
            )}
            {!isMobile && (
              <Button variant="secondary" icon="rows" onClick={() => setTracksOpen(true)}>
                Manage tracks
              </Button>
            )}
            <Button variant="primary" icon="plus" className="primary-action" fullWidth={isMobile} onClick={() => setRequest({ kind: 'new', day })}>
              Add session
            </Button>
          </>
        }
      />
      <div className={s.bar} data-part>
        <div className={s.dayTabs}>
          <Tabs label="Event days" idPrefix="days" value={day} onChange={setDay} items={days.map((d) => ({ value: d, label: formatWeekdayShort(d) }))} />
        </div>
        <div className={s.trackFilters}>
          {isMobile ? (
            <Button variant="secondary" icon="sliders" onClick={() => setTrackSheet(true)} aria-label={hidden.length ? `Tracks, ${hidden.length} hidden` : 'Tracks'}>
              Tracks {hidden.length > 0 && <Badge tone="accent">{ev.tracks.length - hidden.length}</Badge>}
            </Button>
          ) : (
            ev.tracks.map((t) => (
              <button key={t.id} type="button" className={s.trackChip} aria-pressed={!hidden.includes(t.id)} onClick={() => toggleTrack(t.id)}>
                <i style={{ background: `var(--sw-${t.swatch})` }} aria-hidden="true" />
                {t.name}
              </button>
            ))
          )}
          <span className={s.count} aria-live="polite">
            {plural(sessions.length, 'session')}
          </span>
        </div>
      </div>
      <section data-part id="days-panel" role="tabpanel" aria-labelledby={`days-tab-${day}`}>
        {visibleTracks.length === 0 && (
          <div className={s.banner}>
            <Icon name="info" size={16} />
            All tracks are hidden.
            <button type="button" onClick={() => setHidden([])}>
              Show all tracks
            </button>
          </div>
        )}
        {showList ? (
          sessions.length === 0 ? (
            <div className={s.list}>
              <EmptyState
                icon="calendar-plus"
                title={dayCount === 0 ? 'No sessions yet' : 'No sessions in these tracks'}
                body={dayCount === 0 ? 'Add the first session to start building the agenda.' : 'Show more tracks to see the rest of the day.'}
                action={dayCount === 0 ? { label: 'Add session', icon: 'plus', onClick: () => setRequest({ kind: 'new', day }) } : { label: 'Show all tracks', onClick: () => setHidden([]) }}
              />
            </div>
          ) : (
            <AgendaList sessions={sessions} onOpen={(id) => setRequest({ kind: 'edit', id })} />
          )
        ) : (
          visibleTracks.length > 0 && <AgendaGrid ev={ev} day={day} tracks={visibleTracks} sessions={sessions} onOpen={(id) => setRequest({ kind: 'edit', id })} onAddAt={(trackId, start) => setRequest({ kind: 'new', day, trackId, start })} />
        )}
      </section>
      <SessionSheet request={request} onClose={() => setRequest(null)} />
      <ManageTracks open={tracksOpen} onClose={() => setTracksOpen(false)} />
      <BottomSheet open={trackSheet} onClose={() => setTrackSheet(false)} label="Tracks" title="Tracks">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 8px 16px' }}>
          {ev.tracks.map((t) => (
            <Checkbox
              key={t.id}
              checked={!hidden.includes(t.id)}
              onChange={() => toggleTrack(t.id)}
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                  <i style={{ width: 8, height: 8, borderRadius: 4, background: `var(--sw-${t.swatch})` }} aria-hidden="true" />
                  {t.name}
                </span>
              }
            />
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

function AgendaList({ sessions, onOpen }: { sessions: import('@/store/types').Session[]; onOpen: (id: string) => void }) {
  const ev = useStore(selectActive);
  const order = new Map(ev.tracks.map((t, i) => [t.id, i]));
  const sorted = [...sessions].sort((a, b) => a.startMinutes - b.startMinutes || (order.get(a.trackId) ?? 0) - (order.get(b.trackId) ?? 0));
  const groups: Array<{ hour: number; items: typeof sorted }> = [];
  for (const x of sorted) {
    const hour = Math.floor(x.startMinutes / 60) * 60;
    const g = groups.at(-1);
    if (g && g.hour === hour) g.items.push(x);
    else groups.push({ hour, items: [x] });
  }
  return (
    <div className={s.list}>
      {groups.map((g) => (
        <div key={g.hour} role="group" aria-label={formatTime(g.hour)}>
          <div className={s.group}>{formatTime(g.hour)}</div>
          {g.items.map((x) => {
            const t = ev.tracks.find((tr) => tr.id === x.trackId);
            return (
              <div key={x.id} className={s.row}>
                <span className={s.rowTime}>{formatTimeRange(x.startMinutes, x.durationMinutes)}</span>
                <div className={s.rowMain}>
                  <button type="button" className={s.rowTitle} onClick={() => onOpen(x.id)}>
                    {x.title}
                  </button>
                  <span className={s.rowMeta}>
                    <i style={{ background: `var(--sw-${t?.swatch ?? 'grape'})` }} aria-hidden="true" />
                    <span>
                      {t?.name}
                      {x.speaker ? ` · ${x.speaker.name}` : ''}
                      {x.room ? ` · ${x.room}` : ''}
                    </span>
                  </span>
                </div>
                <Icon name="chevron-right" size={18} className={s.chevron} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
