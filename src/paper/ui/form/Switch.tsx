import { useId, type ReactNode } from 'react';
import s from './form.module.scss';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  /** Required when there is no visible label. */
  ariaLabel?: string;
  labelPosition?: 'start' | 'end';
  disabled?: boolean;
  describedBy?: string;
  className?: string;
  id?: string;
}

/** 36 x 20 with a 16 px knob. The knob slides in 120 ms, the track color changes in 200 ms. */
export function Switch({ checked, onChange, label, ariaLabel, labelPosition = 'end', disabled, describedBy, className, id: idProp }: SwitchProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={describedBy}
      disabled={disabled}
      className={s.switch}
      onClick={() => onChange(!checked)}
    />
  );
  if (!label) return <span className={className}>{control}</span>;
  return (
    <span className={`${s.switchRow} ${className ?? ''}`} data-disabled={disabled ? 'true' : undefined}>
      {labelPosition === 'start' && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the label text is a larger pointer target; the switch itself is the keyboard control
        <span id={`${id}-label`} className={s.switchLabel} onClick={() => !disabled && onChange(!checked)}>
          {label}
        </span>
      )}
      {control}
      {labelPosition === 'end' && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- see above
        <span id={`${id}-label`} className={s.switchLabel} onClick={() => !disabled && onChange(!checked)}>
          {label}
        </span>
      )}
    </span>
  );
}
