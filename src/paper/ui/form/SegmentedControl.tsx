import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { Tooltip } from '../Tooltip';
import s from './form.module.scss';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: IconName;
  disabled?: boolean;
  /** Explains why an option is disabled. */
  reason?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T, e?: { x: number; y: number }) => void;
  label: string;
  size?: 'md' | 'sm';
  fullWidth?: boolean;
  className?: string;
}

/** A radio group drawn as segments. The thumb slides between options (240 ms). */
export function SegmentedControl<T extends string>({ options, value, onChange, label, size = 'md', fullWidth, className }: SegmentedControlProps<T>) {
  const root = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const animate = useRef(false);

  useLayoutEffect(() => {
    const measure = () => {
      const el = root.current?.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!el) return setThumb(null);
      setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (root.current) ro.observe(root.current);
    return () => ro.disconnect();
  }, [value, options.length]);

  useLayoutEffect(() => {
    if (!thumb) return;
    const id = requestAnimationFrame(() => (animate.current = true));
    return () => cancelAnimationFrame(id);
  }, [thumb]);

  const enabled = options.filter((o) => !o.disabled);
  const move = (dir: 1 | -1 | 'home' | 'end') => {
    const i = enabled.findIndex((o) => o.value === value);
    let next = i;
    if (dir === 'home') next = 0;
    else if (dir === 'end') next = enabled.length - 1;
    else next = (i + dir + enabled.length) % enabled.length;
    const opt = enabled[next];
    if (!opt) return;
    onChange(opt.value);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const map: Record<string, 1 | -1 | 'home' | 'end'> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'home', End: 'end' };
    const dir = map[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    move(dir);
  };

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the radios inside carry a roving tabindex
    <div
      ref={root}
      role="radiogroup"
      aria-label={label}
      className={[s.segmented, size === 'sm' ? s.smSize : '', fullWidth ? s.full : '', className ?? ''].join(' ')}
      onKeyDown={onKeyDown}
    >
      {thumb && <span className={`${s.thumb} ${animate.current ? s.animate : ''}`} style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }} aria-hidden="true" />}
      {options.map((o) => {
        const checked = o.value === value;
        const btn = (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={o.disabled}
            className={s.segment}
            onClick={(e) => onChange(o.value, { x: e.clientX, y: e.clientY })}
          >
            {o.icon && <Icon name={o.icon} size={size === 'sm' ? 14 : 16} />}
            {o.label}
          </button>
        );
        return o.disabled && o.reason ? (
          <Tooltip key={o.value} content={o.reason}>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a disabled option is wrapped in a focusable span so keyboard users can read why (05, component anatomy) */}
            <span tabIndex={0} style={{ display: 'inline-flex' }}>
              {btn}
            </span>
          </Tooltip>
        ) : (
          btn
        );
      })}
    </div>
  );
}
