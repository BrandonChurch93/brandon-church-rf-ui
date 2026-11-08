import type { ReactNode } from 'react';
import { Select, type SelectOption } from './Select';
import { formatTime } from '@/paper/lib/format';

interface TimeFieldProps {
  label: ReactNode;
  /** Minutes since midnight (stored 24 h, shown 12 h). */
  value: number | null;
  onChange: (minutes: number) => void;
  /** Range in minutes, inclusive start, exclusive end. */
  from: number;
  to: number;
  step?: number;
  error?: string | null;
  help?: ReactNode;
  required?: boolean;
  fieldClassName?: string;
}

/** Times in 15 minute steps within a range, as a listbox with type-ahead. */
export function TimeField({ label, value, onChange, from, to, step = 15, error, help, required, fieldClassName }: TimeFieldProps) {
  const options: SelectOption<string>[] = [];
  for (let t = from; t < to; t += step) options.push({ value: String(t), label: formatTime(t) });
  if (value !== null && !options.some((o) => o.value === String(value))) options.unshift({ value: String(value), label: formatTime(value) });
  return (
    <Select
      label={label}
      value={value === null ? null : String(value)}
      onChange={(v) => onChange(Number(v))}
      options={options}
      error={error}
      help={help}
      required={required}
      fieldClassName={fieldClassName}
      placeholder="Choose a time"
    />
  );
}
