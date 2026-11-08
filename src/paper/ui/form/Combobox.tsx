/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- options use aria-activedescendant; keyboard handling lives on the combobox (WAI-ARIA APG listbox pattern) */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Field, describedBy } from './Field';
import { InputBox } from './Input';
import { Popover } from '../overlay/Popover';
import { Icon } from '../Icon';
import type { SelectOption } from './Select';
import s from './listbox.module.scss';
import f from './form.module.scss';

interface ComboboxProps<T extends string> {
  label: ReactNode;
  value: T | null;
  onChange: (value: T | null) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  emptyText?: string;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** The list sits under the input and is always visible (inside popovers and bottom sheets). */
  inline?: boolean;
  /** Clear the input after choosing (pickers that add to a list, e.g. "Add staff"). */
  clearOnSelect?: boolean;
  mono?: boolean;
  autoFocus?: boolean;
  labelHidden?: boolean;
  id?: string;
}

/** Input with a filtered listbox (WAI-ARIA APG combobox with list autocomplete). */
export function Combobox<T extends string>({ label, value, onChange, options, placeholder, emptyText = 'No matches', help, error, required, inline, clearOnSelect, mono, autoFocus, labelHidden, id: idProp }: ComboboxProps<T>) {
  const auto = useId();
  const id = idProp ?? auto;
  const listId = `${id}-list`;
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;
  const [text, setText] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!filtering) setText(clearOnSelect ? '' : (selected?.label ?? ''));
  }, [selected?.label, filtering, clearOnSelect]);

  const filtered = useMemo(() => {
    const q = filtering ? text.trim().toLowerCase() : '';
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q));
  }, [options, text, filtering]);

  const showList = inline || open;
  const commit = (o: SelectOption<T> | undefined) => {
    if (!o || o.disabled) return;
    onChange(o.value);
    setFiltering(false);
    setText(clearOnSelect ? '' : o.label);
    if (!inline) setOpen(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showList) {
        setOpen(true);
        setActive(0);
        return;
      }
      const n = filtered.length;
      if (!n) return;
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (e.key === 'Enter') {
      if (showList && filtered[active]) {
        e.preventDefault();
        commit(filtered[active]);
      }
    } else if (e.key === 'Escape' && inline && text) {
      e.preventDefault();
      e.stopPropagation();
      setFiltering(false);
      setText('');
    }
  };
  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);
  useEffect(() => {
    if (showList) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, showList, id]);

  const list = (
    <div id={listId} role="listbox" aria-labelledby={`${id}-label`} className={s.listbox}>
      {filtered.length === 0 && <div className={s.empty}>{emptyText}</div>}
      {filtered.map((o, i) => (
        <div
          key={o.value}
          id={`${id}-opt-${i}`}
          role="option"
          aria-selected={o.value === value}
          aria-disabled={o.disabled || undefined}
          data-active={i === active ? 'true' : undefined}
          className={s.option}
          onPointerDown={(e) => e.preventDefault()}
          onPointerMove={() => setActive(i)}
          onClick={() => commit(o)}
        >
          {o.leading}
          <span className={s.optionText}>
            <span className={s.optionLabel}>{o.label}</span>
            {o.description && <span className={s.optionDescription}>{o.description}</span>}
          </span>
          {o.hint && <span className={s.optionHint}>{o.hint}</span>}
          {o.value === value && <Icon name="check" size={16} className={s.optionCheck} />}
        </div>
      ))}
    </div>
  );

  return (
    <Field id={id} label={<span id={`${id}-label`}>{label}</span>} required={required} help={help} error={error} labelHidden={labelHidden}>
      <div ref={box}>
        <InputBox invalid={Boolean(error)} mono={mono} prefix={<Icon name="search" size={16} />}>
          <input
            ref={input}
            id={id}
            className={f.input}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && filtered[active] ? `${id}-opt-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { help, error })}
            autoComplete="off"
            autoFocus={autoFocus}
            placeholder={placeholder}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFiltering(true);
              setActive(0);
              if (!inline) setOpen(true);
              if (e.target.value === '' && !clearOnSelect) onChange(null);
            }}
            onFocus={() => !inline && setOpen(true)}
            onBlur={() => {
              setFiltering(false);
            }}
            onKeyDown={onKey}
          />
        </InputBox>
      </div>
      {inline ? (
        <div className={s.inlineList}>{list}</div>
      ) : (
        <Popover open={open} onClose={() => setOpen(false)} anchor={box} label="Suggestions" role="presentation" width="anchor" trap={false} initialFocus="none" alwaysAnchored>
          {list}
        </Popover>
      )}
    </Field>
  );
}
