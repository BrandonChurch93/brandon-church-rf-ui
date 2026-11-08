import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import s from './tabs.module.scss';

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  idPrefix: string;
  className?: string;
}

/** Underline tabs with a sliding indicator. Arrow keys, Home and End move between tabs. */
export function Tabs<T extends string>({ items, value, onChange, label, idPrefix, className }: TabsProps<T>) {
  const list = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => {
    const measure = () => {
      const el = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (el) setBar({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
    };
  }, [value, items.length]);

  const onKey = (e: KeyboardEvent) => {
    const i = items.findIndex((t) => t.value === value);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = items.length - 1;
    if (n < 0) return;
    e.preventDefault();
    onChange(items[n].value);
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
  };

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the tabs carry a roving tabindex
    <div ref={list} role="tablist" aria-label={label} className={`${s.tabs} ${className ?? ''}`} onKeyDown={onKey}>
      {items.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${t.value}`}
          aria-selected={t.value === value}
          aria-controls={`${idPrefix}-panel`}
          tabIndex={t.value === value ? 0 : -1}
          className={s.tab}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
      {bar && <span className={`${s.bar} ${animate ? s.animate : ''}`} style={{ transform: `translateX(${bar.x}px)`, width: bar.w }} aria-hidden="true" />}
    </div>
  );
}
