import type { ReactNode } from 'react';
import { Tooltip } from './Tooltip';
import type { Placement } from './overlay/position';
import s from './disabledReason.module.scss';

/**
 * A disabled control that needs explaining is wrapped in a focusable span that carries the tooltip,
 * so keyboard users can reach the reason (05, Component anatomy).
 */
export function DisabledReason({ reason, children, placement = 'top', label }: { reason: string; children: ReactNode; placement?: Placement; label?: string }) {
  return (
    <Tooltip content={reason} placement={placement}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- intentional: the reason must be reachable from the keyboard */}
      <span tabIndex={0} role="group" aria-label={label} className={s.reason}>
        {children}
      </span>
    </Tooltip>
  );
}
