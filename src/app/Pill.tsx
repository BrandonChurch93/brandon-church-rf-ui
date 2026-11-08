import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import s from './pill.module.scss';
import { pillEntrance, pillIdle, pillRipple, stopPillIdle } from '@/motion/pillIdle';
import { useReducedMotion } from '@/motion/reduced';

export type Mode = 'faithful' | 'paper';

interface PillProps {
  /** The mode on screen (or arriving). The label offers the other one. */
  mode: Mode;
  /** True once the pill has been used; the attention beats stop and the border calms. */
  calm: boolean;
  /** Slides off screen while a sheet, modal, palette, drawer or mobile bulk bar is open. */
  stepAside: boolean;
  isBusy: () => boolean;
  onToggle: () => void;
  /** Hover or focus: a good moment to preload Brandon's Mode. */
  onIntent?: () => void;
}

/** yPercent that moves the dock fully below the viewport from wherever it rests. */
function offscreenPercent(d: HTMLElement) {
  const h = d.offsetHeight || 44;
  const restTop = d.getBoundingClientRect().top - (Number(gsap.getProperty(d, 'y')) || 0) - ((Number(gsap.getProperty(d, 'yPercent')) || 0) / 100) * h;
  return Math.max(140, ((window.innerHeight - restTop + 24) / h) * 100);
}

const supportsProperty = typeof CSS !== 'undefined' && 'registerProperty' in CSS;
const MAGNET = 0.18;

export function Pill({ mode, calm, stepAside, isBusy, onToggle, onIntent }: PillProps) {
  const dock = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const sweep = useRef<HTMLElement>(null);
  const glyph = useRef<HTMLSpanElement>(null);
  const idle = useRef<gsap.core.Timeline | null>(null);
  const entered = useRef(false);
  const hovering = useRef(false);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const entrance = useRef<gsap.core.Tween | null>(null);
  const asideRef = useRef(stepAside);
  asideRef.current = stepAside;

  const parts = () => ({ pill: pill.current!, ring: ring.current!, sweep: sweep.current!, glyph: glyph.current! });

  // Entrance on first paint, then the idle beats until the first click.
  useEffect(() => {
    const d = dock.current;
    if (!d) return;
    if (reduced) {
      entered.current = true;
      setReady(true);
      return;
    }
    const tween = pillEntrance(d, () => {
      entered.current = true;
      entrance.current = null;
      setReady(true);
      if (asideRef.current) gsap.to(d, { yPercent: offscreenPercent(d), duration: 0.32, ease: 'power2.in' });
    });
    entrance.current = tween;
    return () => {
      tween.kill();
      gsap.set(d, { clearProps: 'all' });
    };
    // Runs once on mount; a reduced-motion change later is handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || calm || reduced) return;
    idle.current = pillIdle(parts());
    if (hovering.current) idle.current.pause();
    return () => {
      stopPillIdle(idle.current, parts());
      idle.current = null;
    };
  }, [ready, calm, reduced]);

  // Stepping aside for layers that need the corner.
  useEffect(() => {
    const d = dock.current;
    if (!d) return;
    if (!entered.current) {
      // A layer opened before the entrance finished: finish it now so the pill can step aside.
      if (!stepAside || !entrance.current) return;
      entrance.current.kill();
      entrance.current = null;
      entered.current = true;
      gsap.set(d, { opacity: 1 });
      setReady(true);
    }
    if (reduced) {
      gsap.set(d, { yPercent: stepAside ? offscreenPercent(d) : 0 });
      return;
    }
    gsap.to(d, stepAside ? { yPercent: offscreenPercent(d), duration: 0.32, ease: 'power2.in', overwrite: 'auto' } : { yPercent: 0, duration: 0.48, ease: 'power3.out', overwrite: 'auto' });
  }, [stepAside, reduced]);

  // Below 900 px the pill sits higher in Brandon's Mode (above the tab bar). Slide between the two.
  const lastTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    const d = dock.current;
    if (!d) return;
    const top = d.getBoundingClientRect().top - (Number(gsap.getProperty(d, 'y')) || 0);
    if (lastTop.current !== null && Math.abs(lastTop.current - top) > 1 && !reduced) {
      gsap.fromTo(d, { y: lastTop.current - top }, { y: 0, duration: 0.48, delay: 0.3, ease: 'power3.out', overwrite: 'auto' });
    }
    lastTop.current = top;
  }, [mode, reduced]);

  const onPointerEnter = (e: PointerEvent) => {
    onIntent?.();
    if (e.pointerType !== 'mouse') return;
    hovering.current = true;
    idle.current?.pause();
    if (!reduced) gsap.to(pill.current, { scale: 1.04, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduced || !pill.current) return;
    const r = pill.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    gsap.to(pill.current, { x: dx * MAGNET, y: dy * MAGNET, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    hovering.current = false;
    idle.current?.resume();
    if (!reduced) gsap.to(pill.current, { x: 0, y: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
  };
  const onPointerDown = () => {
    if (!reduced) gsap.to(pill.current, { scale: 0.96, duration: 0.1, ease: 'power2.out', overwrite: 'auto' });
  };
  const onPointerUp = (e: PointerEvent) => {
    if (reduced) return;
    const back = e.pointerType === 'mouse' && hovering.current ? 1.04 : 1;
    gsap.to(pill.current, { scale: back, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
  };
  const onClick = () => {
    if (isBusy()) return;
    if (!reduced && ring.current) pillRipple(ring.current);
    onToggle();
  };

  const isOn = mode === 'paper';
  const classes = [s.pill, calm ? s.isCalm : '', !supportsProperty || reduced ? s.isStatic : '', reduced ? s.isReduced : ''].join(' ');

  return (
    <div ref={dock} className={`${s.dock} ${isOn ? s.isPaper : ''}`}>
      <button
        ref={pill}
        type="button"
        data-pill
        className={classes}
        aria-pressed={isOn}
        aria-describedby="pill-description"
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onFocus={onIntent}
        onClick={onClick}
      >
        <span ref={ring} className={s.ring} aria-hidden="true" />
        <span className={s.sweepClip} aria-hidden="true">
          <i ref={sweep} className={s.sweep} />
        </span>
        <span ref={glyph} className={s.glyph} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" />
          </svg>
        </span>
        <span className={s.label}>
          <span className={isOn ? s.labelOff : ''} aria-hidden={isOn}>
            Brandon&apos;s Mode
          </span>
          <span className={isOn ? '' : s.labelOff} aria-hidden={!isOn}>
            View original
          </span>
        </span>
      </button>
      <span id="pill-description" className="sr-only">
        Switches between the original design and Brandon&apos;s Mode
      </span>
    </div>
  );
}
