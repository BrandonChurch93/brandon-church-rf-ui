import { useRef, type ReactNode, type RefObject, type PointerEvent as RPointerEvent } from 'react';
import { Portal } from './Portal';
import { useOverlay } from './useOverlay';
import { usePresence } from '@/paper/hooks/usePresence';
import { IconButton } from '../IconButton';
import s from './overlay.module.scss';

const SWIPE_CLOSE_PX = 80;
const SWIPE_CLOSE_VELOCITY = 0.6;

interface BottomSheetProps {
  open: boolean;
  onClose: (opts?: { instant?: boolean }) => void;
  label: string;
  /** Visible title row with a close button. */
  title?: ReactNode;
  full?: boolean;
  role?: 'dialog' | 'menu' | 'listbox' | 'none';
  initialFocus?: 'first' | 'container' | 'none' | RefObject<HTMLElement | null>;
  stepAside?: boolean;
  children: ReactNode;
  bodyClassName?: string;
  /** Rendered instead of the default scroll body (sheets with their own header and footer). */
  raw?: boolean;
  labelledBy?: string;
}

/** Mobile surface for popovers, menus and sheets: slides up, swipe down or tap the scrim to close. */
export function BottomSheet({ open, onClose, label, title, full, role = 'dialog', initialFocus = 'first', stepAside = true, children, bodyClassName, raw, labelledBy }: BottomSheetProps) {
  const presence = usePresence(open, 320);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);

  const close = (o?: { instant?: boolean }) => {
    if (o?.instant) presence.skipExit();
    onClose(o);
  };
  useOverlay({ open: presence.mounted && open, onClose: close, container: panel, trap: true, stepAside, lockScroll: true, initialFocus });

  const onDown = (e: RPointerEvent) => {
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panel.current?.setAttribute('data-dragging', 'true');
  };
  const onMove = (e: RPointerEvent) => {
    if (!drag.current || !panel.current) return;
    const dy = Math.max(0, e.clientY - drag.current.y);
    drag.current.dy = dy;
    panel.current.style.transform = `translateY(${dy}px)`;
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!panel.current || !d) return;
    panel.current.removeAttribute('data-dragging');
    const v = d.dy / Math.max(1, performance.now() - d.t);
    panel.current.style.transform = '';
    if (d.dy > SWIPE_CLOSE_PX || v > SWIPE_CLOSE_VELOCITY) close();
  };

  if (!presence.mounted) return null;
  return (
    <Portal>
      <div className={s.bottomRoot}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- scrim is a pointer affordance; Escape closes from the keyboard */}
        <div className={s.scrim} data-state={presence.state === 'open' ? 'open' : 'closed'} onClick={() => close()} />
        <div
          ref={panel}
          className={`${s.bottomPanel} ${full ? s.full : ''}`}
          data-state={presence.state === 'open' ? 'open' : 'closed'}
          role={role === 'none' ? undefined : role === 'dialog' ? 'dialog' : undefined}
          aria-modal={role === 'dialog' ? true : undefined}
          aria-label={labelledBy ? undefined : label}
          aria-labelledby={labelledBy}
          tabIndex={-1}
        >
          <div className={s.grabber} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-hidden="true" />
          {raw ? (
            children
          ) : (
            <>
              {title && (
                <div className={s.bottomHeader}>
                  <h2>{title}</h2>
                  <IconButton icon="x" label="Close" onClick={() => close()} />
                </div>
              )}
              <div className={`${s.bottomBody} ${bodyClassName ?? ''}`}>{children}</div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
