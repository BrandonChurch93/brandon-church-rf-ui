import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from './Icon';
import { flash } from '@/motion/flip';
import s from './inlineEdit.module.scss';

interface InlineEditProps {
  value: string;
  onCommit: (value: string) => void;
  /** Accessible name of the thing being edited, e.g. "Event name". */
  label: string;
  /** Message when empty, e.g. "Event name is required". */
  requiredMessage?: string;
  maxLength?: number;
  className?: string;
  /** Controlled editing (a menu's Rename opens it). */
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  as?: 'span' | 'h2' | 'h3';
  style?: CSSProperties;
}

/** Text that turns into an input in place: Enter or blur commits, Escape cancels, empty is invalid. */
export function InlineEdit({ value, onCommit, label, requiredMessage, maxLength = 120, className, editing: editingProp, onEditingChange, style }: InlineEditProps) {
  const [editingState, setEditingState] = useState(false);
  const editing = editingProp ?? editingState;
  const setEditing = (v: boolean) => {
    setEditingState(v);
    onEditingChange?.(v);
  };
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const display = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);
  useLayoutEffect(() => {
    if (editing) {
      setDraft(value);
      cancelled.current = false;
      requestAnimationFrame(() => {
        input.current?.focus();
        input.current?.select();
      });
    }
    // Only when entering edit mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const commit = () => {
    if (cancelled.current) return;
    const next = draft.trim();
    if (!next) {
      setError(requiredMessage ?? `${label} is required`);
      requestAnimationFrame(() => input.current?.focus());
      return;
    }
    setError(null);
    setEditing(false);
    if (next !== value) {
      onCommit(next);
      requestAnimationFrame(() => flash(wrap.current, 'border'));
    }
    requestAnimationFrame(() => display.current?.focus({ preventScroll: true }));
  };
  const cancel = () => {
    cancelled.current = true;
    setError(null);
    setEditing(false);
    setDraft(value);
    requestAnimationFrame(() => display.current?.focus({ preventScroll: true }));
  };

  return (
    <span ref={wrap} className={`${s.wrap} ${className ?? ''}`} style={style} data-editing={editing || undefined}>
      {editing ? (
        <>
          <input
            ref={input}
            className={s.input}
            value={draft}
            maxLength={maxLength}
            aria-label={label}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${label}-inline-error` : undefined}
            data-invalid={error ? 'true' : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error && e.target.value.trim()) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cancel();
              }
            }}
            onBlur={commit}
          />
          {error && (
            <span id={`${label}-inline-error`} className={s.error} role="alert">
              {error}
            </span>
          )}
        </>
      ) : (
        <button ref={display} type="button" className={s.display} aria-label={`${label}: ${value}. Editable, press Enter to edit`} onClick={() => setEditing(true)}>
          <span className={s.text}>{value}</span>
          <Icon name="pencil" size={16} className={s.pencil} />
        </button>
      )}
    </span>
  );
}
