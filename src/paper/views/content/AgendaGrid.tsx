import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { EventRecord, ISODate, Session, Track } from '@/store/types';
import { useStore } from '@/store/store';
import { checkSession } from '@/store/slices/content';
import { Icon } from '../../ui/Icon';
import { toast } from '../../ui/toastStore';
import { announce } from '../../lib/announce';
import { formatTime, formatTimeRange, minutesNowIn, todayIn, plural } from '../../lib/format';
import s from './content.module.scss';

export const SLOT_MIN = 15;
export const PX_PER_MIN = 44 / 30;
const SLOT_PX = SLOT_MIN * PX_PER_MIN;
const DROP_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // back.out(1.6)

interface Props {
  ev: EventRecord;
  day: ISODate;
  tracks: Track[];
  sessions: Session[];
  onOpen: (id: string) => void;
  onAddAt: (trackId: string, start: number) => void;
}

interface Target {
  trackId: string;
  start: number;
  bad: Session | null | 'outside';
}

/** The agenda: tracks as columns, sessions placed on a 15-minute grid, drag (pointer, touch, keyboard) to move. */
export function AgendaGrid({ ev, day, tracks, sessions, onOpen, onAddAt }: Props) {
  const move = useStore((st) => st.moveSession);
  const body = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [hover, setHover] = useState<{ trackId: string; start: number } | null>(null);
  // Keyboard moves: Space picks a block up, arrows move 15 minutes or one track, Space drops, Escape cancels.
  const [kbd, setKbd] = useState<{ id: string; trackId: string; start: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { startMinutes: agendaStart, endMinutes: agendaEnd } = ev.agenda;
  const height = (agendaEnd - agendaStart) * PX_PER_MIN;
  const hours = useMemo(() => {
    const out: number[] = [];
    for (let m = agendaStart; m <= agendaEnd; m += 60) out.push(m);
    return out;
  }, [agendaStart, agendaEnd]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const nowMin = todayIn(ev.timezone, new Date(now)) === day ? minutesNowIn(ev.timezone, new Date(now)) : null;
  const showNow = nowMin !== null && nowMin >= agendaStart && nowMin <= agendaEnd;

  // Column geometry for converting a dragged position into a track and a time.
  const geometry = () => {
    const cols = Array.from(body.current?.querySelectorAll<HTMLElement>('[data-track-col]') ?? []);
    return cols.map((c) => ({ id: c.dataset.trackCol!, rect: c.getBoundingClientRect() }));
  };
  // The target comes from the drag delta (movement relative to the grid's content), which stays correct
  // when the grid scrolls during a drag, including the keyboard sensor's own scrolling.
  const targetFrom = (delta: { x: number; y: number }, s0: Session): Target | null => {
    const cols = geometry();
    if (!cols.length) return null;
    const from = Math.max(0, cols.findIndex((c) => c.id === s0.trackId));
    const colW = cols[0].rect.width || 240;
    const idx = Math.max(0, Math.min(cols.length - 1, from + Math.round(delta.x / colW)));
    let start = s0.startMinutes + Math.round(delta.y / SLOT_PX) * SLOT_MIN;
    start = Math.max(agendaStart, Math.min(agendaEnd - s0.durationMinutes, start));
    const trackId = cols[idx].id;
    const res = checkSession(ev, { trackId, date: day, startMinutes: start, durationMinutes: s0.durationMinutes }, s0.id);
    return { trackId, start, bad: res ? (res.ok === false ? (res.conflict ?? 'outside') : null) : null };
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const trackName = (id: string) => ev.tracks.find((t) => t.id === id)?.name ?? 'a track';
  const describeTarget = (t: Target | null, s0: Session | null) => (t && s0 ? `${s0.title}, ${formatTime(t.start)} in ${trackName(t.trackId)}${t.bad ? `, overlaps ${t.bad === 'outside' ? 'the agenda end' : t.bad.title}` : ''}` : '');
  const announcements: Announcements = {
    onDragStart: () => `Picked up ${active?.title ?? 'session'}. Arrow keys move by 15 minutes or one track. Space drops, Escape cancels.`,
    onDragMove: () => describeTarget(target, active),
    onDragOver: () => describeTarget(target, active),
    onDragEnd: () => '',
    onDragCancel: () => `Move cancelled. ${active?.title ?? 'The session'} stays where it was.`,
  };

  const kbdTarget = (k: { id: string; trackId: string; start: number }, s0: Session): Target => {
    const res = checkSession(ev, { trackId: k.trackId, date: day, startMinutes: k.start, durationMinutes: s0.durationMinutes }, s0.id);
    return { trackId: k.trackId, start: k.start, bad: res ? (res.ok === false ? (res.conflict ?? 'outside') : null) : null };
  };
  const onBlockKey = (e: RKeyboardEvent, s0: Session) => {
    if (!kbd) {
      if (e.key === ' ') {
        e.preventDefault();
        const k = { id: s0.id, trackId: s0.trackId, start: s0.startMinutes };
        setKbd(k);
        setActive(s0);
        setTarget(kbdTarget(k, s0));
        announce(`Picked up ${s0.title}. Up and Down move by 15 minutes, Left and Right change track. Space drops, Escape cancels.`);
      }
      return;
    }
    if (kbd.id !== s0.id) return;
    const order = tracks.map((t) => t.id);
    let next = kbd;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const start = Math.max(agendaStart, Math.min(agendaEnd - s0.durationMinutes, kbd.start + (e.key === 'ArrowDown' ? SLOT_MIN : -SLOT_MIN)));
      next = { ...kbd, start };
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const i = Math.max(0, Math.min(order.length - 1, order.indexOf(kbd.trackId) + (e.key === 'ArrowRight' ? 1 : -1)));
      next = { ...kbd, trackId: order[i] };
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setKbd(null);
      setActive(null);
      setTarget(null);
      drop(s0, kbdTarget(kbd, s0));
      return;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setKbd(null);
      setActive(null);
      setTarget(null);
      announce(`Move cancelled. ${s0.title} stays where it was.`);
      return;
    } else return;
    e.preventDefault();
    setKbd(next);
    const t = kbdTarget(next, s0);
    setTarget(t);
    announce(describeTarget(t, s0));
    requestAnimationFrame(() => body.current?.querySelector('[data-kbd-target]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  };

  const drop = (s0: Session, t: Target | null) => {
    if (!t || (t.trackId === s0.trackId && t.start === s0.startMinutes)) return;
    if (t.bad) {
      const msg = t.bad === 'outside' ? 'That slot runs past the end of the agenda' : `That slot overlaps '${t.bad.title}'`;
      toast(msg);
      announce(msg);
      return;
    }
    const res = move(s0.id, { trackId: t.trackId, date: day, startMinutes: t.start });
    if (res.ok && res.undo) {
      const msg = `Moved '${s0.title}' to ${formatTime(t.start)} in ${trackName(t.trackId)}`;
      toast.undo(msg, res.undo, `Undo moving ${s0.title}`);
      announce(msg);
    }
  };

  const onStart = (e: DragStartEvent) => {
    const s0 = sessions.find((x) => x.id === e.active.id) ?? null;
    setActive(s0);
    setHover(null);
  };
  const onMove = (e: DragMoveEvent) => {
    if (!active) return;
    setTarget(targetFrom(e.delta, active));
  };
  const onEnd = (e: DragEndEvent) => {
    const s0 = active;
    const t = s0 ? targetFrom(e.delta, s0) : null;
    setActive(null);
    setTarget(null);
    if (s0) drop(s0, t);
  };

  // Empty-slot affordance: hovering a free slot offers "Add session here".
  const onColumnMove = (e: RPointerEvent<HTMLDivElement>, trackId: string) => {
    if (active || e.pointerType !== 'mouse') return;
    if ((e.target as HTMLElement).closest('[data-block]') || (e.target as HTMLElement).closest('[data-add-here]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const start = agendaStart + Math.floor((e.clientY - rect.top) / (SLOT_PX * 2)) * 30;
    const dur = 45;
    const ok = start + 30 <= agendaEnd && !checkSession(ev, { trackId, date: day, startMinutes: start, durationMinutes: Math.min(dur, agendaEnd - start) });
    setHover(ok ? { trackId, start } : null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragMove={onMove} onDragEnd={onEnd} onDragCancel={() => (setActive(null), setTarget(null))} accessibility={{ announcements, screenReaderInstructions: { draggable: 'Press Enter to open. Press Space to pick up, move with the arrow keys, then Space to drop.' } }}>
      <div className={s.gridCard} role="region" aria-label="Agenda grid" tabIndex={-1}>
        <div className={s.gridInner} style={{ ['--tracks' as string]: tracks.length } as CSSProperties}>
          <div className={s.corner} aria-hidden="true" />
          {tracks.map((t) => (
            <div key={t.id} className={s.colHead}>
              <i style={{ background: `var(--sw-${t.swatch})` }} aria-hidden="true" />
              <strong>{t.name}</strong>
              <span>{plural(sessions.filter((x) => x.trackId === t.id).length, 'session')}</span>
            </div>
          ))}
          <div className={s.gutter} style={{ height }} aria-hidden="true">
            {hours.map((m) => (
              <span key={m} className={s.hourLabel} style={{ top: (m - agendaStart) * PX_PER_MIN }}>
                {formatTime(m)}
              </span>
            ))}
          </div>
          <div ref={body} style={{ display: 'contents' }}>
            {tracks.map((t) => {
              const list = sessions.filter((x) => x.trackId === t.id);
              return (
                 
                <div key={t.id} className={s.column} data-track-col={t.id} style={{ height }} onPointerMove={(e) => onColumnMove(e, t.id)} onPointerLeave={() => setHover(null)}>
                  <div className={s.lines} aria-hidden="true" />
                  {list.length === 0 && <span className={s.emptyNote}>No sessions</span>}
                  {target && target.trackId === t.id && active && (
                    <div className={s.target} data-kbd-target={kbd ? true : undefined} data-bad={target.bad ? true : undefined} style={{ top: (target.start - agendaStart) * PX_PER_MIN + 1, height: active.durationMinutes * PX_PER_MIN - 3 }} aria-hidden="true" />
                  )}
                  {list.map((x) => (
                    <Block key={x.id} s0={x} track={t} agendaStart={agendaStart} onOpen={onOpen} onKey={onBlockKey} lifted={kbd?.id === x.id} />
                  ))}
                  <button
                    type="button"
                    tabIndex={-1}
                    data-add-here
                    className={s.addHere}
                    data-shown={hover?.trackId === t.id || undefined}
                    style={{ top: ((hover?.trackId === t.id ? hover.start : agendaStart) - agendaStart) * PX_PER_MIN + 4, height: 44 - 8 }}
                    onClick={() => hover && onAddAt(t.id, hover.start)}
                    aria-label={hover ? `Add session at ${formatTime(hover.start)} in ${t.name}` : `Add session in ${t.name}`}
                  >
                    <Icon name="plus" size={14} />
                    Add session here
                  </button>
                  {showNow && (
                    <div className={s.now} style={{ top: (nowMin! - agendaStart) * PX_PER_MIN }} aria-hidden="true">
                      {t === tracks[0] && <span className={s.nowDot} style={{ left: -6, right: 'auto' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 320, easing: DROP_EASE }}>
        {active && (
          <div className={`${s.block} ${s.ghost}`} style={{ ['--track' as string]: `var(--sw-${ev.tracks.find((t) => t.id === (target?.trackId ?? active.trackId))?.swatch ?? 'grape'})`, height: active.durationMinutes * PX_PER_MIN - 4 } as CSSProperties}>
            <span className={s.blockTitle}>{active.title}</span>
            <span className={s.blockMeta}>{formatTimeRange(target?.start ?? active.startMinutes, active.durationMinutes)}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Block({ s0, track, agendaStart, onOpen, onKey, lifted }: { s0: Session; track: Track; agendaStart: number; onOpen: (id: string) => void; onKey: (e: RKeyboardEvent, s0: Session) => void; lifted: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: s0.id });
  const h = s0.durationMinutes * PX_PER_MIN - 4;
  return (
    <button
      ref={setNodeRef}
      type="button"
      data-block={s0.id}
      className={s.block}
      data-dragging={isDragging || lifted || undefined}
      style={{ top: (s0.startMinutes - agendaStart) * PX_PER_MIN + 2, height: h, ['--track' as string]: `var(--sw-${track.swatch})` } as CSSProperties}
      {...attributes}
      {...listeners}
      aria-pressed={lifted}
      aria-roledescription="movable session"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !lifted) {
          e.preventDefault();
          onOpen(s0.id);
          return;
        }
        onKey(e, s0);
      }}
      onClick={() => onOpen(s0.id)}
    >
      <span className={s.blockTitle}>{s0.title}</span>
      <span className={s.blockMeta}>{formatTimeRange(s0.startMinutes, s0.durationMinutes)}</span>
      {h >= 66 && s0.speaker && <span className={s.blockMeta}>{s0.speaker.name}</span>}
      <span className="sr-only">, {track.name}</span>
    </button>
  );
}
