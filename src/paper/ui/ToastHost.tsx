import { useEffect, useRef } from 'react';
import { useToasts, type Toast } from './toastStore';
import { useFlipList } from '@/motion/flip';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Button } from './Button';
import s from './toast.module.scss';

/** Bottom left of the body on desktop, above the tab bar and the pill on mobile. */
export function ToastHost() {
  const toasts = useToasts((st) => st.toasts);
  const paused = useToasts((st) => st.paused);
  const setPaused = useToasts((st) => st.setPaused);
  const dismiss = useToasts((st) => st.dismiss);
  const list = useRef<HTMLDivElement>(null);
  useFlipList(list, toasts.map((t) => t.id).join(','), { duration: 0.32, ease: 'power3.out', enter: false });

  // One timer for the soonest expiry; recomputed whenever the list or pause state changes.
  useEffect(() => {
    if (paused) return;
    const now = performance.now();
    const timed = toasts.filter((t) => t.remaining !== null && !t.leaving);
    if (!timed.length) return;
    const next = Math.min(...timed.map((t) => (t.remaining ?? 0) - (now - t.startedAt)));
    const timer = window.setTimeout(() => {
      const t2 = performance.now();
      timed.forEach((t) => {
        if ((t.remaining ?? 0) - (t2 - t.startedAt) <= 10) dismiss(t.id);
      });
    }, Math.max(0, next));
    return () => window.clearTimeout(timer);
  }, [toasts, paused, dismiss]);

  return (
    <section
      className={s.host}
      aria-label="Notifications"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div ref={list} className={s.list}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} paused={paused} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </section>
  );
}

function ToastItem({ toast, paused, onDismiss }: { toast: Toast; paused: boolean; onDismiss: () => void }) {
  const icon = toast.tone === 'success' ? 'circle-check' : toast.tone === 'danger' ? 'triangle-alert' : 'info';
  return (
    <div className={s.toast} data-flip-id={toast.id} data-tone={toast.tone} data-leaving={toast.leaving ? 'true' : undefined} data-paused={paused ? 'true' : undefined}>
      <Icon name={icon} size={18} className={s.icon} />
      <p className={s.message}>{toast.message}</p>
      {toast.action && (
        <Button
          size="sm"
          variant="ghost"
          aria-label={toast.action.ariaLabel}
          className={s.action}
          onClick={() => {
            onDismiss();
            toast.action!.run();
          }}
        >
          {toast.action.label}
        </Button>
      )}
      <IconButton icon="x" label="Dismiss" size={30} tooltip={false} onClick={onDismiss} />
      {toast.undo && toast.duration && <span className={s.progress} style={{ animationDuration: `${toast.duration}ms` }} aria-hidden="true" data-keep-motion />}
    </div>
  );
}
