import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type PointerEvent, type ReactElement, type ReactNode } from 'react';
import { tooltip, useTooltipState } from './tooltipStore';
import { computePosition, type Placement, type Positioned } from './overlay/position';
import { Portal } from './overlay/Portal';
import s from './tooltip.module.scss';

const LONG_PRESS_MS = 500;

interface TooltipProps {
  content: ReactNode;
  placement?: Placement;
  /** Link the content as the trigger's description. Off for icon buttons, whose label already says it. */
  describe?: boolean;
  disabled?: boolean;
  children: ReactElement;
}

type TriggerProps = {
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (e: PointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  'aria-describedby'?: string;
};

/** Wraps one interactive child and shows `content` on hover, focus and touch long-press. */
export function Tooltip({ content, placement = 'top', describe = true, disabled, children }: TooltipProps) {
  const id = useId();
  const press = useRef<number | null>(null);
  if (!isValidElement<TriggerProps>(children)) return children;
  if (disabled || content === null || content === undefined || content === '') return children;
  const p = children.props;

  const show = (el: HTMLElement, immediate = false) => tooltip.show(el, content, placement, { immediate });
  const merged: TriggerProps = {
    onPointerEnter: (e) => {
      p.onPointerEnter?.(e);
      if (e.pointerType === 'mouse') show(e.currentTarget);
    },
    onPointerLeave: (e) => {
      p.onPointerLeave?.(e);
      if (e.pointerType === 'mouse') tooltip.hide(e.currentTarget);
    },
    onPointerDown: (e) => {
      p.onPointerDown?.(e);
      if (e.pointerType === 'mouse') {
        tooltip.hide(e.currentTarget);
        return;
      }
      const el = e.currentTarget;
      press.current = window.setTimeout(() => show(el, true), LONG_PRESS_MS);
    },
    onPointerUp: (e) => {
      p.onPointerUp?.(e);
      if (press.current) window.clearTimeout(press.current);
      if (e.pointerType !== 'mouse') {
        const el = e.currentTarget;
        window.setTimeout(() => tooltip.hide(el), 1500);
      }
    },
    onPointerCancel: (e) => {
      p.onPointerCancel?.(e);
      if (press.current) window.clearTimeout(press.current);
    },
    onFocus: (e) => {
      p.onFocus?.(e);
      if (e.currentTarget.matches(':focus-visible')) show(e.currentTarget);
    },
    onBlur: (e) => {
      p.onBlur?.(e);
      tooltip.hide(e.currentTarget);
    },
  };
  if (describe) merged['aria-describedby'] = [p['aria-describedby'], id].filter(Boolean).join(' ');
  return (
    <>
      {cloneElement(children, merged)}
      {describe && (
        <span id={id} hidden>
          {content}
        </span>
      )}
    </>
  );
}

/** Renders the single visible tooltip. Mounted once by the Paper shell. */
export function TooltipHost() {
  const tip = useTooltipState();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Positioned | null>(null);
  const [shown, setShown] = useState<typeof tip>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tip) {
      setShown(tip);
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = window.setTimeout(() => setShown(null), 100);
    return () => window.clearTimeout(t);
  }, [tip]);

  useLayoutEffect(() => {
    if (!shown || !ref.current) return;
    if (!shown.anchor.isConnected) {
      tooltip.hide();
      return;
    }
    const r = ref.current.getBoundingClientRect();
    setPos(computePosition(shown.anchor.getBoundingClientRect(), { width: r.width, height: r.height }, shown.placement, 8));
  }, [shown]);

  useEffect(() => {
    const hide = () => tooltip.hide();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && tooltip.hide();
    window.addEventListener('scroll', hide, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  if (!shown) return null;
  return (
    <Portal>
      <div
        ref={ref}
        role="tooltip"
        className={s.tooltip}
        data-side={pos?.side ?? shown.placement.split('-')[0]}
        data-visible={visible && pos ? 'true' : 'false'}
        style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, ['--arrow' as string]: `${pos?.arrow ?? 0}px` }}
      >
        {shown.content}
        <span className={s.arrow} aria-hidden="true" />
      </div>
    </Portal>
  );
}
