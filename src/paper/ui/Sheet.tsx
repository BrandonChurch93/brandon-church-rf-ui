import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { Portal } from './overlay/Portal';
import { useOverlay } from './overlay/useOverlay';
import { BottomSheet } from './overlay/BottomSheet';
import { usePresence } from '@/paper/hooks/usePresence';
import { useBreakpoint } from '@/paper/hooks/useMediaQuery';
import { IconButton } from './IconButton';
import { confirmDialog } from './confirmStore';
import o from './overlay/overlay.module.scss';
import s from './sheet.module.scss';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Plain-text title for the dialog's accessible name when `title` is an editable control. */
  titleText?: string;
  subtitle?: ReactNode;
  wide?: boolean;
  /** When true, closing asks "Discard changes?" first. */
  dirty?: boolean;
  footer?: ReactNode;
  headerExtra?: ReactNode;
  /** Content between the header and the scrolling body (chips under an attendee name). */
  headerBelow?: ReactNode;
  initialFocus?: 'first' | 'container' | RefObject<HTMLElement | null>;
  children: ReactNode;
  bodyRef?: RefObject<HTMLDivElement | null>;
}

/** Side sheet on desktop (right, 480 or 560), full-height bottom sheet below 900 px. */
export function Sheet(props: SheetProps) {
  const { isMobile } = useBreakpoint();
  const titleId = useId();
  const guard = useCloseGuard(props.dirty, props.onClose);

  const header = (
    <div className={s.header}>
      <div className={s.headerText}>
        <h3 id={titleId} className={s.title}>
          {props.title}
        </h3>
        {props.subtitle && <div className={s.subtitle}>{props.subtitle}</div>}
      </div>
      {props.headerExtra}
      <IconButton icon="x" label="Close" onClick={() => guard()} />
    </div>
  );
  const content = (
    <>
      {header}
      {props.headerBelow}
      <div ref={props.bodyRef} className={s.body}>
        {props.children}
      </div>
      {props.footer && <div className={s.footer}>{props.footer}</div>}
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={props.open} onClose={(c) => (c?.instant ? props.onClose() : guard())} label={props.titleText ?? 'Details'} labelledBy={props.titleText ? undefined : titleId} full raw initialFocus={props.initialFocus ?? 'container'}>
        {content}
      </BottomSheet>
    );
  }
  return <SidePanel {...props} guard={guard} titleId={titleId} content={content} />;
}

function SidePanel({ open, onClose, wide, initialFocus, guard, titleId, titleText, content }: SheetProps & { guard: () => void; titleId: string; content: ReactNode }) {
  const presence = usePresence(open, 320);
  const panel = useRef<HTMLDivElement>(null);
  useOverlay({
    open: presence.mounted && open,
    onClose: (c) => {
      if (c?.instant) {
        presence.skipExit();
        onClose();
      } else guard();
    },
    container: panel,
    trap: true,
    stepAside: true,
    lockScroll: true,
    initialFocus: initialFocus ?? 'container',
  });
  if (!presence.mounted) return null;
  const state = presence.state === 'open' ? 'open' : presence.state === 'opening' ? 'opening' : 'closed';
  return (
    <Portal>
      <div className={s.root}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- scrim is a pointer affordance; Escape and the close button cover the keyboard */}
        <div className={o.scrim} data-state={state === 'open' ? 'open' : 'closed'} onClick={() => guard()} />
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleText ? undefined : titleId}
          aria-label={titleText}
          tabIndex={-1}
          className={`${s.panel} ${wide ? s.wide : ''}`}
          data-state={state}
        >
          {content}
        </div>
      </div>
    </Portal>
  );
}

/** Returns a close function that confirms first when there are unsaved changes. */
export function useCloseGuard(dirty: boolean | undefined, onClose: () => void) {
  const asking = useRef(false);
  return async () => {
    if (!dirty) return onClose();
    if (asking.current) return;
    asking.current = true;
    const discard = await confirmDialog({
      title: 'Discard changes?',
      body: 'Your edits in this panel have not been saved.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      danger: true,
    });
    asking.current = false;
    if (discard) onClose();
  };
}
