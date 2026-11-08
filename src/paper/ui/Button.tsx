import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';
import s from './button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  /** Shows a check in place of the label for a moment after a save (the success morph). */
  success?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, trailingIcon, loading, success, fullWidth, className, children, onClick, type = 'button', disabled, ...rest },
  ref,
) {
  const iconSize = size === 'sm' ? 16 : 18;
  const busy = loading || success;
  return (
    <button
      ref={ref}
      type={type}
      className={[s.button, s[variant], s[size], fullWidth ? s.full : '', busy ? s.busy : '', className ?? ''].join(' ')}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={busy || undefined}
      onClick={(e) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...rest}
    >
      <span className={s.content} data-hidden={success ? 'true' : undefined}>
        {loading ? <Spinner size={iconSize - 2} /> : icon ? <Icon name={icon} size={iconSize} /> : null}
        {children !== undefined && <span className={s.label}>{children}</span>}
        {trailingIcon && !loading && <Icon name={trailingIcon} size={iconSize} />}
      </span>
      <span className={s.check} data-shown={success ? 'true' : undefined} aria-hidden={!success}>
        <Icon name="check" size={iconSize} strokeWidth={2.25} />
        {success && <span className="sr-only">Saved</span>}
      </span>
    </button>
  );
});

/** An anchor styled as a button (external links in the About panel). */
export function ButtonLink({ variant = 'secondary', size = 'md', icon, trailingIcon, children, className, ...rest }: Omit<ButtonProps, 'loading' | 'success'> & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const iconSize = size === 'sm' ? 16 : 18;
  return (
    <a className={[s.button, s[variant], s[size], className ?? ''].join(' ')} {...rest}>
      <span className={s.content}>
        {icon && <Icon name={icon} size={iconSize} />}
        {children !== undefined && <span className={s.label}>{children}</span>}
        {trailingIcon && <Icon name={trailingIcon} size={iconSize} />}
      </span>
    </a>
  );
}
