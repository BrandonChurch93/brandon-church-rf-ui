import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import { Tooltip } from './Tooltip';
import type { Placement } from './overlay/position';
import s from './iconButton.module.scss';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Accessible name, also shown as a tooltip after 400 ms. */
  label: string;
  variant?: 'ghost' | 'subtle';
  size?: 36 | 30;
  tooltip?: boolean;
  tooltipPlacement?: Placement;
  iconSize?: number;
  /** Shown instead of the label in the tooltip (e.g. "Copied"). */
  tooltipContent?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', size = 36, tooltip = true, tooltipPlacement = 'top', iconSize, tooltipContent, className, type = 'button', ...rest },
  ref,
) {
  const btn = (
    <button ref={ref} type={type} aria-label={label} className={[s.iconButton, s[variant], size === 30 ? s.sm : s.md, className ?? ''].join(' ')} {...rest}>
      <Icon name={icon} size={iconSize ?? (size === 30 ? 16 : 18)} />
    </button>
  );
  if (!tooltip) return btn;
  return (
    <Tooltip content={tooltipContent ?? label} placement={tooltipPlacement} describe={false}>
      {btn}
    </Tooltip>
  );
});
