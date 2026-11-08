import { useEffect, useId, useState, type ReactNode } from 'react';
import { Field, describedBy } from './Field';
import { InputBox } from './Input';
import { Icon } from '../Icon';
import s from './form.module.scss';

interface NumberFieldProps {
  label: ReactNode;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  suffix?: ReactNode;
  onBlur?: () => void;
  id?: string;
  fieldClassName?: string;
  size?: 'md' | 'sm';
}

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const parse = (text: string) => {
  const cleaned = text.replace(/[,\s]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : NaN;
};

/** Whole numbers with a stepper. Formats with thousands separators on blur. */
export function NumberField({ label, value, onChange, min, max, step = 1, placeholder, help, error, required, disabled, suffix, onBlur, id: idProp, fieldClassName, size }: NumberFieldProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const [text, setText] = useState(value === null ? '' : fmt.format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(value === null ? '' : fmt.format(value));
  }, [value, focused]);

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const bump = (dir: 1 | -1) => {
    const base = value ?? (dir === 1 ? (min ?? 0) - step : (min ?? 0) + step);
    const next = clamp(base + dir * step);
    onChange(next);
    setText(focused ? String(next) : fmt.format(next));
  };

  return (
    <Field id={id} label={label} required={required} help={help} error={error} className={fieldClassName}>
      <InputBox
        invalid={Boolean(error)}
        disabled={disabled}
        size={size}
        suffix={
          <>
            {suffix && <span className={s.affix}>{suffix}</span>}
            <button type="button" tabIndex={-1} className={s.stepper} aria-label="Decrease" disabled={disabled || (value !== null && min !== undefined && value <= min)} onClick={() => bump(-1)}>
              <Icon name="minus" size={14} />
            </button>
            <button type="button" tabIndex={-1} className={s.stepper} aria-label="Increase" disabled={disabled || (value !== null && max !== undefined && value >= max)} onClick={() => bump(1)}>
              <Icon name="plus" size={14} />
            </button>
          </>
        }
      >
        <input
          id={id}
          className={s.input}
          inputMode="numeric"
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { help, error })}
          aria-required={required || undefined}
          onFocus={() => {
            setFocused(true);
            setText(value === null ? '' : String(value));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = parse(e.target.value);
            if (n === null) onChange(null);
            else if (!Number.isNaN(n)) onChange(n);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              bump(1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              bump(-1);
            }
          }}
          onBlur={() => {
            setFocused(false);
            const n = parse(text);
            if (n === null || Number.isNaN(n)) {
              onChange(null);
              setText('');
            } else {
              const c = clamp(n);
              onChange(c);
              setText(fmt.format(c));
            }
            onBlur?.();
          }}
        />
      </InputBox>
    </Field>
  );
}
