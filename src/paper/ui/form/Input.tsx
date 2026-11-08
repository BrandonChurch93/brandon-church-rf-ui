import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Field, describedBy } from './Field';
import s from './form.module.scss';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label: ReactNode;
  help?: ReactNode;
  error?: string | null;
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: 'md' | 'sm';
  mono?: boolean;
  labelHidden?: boolean;
  fieldClassName?: string;
  maxCount?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, help, error, prefix, suffix, size = 'md', mono, required, labelHidden, fieldClassName, id: idProp, disabled, maxCount, value, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  const count = maxCount !== undefined ? String(value ?? '').length : undefined;
  return (
    <Field
      id={id}
      label={label}
      required={required}
      help={help}
      error={error}
      labelHidden={labelHidden}
      className={fieldClassName}
      counter={maxCount !== undefined ? { value: count ?? 0, max: maxCount } : undefined}
    >
      <InputBox invalid={Boolean(error)} disabled={disabled} size={size} mono={mono} prefix={prefix} suffix={suffix}>
        <input
          ref={ref}
          id={id}
          className={s.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { help, error })}
          aria-required={required || undefined}
          disabled={disabled}
          value={value}
          {...rest}
        />
      </InputBox>
    </Field>
  );
});

interface BoxProps {
  invalid?: boolean;
  disabled?: boolean;
  size?: 'md' | 'sm';
  mono?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** The bordered box that holds an input and its prefix and suffix. */
export function InputBox({ invalid, disabled, size = 'md', mono, prefix, suffix, children, className }: BoxProps) {
  return (
    <div
      className={[s.box, size === 'sm' ? s.sm : '', mono ? s.mono : '', className ?? ''].join(' ')}
      data-invalid={invalid ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
    >
      {prefix !== undefined && <span className={s.affix}>{prefix}</span>}
      {children}
      {suffix !== undefined && <span className={s.affixButtons}>{suffix}</span>}
    </div>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  help?: ReactNode;
  error?: string | null;
  maxCount?: number;
  fieldClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, help, error, maxCount, required, id: idProp, value, fieldClassName, rows = 4, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <Field
      id={id}
      label={label}
      required={required}
      help={help}
      error={error}
      className={fieldClassName}
      counter={maxCount !== undefined ? { value: String(value ?? '').length, max: maxCount } : undefined}
    >
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={s.textarea}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { help, error })}
        aria-required={required || undefined}
        {...rest}
      />
    </Field>
  );
});
