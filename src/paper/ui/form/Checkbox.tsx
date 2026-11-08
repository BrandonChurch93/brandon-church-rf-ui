import { useEffect, useRef, type ReactNode } from 'react';
import s from './form.module.scss';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  /** Required when there is no visible label (table row selection). */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
}

/** A native checkbox, custom drawn, with an indeterminate state for bulk selection. */
export function Checkbox({ checked, onChange, indeterminate, label, description, ariaLabel, disabled, className, name }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <label className={`${s.check} ${className ?? ''}`} data-disabled={disabled ? 'true' : undefined}>
      <span className={s.checkControl}>
        <input
          ref={ref}
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          aria-label={label ? undefined : ariaLabel}
          aria-checked={indeterminate ? 'mixed' : checked}
          onChange={(e) => onChange(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
        <span className={s.checkBox} aria-hidden="true">
          {indeterminate ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 5h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1.8 5.2 4 7.3 8.3 2.8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </span>
      {label && (
        <span className={s.checkText}>
          {label}
          {description && <span className={s.checkDescription}>{description}</span>}
        </span>
      )}
    </label>
  );
}

interface RadioProps {
  checked: boolean;
  onChange: () => void;
  label: ReactNode;
  description?: ReactNode;
  name: string;
  value: string;
  disabled?: boolean;
}

export function Radio({ checked, onChange, label, description, name, value, disabled }: RadioProps) {
  return (
    <label className={s.check} data-disabled={disabled ? 'true' : undefined}>
      <span className={s.checkControl}>
        <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} />
        <span className={s.radioDot} aria-hidden="true" />
      </span>
      <span className={s.checkText}>
        {label}
        {description && <span className={s.checkDescription}>{description}</span>}
      </span>
    </label>
  );
}
