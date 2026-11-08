import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Portal } from './Portal';
import { useOverlay } from './useOverlay';
import { usePresence } from '@/paper/hooks/usePresence';
import { useBreakpoint } from '@/paper/hooks/useMediaQuery';
import { computePosition, type Placement, type Positioned } from './position';
import { BottomSheet } from './BottomSheet';
import s from './overlay.module.scss';

export interface PopoverProps {
  open: boolean;
  onClose: (opts?: { instant?: boolean }) => void;
  anchor: RefObject<HTMLElement | null>;
  label: string;
  placement?: Placement;
  width?: number | 'anchor';
  /** On mobile the popover becomes a bottom sheet with this visible title. */
  sheetTitle?: ReactNode;
  /** 'dialog' for interactive content; 'presentation' when the content carries its own role (menu, listbox). */
  role?: 'dialog' | 'presentation';
  initialFocus?: 'first' | 'container' | 'none' | RefObject<HTMLElement | null>;
  /** Keep anchored even on mobile (small inline pickers). */
  alwaysAnchored?: boolean;
  trap?: boolean;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
  id?: string;
}

/** Anchored, flips to stay on screen, grows from its trigger. Becomes a bottom sheet below 900 px. */
export function Popover(props: PopoverProps) {
  const { isMobile } = useBreakpoint();
  if (isMobile && !props.alwaysAnchored) {
    return (
      <BottomSheet open={props.open} onClose={props.onClose} label={props.label} title={props.sheetTitle} role={props.role === 'presentation' ? 'none' : 'dialog'} initialFocus={props.initialFocus} labelledBy={props.labelledBy}>
        {props.children}
      </BottomSheet>
    );
  }
  return <AnchoredPanel {...props} />;
}

function AnchoredPanel({ open, onClose, anchor, label, placement = 'bottom-start', width, role = 'dialog', initialFocus = 'first', trap = true, className, children, labelledBy, id }: PopoverProps) {
  const presence = usePresence(open, 140);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Positioned | null>(null);
  const close = (o?: { instant?: boolean }) => {
    if (o?.instant) presence.skipExit();
    onClose(o);
  };
  useOverlay({ open: presence.mounted && open, onClose: close, container: panel, anchor, trap, closeOnOutside: true, initialFocus });

  useLayoutEffect(() => {
    if (!presence.mounted) return;
    const place = () => {
      const a = anchor.current;
      const p = panel.current;
      if (!a || !p) return;
      setPos(computePosition(a.getBoundingClientRect(), { width: p.offsetWidth, height: p.offsetHeight }, placement));
    };
    place();
    const ro = new ResizeObserver(place);
    if (panel.current) ro.observe(panel.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [presence.mounted, anchor, placement]);

  if (!presence.mounted) return null;
  const w = width === 'anchor' ? anchor.current?.offsetWidth : width;
  return (
    <Portal>
      <div
        ref={panel}
        id={id}
        className={`${s.floating} ${className ?? ''}`}
        data-state={presence.state === 'open' && pos ? 'open' : 'closed'}
        role={role === 'dialog' ? 'dialog' : undefined}
        aria-label={role === 'dialog' && !labelledBy ? label : undefined}
        aria-labelledby={role === 'dialog' ? labelledBy : undefined}
        tabIndex={-1}
        style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, transformOrigin: pos?.origin, width: w, minWidth: width === 'anchor' ? w : undefined }}
      >
        <div className={s.floatingBody}>{children}</div>
      </div>
    </Portal>
  );
}
