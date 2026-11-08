import { forwardRef, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Kbd } from './Kbd';
import s from './search.module.scss';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  /** Debounce in ms before onChange fires (the field updates immediately). */
  debounce?: number;
  className?: string;
  autoFocus?: boolean;
  size?: 'md' | 'lg';
}

/** Search input with an icon and a clear button. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({ value, onChange, label, placeholder, debounce = 0, className, autoFocus, size = 'md' }, ref) {
  const [text, setText] = useState(value);
  const timer = useRef<number | null>(null);
  const inner = useRef<HTMLInputElement | null>(null);
  useEffect(() => setText(value), [value]);
  const emit = (v: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!debounce) return onChange(v);
    timer.current = window.setTimeout(() => onChange(v), debounce);
  };
  return (
    <div className={`${s.search} ${size === 'lg' ? s.lg : ''} ${className ?? ''}`}>
      <Icon name="search" size={16} className={s.icon} />
      <input
        ref={(el) => {
          inner.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        type="search"
        className={s.input}
        aria-label={label}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => {
          setText(e.target.value);
          emit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && text) {
            e.preventDefault();
            e.stopPropagation();
            setText('');
            onChange('');
          }
        }}
      />
      {text && (
        <button
          type="button"
          className={s.clear}
          aria-label="Clear search"
          onClick={() => {
            setText('');
            onChange('');
            inner.current?.focus();
          }}
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
});

/** Looks like a search field; opens the command palette. */
export const SearchOpener = forwardRef<HTMLButtonElement, { onOpen: () => void; className?: string }>(function SearchOpener({ onOpen, className }, ref) {
  return (
    <button ref={ref} type="button" className={`${s.search} ${s.opener} ${className ?? ''}`} onClick={onOpen} aria-keyshortcuts="Meta+K Control+K">
      <Icon name="search" size={16} className={s.icon} />
      <span className={s.placeholder}>
        Search<span className="sr-only"> pages, actions, attendees and codes</span>
      </span>
      <span aria-hidden="true">
        <Kbd mod>K</Kbd>
      </span>
    </button>
  );
});
