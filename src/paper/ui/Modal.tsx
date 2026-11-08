import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { Portal } from './overlay/Portal';
import { useOverlay } from './overlay/useOverlay';
import { usePresence } from '@/paper/hooks/usePresence';
import { IconButton } from './IconButton';
import o from './overlay/overlay.module.scss';
import s from './sheet.module.scss';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
  initialFocus?: 'first' | 'container' | RefObject<HTMLElement | null>;
  role?: 'dialog' | 'alertdialog';
  describedBy?: string;
  /** Hide the close button (confirmations close with their own buttons). */
  hideClose?: boolean;
  bodyClassName?: string;
}

/** Centered dialog: scales up from 0.96 over 320 ms; leaves faster to 0.98. */
export function Modal({ open, onClose, title, width, footer, children, initialFocus = 'first', role = 'dialog', describedBy, hideClose, bodyClassName }: ModalProps) {
  const presence = usePresence(open, 200);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlay({
    open: presence.mounted && open,
    onClose: (c) => {
      if (c?.instant) presence.skipExit();
      onClose();
    },
    container: panel,
    trap: true,
    stepAside: true,
    lockScroll: true,
    initialFocus,
  });
  if (!presence.mounted) return null;
  const state = presence.state === 'open' ? 'open' : presence.state === 'opening' ? 'opening' : 'closed';
  return (
    <Portal>
      <div className={s.modalRoot}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- scrim is a pointer affordance; Escape closes from the keyboard */}
        <div className={o.scrim} data-state={state === 'open' ? 'open' : 'closed'} onClick={onClose} />
        <div
          ref={panel}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          tabIndex={-1}
          className={s.modal}
          data-state={state}
          style={width ? { width: `min(${width}px, 100%)` } : undefined}
        >
          <div className={s.modalHeader}>
            <h3 id={titleId} className={s.modalTitle}>
              {title}
            </h3>
            {!hideClose && <IconButton icon="x" label="Close" onClick={onClose} />}
          </div>
          <div className={`${s.modalBody} ${bodyClassName ?? ''}`}>{children}</div>
          {footer && <div className={s.modalFooter}>{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}
