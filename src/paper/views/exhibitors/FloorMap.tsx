import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Booth, EventRecord, Exhibitor } from '@/store/types';
import { tooltip } from '../../ui/tooltipStore';
import { MAP, STATUS_META, TIERS, TIER_META, boothOrder, boothRect, monogram } from './meta';
import s from './exhibitors.module.scss';

const NAME_MAX = 15;
const clip = (name: string) => (name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1).trimEnd()}…` : name);

interface FloorMapProps {
  ev: EventRecord;
  /** Exhibitors that match the toolbar filters; null when nothing is filtered. Others are dimmed. */
  visible: Set<string> | null;
  /** A booth that was just assigned, which plays the fill-in animation once. */
  freshBooth: string | null;
  /** The booth whose assign popover is open. */
  activeBooth: string | null;
  onOpen: (exhibitorId: string) => void;
  onAssign: (boothId: string, el: Element) => void;
}

/** The expo floor: 24 booths in a 6 x 4 grid either side of a central aisle, entrance at the bottom. */
export function FloorMap({ ev, visible, freshBooth, activeBooth, onOpen, onAssign }: FloorMapProps) {
  const captionId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(true);
  const byBooth = new Map(ev.exhibitors.filter((x) => x.boothId).map((x) => [x.boothId as string, x]));
  const booths = boothOrder(ev.booths);
  const assigned = booths.filter((b) => byBooth.has(b.id)).length;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <div className={s.mapCard}>
      <div className={s.mapHead}>
        <div>
          <h2>Expo hall</h2>
          <p className={s.mapSub}>
            {assigned} of {booths.length} booths assigned
          </p>
        </div>
        <div className={s.legend} aria-label="Legend" role="list">
          {TIERS.map((t) => (
            <span key={t} role="listitem">
              <i style={{ background: `color-mix(in srgb, var(--sw-${TIER_META[t].swatch}) 18%, transparent)`, borderColor: `var(--sw-${TIER_META[t].swatch})` }} />
              {TIER_META[t].label}
            </span>
          ))}
          <span role="listitem">
            <i className={s.legendEmpty} />
            Empty
          </span>
        </div>
      </div>
      <div className={s.mapScrollWrap} data-at-end={atEnd || undefined}>
        <div ref={scroller} className={s.mapScroll}>
          <svg className={s.svg} viewBox={`0 0 ${MAP.w} ${MAP.h}`} role="group" aria-label="Floor map" aria-describedby={captionId}>
            <path className={s.wall} d={`M556 ${MAP.h - 12} H12 V12 H${MAP.w - 12} V${MAP.h - 12} H644`} aria-hidden="true" />
            <g aria-hidden="true">
              <path className={s.entrance} d={`M556 ${MAP.h - 12} A44 34 0 0 1 644 ${MAP.h - 12}`} />
              <text className={s.entranceText} x={600} y={MAP.h - 18} textAnchor="middle">
                Entrance
              </text>
            </g>
            {booths.map((b) => (
              <BoothShape
                key={b.id}
                booth={b}
                x={byBooth.get(b.id) ?? null}
                dim={Boolean(visible && byBooth.has(b.id) && !visible.has(byBooth.get(b.id)!.id))}
                fresh={freshBooth === b.id}
                hot={activeBooth === b.id}
                onOpen={onOpen}
                onAssign={onAssign}
              />
            ))}
          </svg>
        </div>
      </div>
      <p className={s.mapCaption} id={captionId}>
        Click a booth to open its exhibitor. Click an empty booth to assign one.
      </p>
    </div>
  );
}

function BoothShape({ booth, x, dim, fresh, hot, onOpen, onAssign }: { booth: Booth; x: Exhibitor | null; dim: boolean; fresh: boolean; hot: boolean; onOpen: (id: string) => void; onAssign: (boothId: string, el: Element) => void }) {
  const r = boothRect(booth.row, booth.col);
  const cx = r.x + r.w / 2;
  const activate = (el: Element) => {
    tooltip.hide(el as HTMLElement);
    if (x) onOpen(x.id);
    else onAssign(booth.id, el);
  };
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(e.currentTarget);
    }
  };
  const sw = x ? TIER_META[x.tier].swatch : null;
  const st = x ? STATUS_META[x.status] : null;
  // The booth is one element whether empty or occupied, so focus survives an assignment.
  // The hover card is the shared HTML tooltip, positioned from the booth's bounding box.
  const tip =
    x && st ? (
      <span className={s.tip}>
        <strong>{x.name}</strong>
        <span>
          {TIER_META[x.tier].label} · {st.label}
        </span>
        {x.contact.name && <span>{x.contact.name}</span>}
      </span>
    ) : null;
  const show = (el: Element, immediate = false) => tip && tooltip.show(el as HTMLElement, tip, 'top', { immediate });
  const hide = (el: Element) => tooltip.hide(el as HTMLElement);

  return (
    <g className={`${s.booth} ${fresh && x ? s.fresh : ''}`} data-occupied={x ? '' : undefined} data-empty={x ? undefined : ''} data-hot={hot || undefined} data-dim={dim || undefined}>
      {/* The button holds only shapes; the visible text is a sibling layer, so its accessible name is the full description. */}
      <g
        role="button"
        tabIndex={0}
        className={s.boothG}
        data-booth={booth.label}
        aria-label={x && st ? `Booth ${booth.label}, ${x.name}, ${TIER_META[x.tier].label}, ${st.label.toLowerCase()}` : `Booth ${booth.label}, empty, assign exhibitor`}
        onClick={(e) => activate(e.currentTarget)}
        onKeyDown={onKey}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show(e.currentTarget)}
        onPointerLeave={(e) => hide(e.currentTarget)}
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && show(e.currentTarget)}
        onBlur={(e) => hide(e.currentTarget)}
      >
        <rect className={s.ring} x={r.x - 5} y={r.y - 5} width={r.w + 10} height={r.h + 10} rx={14} />
        <rect className={`${s.shape} ${x ? '' : s.emptyShape}`} x={r.x} y={r.y} width={r.w} height={r.h} rx={10} style={sw ? { fill: `var(--sw-${sw})`, stroke: `var(--sw-${sw})` } : undefined} />
      </g>
      <g className={s.boothText} aria-hidden="true">
        <text className={s.boothLabel} x={r.x + 12} y={r.y + 22}>
          {booth.label}
          {x && (
            <tspan className={s.boothTier} dx={6}>
              {TIER_META[x.tier].label}
            </tspan>
          )}
        </text>
        {x && st && sw ? (
          <>
            <circle cx={r.x + r.w - 16} cy={r.y + 17} r={4.5} style={{ fill: st.color }} />
            <g className={s.monoG}>
              <rect x={cx - 16} y={r.y + 30} width={32} height={32} rx={8} className={s.monoTile} style={{ stroke: `color-mix(in srgb, var(--sw-${sw}) 45%, transparent)` }} />
              <text className={s.monoText} x={cx} y={r.y + 51.5} textAnchor="middle" style={{ fill: `var(--sw-${sw}-ink)` }}>
                {monogram(x.name)}
              </text>
            </g>
            <text className={s.boothName} x={cx} y={r.y + 90} textAnchor="middle">
              <title>{x.name}</title>
              {clip(x.name)}
            </text>
          </>
        ) : (
          <g className={s.plus}>
            <line x1={cx - 9} y1={r.y + 60} x2={cx + 9} y2={r.y + 60} />
            <line x1={cx} y1={r.y + 51} x2={cx} y2={r.y + 69} />
          </g>
        )}
      </g>
    </g>
  );
}
