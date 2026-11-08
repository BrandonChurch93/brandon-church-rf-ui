import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import s from './form.module.scss';

export interface FieldProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  help?: ReactNode;
  error?: string | null;
  counter?: { value: number; max: number };
  /** Hide the visible label (only for controls with an adjacent visible label, e.g. table filters). */
  labelHidden?: boolean;
  className?: string;
  children: ReactNode;
}

export const helpId = (id: string) => `${id}-help`;
export const errorId = (id: string) => `${id}-error`;

/** Label above, control, then help or error below. The error replaces the help text. */
export function Field({ id, label, required, help, error, counter, labelHidden, className, children }: FieldProps) {
  return (
    <div className={`${s.field} ${className ?? ''}`}>
      <div className={`${s.labelRow} ${labelHidden ? 'sr-only' : ''}`}>
        <label className={s.label} htmlFor={id}>
          {label}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        {required && (
          <span className={s.required} aria-hidden="true">
            Required
          </span>
        )}
      </div>
      {children}
      {(help || error || counter) && (
        <div className={s.helpRow}>
          {error ? (
            <span id={errorId(id)} className={s.error} role="alert">
              <Icon name="circle-alert" size={14} />
              {error}
            </span>
          ) : help ? (
            <span id={helpId(id)}>{help}</span>
          ) : null}
          {counter && (
            <span className={s.counter} data-over={counter.value > counter.max} aria-live="polite">
              {counter.value} / {counter.max}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function describedBy(id: string, opts: { help?: unknown; error?: unknown }) {
  if (opts.error) return errorId(id);
  if (opts.help) return helpId(id);
  return undefined;
}
