import { useEffect, useId, useState, type ReactNode } from 'react';
import { Field, describedBy } from './Field';
import { InputBox } from './Input';
import s from './form.module.scss';
import type { Currency } from '@/store/types';
import { currencySymbol } from '@/paper/lib/format';

interface CurrencyFieldProps {
  label: ReactNode;
  /** Minor units (cents). */
  value: number | null;
  onChange: (minor: number | null) => void;
  currency: Currency;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  placeholder?: string;
  onBlur?: () => void;
  id?: string;
  fieldClassName?: string;
}

const toText = (minor: number | null) => {
  if (minor === null) return '';
  const major = minor / 100;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: minor % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(major);
};
const parseMinor = (text: string) => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
};

/** Money in the event currency. Stores minor units; formats on blur. */
export function CurrencyField({ label, value, onChange, currency, help, error, required, placeholder, onBlur, id: idProp, fieldClassName }: CurrencyFieldProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const [text, setText] = useState(toText(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(toText(value));
  }, [value, focused]);

  return (
    <Field id={id} label={label} required={required} help={help} error={error} className={fieldClassName}>
      <InputBox invalid={Boolean(error)} prefix={currencySymbol(currency)}>
        <input
          id={id}
          className={s.input}
          inputMode="decimal"
          autoComplete="off"
          value={text}
          placeholder={placeholder ?? '0'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { help, error })}
          aria-required={required || undefined}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setText(e.target.value);
            const m = parseMinor(e.target.value);
            if (m === null) onChange(null);
            else if (!Number.isNaN(m)) onChange(m);
          }}
          onBlur={() => {
            setFocused(false);
            const m = parseMinor(text);
            const v = m === null || Number.isNaN(m) ? null : m;
            onChange(v);
            setText(toText(v));
            onBlur?.();
          }}
        />
      </InputBox>
    </Field>
  );
}
