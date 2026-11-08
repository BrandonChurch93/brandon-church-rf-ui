/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- options use aria-activedescendant; keyboard handling lives on the combobox (WAI-ARIA APG listbox pattern) */
import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Field, describedBy } from './Field';
import { RemovableChip } from '../display';
import { Popover } from '../overlay/Popover';
import s from './listbox.module.scss';
import t from './tag.module.scss';

interface TagInputProps {
  label: ReactNode;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  max?: number;
  placeholder?: string;
  help?: ReactNode;
  error?: string | null;
}

/** Type and press Enter to add a tag; Backspace removes the last; suggestions come from other records. */
export function TagInput({ label, value, onChange, suggestions = [], max = 12, placeholder = 'Type and press Enter', help, error }: TagInputProps) {
  const id = useId();
  const listId = `${id}-list`;
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const full = value.length >= max;

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    const taken = new Set(value.map((v) => v.toLowerCase()));
    return Array.from(new Set(suggestions))
      .filter((sg) => !taken.has(sg.toLowerCase()) && (!q || sg.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [suggestions, value, text]);

  const add = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, ' ');
    if (!tag || full) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setText('');
      return;
    }
    onChange([...value, tag]);
    setText('');
    setActive(-1);
  };

  return (
    <Field id={id} label={label} help={help ?? `${value.length} of ${max}`} error={error}>
      <div ref={box} className={t.box} data-invalid={error ? 'true' : undefined}>
        {value.map((tag) => (
          <RemovableChip key={tag} removeLabel={`Remove ${tag}`} onRemove={() => onChange(value.filter((v) => v !== tag))}>
            {tag}
          </RemovableChip>
        ))}
        <input
          ref={input}
          id={id}
          className={t.input}
          value={text}
          disabled={full}
          placeholder={full ? `Limit of ${max} reached` : value.length ? '' : placeholder}
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-describedby={describedBy(id, { help: true, error })}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              if (!text.trim() && active < 0) return;
              e.preventDefault();
              add(active >= 0 && matches[active] ? matches[active] : text);
            } else if (e.key === 'Backspace' && !text && value.length) {
              onChange(value.slice(0, -1));
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(matches.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            }
          }}
        />
      </div>
      <Popover open={open && matches.length > 0} onClose={() => setOpen(false)} anchor={box} label="Suggestions" role="presentation" width="anchor" trap={false} initialFocus="none" alwaysAnchored>
        <div id={listId} role="listbox" aria-label="Suggestions" className={s.listbox}>
          {matches.map((m, i) => (
            <div
              key={m}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              data-active={i === active ? 'true' : undefined}
              className={s.option}
              onPointerDown={(e) => e.preventDefault()}
              onPointerMove={() => setActive(i)}
              onClick={() => {
                add(m);
                input.current?.focus();
              }}
            >
              {m}
            </div>
          ))}
        </div>
      </Popover>
    </Field>
  );
}
