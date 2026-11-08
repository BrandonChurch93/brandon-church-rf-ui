import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';
import { initials as toInitials } from '@/paper/lib/format';
import { SWATCHES, type Swatch } from '@/store/types';
import s from './display.module.scss';

export type Tone = 'neutral' | 'accent' | 'berry' | 'success' | 'warning' | 'danger' | 'muted' | 'outline';

// ---------- Chip ----------
interface ChipProps {
  tone?: Tone;
  /** A dot before the label (status chips). */
  dot?: boolean;
  /** A swatch-colored dot (type chips, tracks). */
  swatch?: Swatch | 'silver';
  icon?: IconName;
  children: ReactNode;
  className?: string;
  title?: string;
}
export function Chip({ tone = 'neutral', dot, swatch, icon, children, className }: ChipProps) {
  return (
    <span className={`${s.chip} ${s[tone]} ${className ?? ''}`}>
      {dot && <i className={s.chipDot} aria-hidden="true" />}
      {swatch && <i className={s.swatchDot} style={{ background: `var(--sw-${swatch})` }} aria-hidden="true" />}
      {icon && <Icon name={icon} size={12} />}
      <span>{children}</span>
    </span>
  );
}

/** A toggle chip that opens a filter popover. Shows its count and a clear button when active. */
export const FilterChip = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string; count?: number; onClear?: () => void }>(function FilterChip(
  { label, count = 0, onClear, ...rest },
  ref,
) {
  const active = count > 0;
  return (
    <span className={s.filterGroup} data-active={active}>
      <button ref={ref} type="button" className={s.filterChip} data-active={active} aria-label={active ? `${label} filter, ${count} selected` : `${label} filter`} {...rest}>
        {!active && <Icon name="plus" size={14} />}
        {active ? `${label} · ${count}` : label}
        <Icon name="chevron-down" size={14} />
      </button>
      {active && onClear && (
        <button type="button" className={s.filterClear} aria-label={`Clear ${label} filter`} onClick={onClear}>
          <Icon name="x" size={14} />
        </button>
      )}
    </span>
  );
});

export function RemovableChip({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <span className={s.removable}>
      <span>{children}</span>
      <button type="button" aria-label={removeLabel} onClick={onRemove}>
        <Icon name="x" size={12} />
      </button>
    </span>
  );
}

// ---------- Badge ----------
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent'; className?: string }) {
  return <span className={`${s.badge} ${s[tone]} ${className ?? ''}`}>{children}</span>;
}

// ---------- Avatar ----------
export function swatchFor(name: string): Swatch {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SWATCHES[h % SWATCHES.length];
}

interface AvatarProps {
  name: string;
  size?: 24 | 28 | 32 | 40 | 48;
  /** The signed-in user: accent fill (the one exception to the swatch rule). */
  self?: boolean;
  swatch?: Swatch;
  className?: string;
  /** Decorative by default; pass a label when the avatar stands alone. */
  label?: string;
  /** Overrides the initials derived from the name. */
  initials?: string;
}
export function Avatar({ name, size = 32, self, swatch, className, label, initials }: AvatarProps) {
  const sw = swatch ?? swatchFor(name);
  const style = self ? { width: size, height: size, fontSize: size * 0.38 } : { width: size, height: size, fontSize: size * 0.38, background: `var(--sw-${sw}-soft)`, color: `var(--sw-${sw}-ink)` };
  return (
    <span className={`${s.avatar} ${self ? s.self : ''} ${className ?? ''}`} style={style} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {initials ?? toInitials(name)}
    </span>
  );
}

// ---------- Status dot ----------
const DOT_COLOR: Record<string, string> = { success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', neutral: 'var(--muted)', accent: 'var(--accent)', berry: 'var(--berry)' };
export function StatusDot({ tone, children, className }: { tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'berry'; children?: ReactNode; className?: string }) {
  return (
    <span className={`${s.status} ${className ?? ''}`}>
      <i className={s.dot} style={{ background: DOT_COLOR[tone] }} aria-hidden="true" />
      {children}
    </span>
  );
}

// ---------- Progress bar ----------
interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  variant?: 'solid' | 'gradient' | 'warning' | 'danger';
  thin?: boolean;
  className?: string;
  fillRef?: React.Ref<HTMLDivElement>;
}
export function ProgressBar({ value, max, label, variant = 'solid', thin, className, fillRef }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`${s.progress} ${thin ? s.thin : ''} ${className ?? ''}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div ref={fillRef} className={`${s.progressFill} ${variant === 'solid' ? '' : s[variant]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------- Empty state ----------
interface EmptyStateProps {
  icon: IconName;
  title: string;
  body: string;
  action?: { label: string; icon?: IconName; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  compact?: boolean;
  className?: string;
}
export function EmptyState({ icon, title, body, action, secondary, compact, className }: EmptyStateProps) {
  return (
    <div className={`${s.empty} ${compact ? s.compact : ''} ${className ?? ''}`}>
      <span className={s.emptyIcon}>
        <Icon name={icon} size={20} />
      </span>
      <h3 className={s.emptyTitle}>{title}</h3>
      <p className={s.emptyBody}>{body}</p>
      {(action || secondary) && (
        <div className={s.emptyActions}>
          {action && (
            <Button variant="primary" icon={action.icon} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondary && (
            <Button variant="ghost" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Divider ----------
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (label)
    return (
      <div className={`${s.dividerLabel} ${className ?? ''}`} role="separator">
        {label}
      </div>
    );
  return <hr className={`${s.divider} ${className ?? ''}`} />;
}

/** A `micro` muted label with a divider under it, used for sections inside sheets. */
export function SectionLabel({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className={s.sectionLabel}>
      <h4 id={id}>{children}</h4>
      {action}
    </div>
  );
}

// ---------- Drag handle ----------
export const DragHandle = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string }>(function DragHandle({ label, className, ...rest }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} className={`${s.handle} ${className ?? ''}`} {...rest}>
      <Icon name="grip" size={16} />
    </button>
  );
});

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
