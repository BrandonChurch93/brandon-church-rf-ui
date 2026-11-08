/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- options use aria-activedescendant; keyboard handling lives on the combobox (WAI-ARIA APG listbox pattern) */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Field, describedBy } from './Field';
import { Popover } from '../overlay/Popover';
import { Icon } from '../Icon';
import { useBreakpoint } from '@/paper/hooks/useMediaQuery';
import s from './listbox.module.scss';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  /** Right-aligned detail such as a price. */
  hint?: string;
  leading?: ReactNode;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  label: ReactNode;
  /** Accessible label text when `label` is not plain text. */
  value: T | null;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  size?: 'md' | 'sm';
  labelHidden?: boolean;
  fieldClassName?: string;
  id?: string;
  onBlur?: () => void;
}

const TYPEAHEAD_MS = 500;

/** Select-only combobox (WAI-ARIA APG): arrows, type-ahead, Enter, Escape. A bottom sheet on mobile. */
export function Select<T extends string>({ label, value, onChange, options, placeholder = 'Choose', help, error, required, disabled, size = 'md', labelHidden, fieldClassName, id: idProp, onBlur }: SelectProps<T>) {
  const auto = useId();
  const id = idProp ?? auto;
  const listId = `${id}-list`;
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const typed = useRef({ text: '', at: 0 });
  const { isMobile } = useBreakpoint();
  const selected = options.find((o) => o.value === value) ?? null;

  const openList = (at?: number) => {
    if (disabled) return;
    const i = at ?? Math.max(0, options.findIndex((o) => o.value === value));
    setActive(i);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    onBlur?.();
  };
  const commit = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const step = (from: number, dir: 1 | -1) => {
    for (let k = 1; k <= options.length; k++) {
      const i = (from + dir * k + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };
  const scrollActive = (i: number) => requestAnimationFrame(() => document.getElementById(`${id}-opt-${i}`)?.scrollIntoView({ block: 'nearest' }));

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (e.key.length === 1 && /\S/.test(e.key)) {
        typeahead(e.key, true);
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const i = step(active, e.key === 'ArrowDown' ? 1 : -1);
      setActive(i);
      scrollActive(i);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const i = e.key === 'Home' ? step(-1, 1) : step(options.length, -1);
      setActive(i);
      scrollActive(i);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(active);
    } else if (e.key === 'Tab') {
      close();
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      typeahead(e.key, false);
    }
  };
  const typeahead = (key: string, selectDirectly: boolean) => {
    const now = performance.now();
    typed.current.text = now - typed.current.at > TYPEAHEAD_MS ? key.toLowerCase() : typed.current.text + key.toLowerCase();
    typed.current.at = now;
    const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
    if (i < 0) return;
    if (selectDirectly) onChange(options[i].value);
    else {
      setActive(i);
      scrollActive(i);
    }
  };

  const list = (
    <div
      id={listId}
      role="listbox"
      aria-labelledby={`${id}-label`}
      tabIndex={isMobile ? 0 : -1}
      aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
      className={s.listbox}
      onKeyDown={isMobile ? onKey : undefined}
    >
      {options.map((o, i) => (
        <div
          key={o.value}
          id={`${id}-opt-${i}`}
          role="option"
          aria-selected={o.value === value}
          aria-disabled={o.disabled || undefined}
          data-active={i === active ? 'true' : undefined}
          className={s.option}
          onPointerMove={() => setActive(i)}
          onClick={() => commit(i)}
        >
          {o.leading}
          <span className={s.optionText}>
            <span className={s.optionLabel}>{o.label}</span>
            {o.description && <span className={s.optionDescription}>{o.description}</span>}
          </span>
          {o.hint && <span className={s.optionHint}>{o.hint}</span>}
          {o.value === value ? <Icon name="check" size={16} className={s.optionCheck} /> : <span style={{ width: 16 }} aria-hidden="true" />}
        </div>
      ))}
    </div>
  );

  return (
    <Field id={id} label={<span id={`${id}-label`}>{label}</span>} required={required} help={help} error={error} labelHidden={labelHidden} className={fieldClassName}>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && !isMobile && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-labelledby={`${id}-label ${id}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { help, error })}
        aria-required={required || undefined}
        disabled={disabled}
        className={`${s.trigger} ${size === 'sm' ? s.sm : ''}`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKey}
      >
        <span className={s.value}>
          {selected?.leading}
          {selected ? selected.label : <span className={s.placeholder}>{placeholder}</span>}
        </span>
        <Icon name="chevron-down" size={16} className={s.chevron} />
      </button>
      <Popover
        open={open}
        onClose={close}
        anchor={trigger}
        label={typeof label === 'string' ? label : 'Options'}
        sheetTitle={label}
        role="presentation"
        width="anchor"
        trap={false}
        initialFocus={isMobile ? 'first' : 'none'}
      >
        {list}
      </Popover>
    </Field>
  );
}
