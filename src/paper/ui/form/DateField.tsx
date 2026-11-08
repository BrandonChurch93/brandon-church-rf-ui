/* eslint-disable jsx-a11y/interactive-supports-focus -- the grid itself is not a tab stop; its day buttons carry a roving tabindex (WAI-ARIA APG date picker) */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Field, describedBy } from './Field';
import { InputBox } from './Input';
import { Popover } from '../overlay/Popover';
import { IconButton } from '../IconButton';
import type { ISODate } from '@/store/types';
import { addDays, formatDate, parseISODate, toISODate, todayIn } from '@/paper/lib/format';
import s from './date.module.scss';
import f from './form.module.scss';

interface DateFieldProps {
  label: ReactNode;
  value: ISODate | null;
  onChange: (value: ISODate | null) => void;
  min?: ISODate | null;
  max?: ISODate | null;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  placeholder?: string;
  timeZone?: string;
  onBlur?: () => void;
  id?: string;
  fieldClassName?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Accepts 2026-12-15, 12/15/2026, Dec 15 2026 and December 15, 2026. */
export function parseDateText(text: string): ISODate | null | 'invalid' {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  let y: number, m: number, d: number;
  let match = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [m, d, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = t.match(/^([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/))) {
    const mi = SHORT.findIndex((p) => match![1].startsWith(p));
    if (mi < 0) return 'invalid';
    [m, d, y] = [mi + 1, Number(match[2]), Number(match[3])];
  } else return 'invalid';
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return 'invalid';
  return toISODate(dt);
}

export function DateField({ label, value, onChange, min, max, help, error, required, placeholder = 'Dec 15, 2026', timeZone = 'UTC', onBlur, id: idProp, fieldClassName }: DateFieldProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const box = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value ? formatDate(value) : '');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!focused) setText(value ? formatDate(value) : '');
  }, [value, focused]);

  const shown = error ?? localError;
  return (
    <Field id={id} label={label} required={required} help={help ?? 'Type a date or pick one'} error={shown} className={fieldClassName}>
      <div ref={box}>
        <InputBox
          invalid={Boolean(shown)}
          suffix={<IconButton icon="calendar" label="Choose a date" size={30} iconSize={16} aria-expanded={open} onClick={() => setOpen((v) => !v)} />}
        >
          <input
            id={id}
            className={f.input}
            autoComplete="off"
            placeholder={placeholder}
            value={text}
            aria-invalid={shown ? true : undefined}
            aria-describedby={describedBy(id, { help: help ?? true, error: shown })}
            aria-required={required || undefined}
            onFocus={() => setFocused(true)}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && e.altKey) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            onBlur={() => {
              setFocused(false);
              const p = parseDateText(text);
              if (p === 'invalid') setLocalError('Use a date like Dec 15, 2026');
              else {
                setLocalError(null);
                onChange(p);
                setText(p ? formatDate(p) : '');
              }
              onBlur?.();
            }}
          />
        </InputBox>
      </div>
      <Popover open={open} onClose={() => setOpen(false)} anchor={box} label="Choose a date" sheetTitle="Choose a date" placement="bottom-start" initialFocus="none">
        <Calendar
          value={value}
          min={min ?? undefined}
          max={max ?? undefined}
          today={todayIn(timeZone)}
          onSelect={(d) => {
            setLocalError(null);
            onChange(d);
            setText(formatDate(d));
            setOpen(false);
            onBlur?.();
          }}
        />
      </Popover>
    </Field>
  );
}

interface CalendarProps {
  value: ISODate | null;
  min?: ISODate;
  max?: ISODate;
  today: ISODate;
  onSelect: (d: ISODate) => void;
  /** Highlight a range of event days (calendar preview). */
  highlight?: ISODate[];
  firstDay?: 0 | 1;
  /** Display only (calendar preview): no selection, no focus. */
  readOnly?: boolean;
  initialMonth?: ISODate;
}

/** A one-month grid with keyboard navigation (arrows, Page Up and Down, Home and End). */
export function Calendar({ value, min, max, today, onSelect, highlight = [], firstDay = 0, readOnly, initialMonth }: CalendarProps) {
  const start = initialMonth ?? value ?? today;
  const [month, setMonth] = useState(() => start.slice(0, 7));
  const [focusDay, setFocusDay] = useState<ISODate>(value ?? (start.slice(0, 7) === today.slice(0, 7) ? today : `${start.slice(0, 7)}-01`));
  const grid = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(!readOnly);

  useEffect(() => {
    if (!shouldFocus.current) return;
    grid.current?.querySelector<HTMLElement>(`[data-day="${focusDay}"]`)?.focus({ preventScroll: true });
  }, [focusDay, month]);

  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() - firstDay + 7) % 7;
  const gridStart = addDays(toISODate(first), -lead);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const orderedWeekdays = [...weekdays.slice(firstDay), ...weekdays.slice(0, firstDay)];
  const disabled = (d: ISODate) => Boolean((min && d < min) || (max && d > max));

  const moveTo = (d: ISODate) => {
    setFocusDay(d);
    if (d.slice(0, 7) !== month) setMonth(d.slice(0, 7));
  };
  const shiftMonth = (n: number) => {
    const dt = new Date(Date.UTC(y, m - 1 + n, 1));
    const nm = toISODate(dt).slice(0, 7);
    setMonth(nm);
    const day = Math.min(parseISODate(focusDay).getUTCDate(), new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate());
    setFocusDay(`${nm}-${String(day).padStart(2, '0')}`);
  };
  const onKey = (e: KeyboardEvent) => {
    if (readOnly) return;
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in map) {
      e.preventDefault();
      moveTo(addDays(focusDay, map[e.key]));
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      shiftMonth(e.key === 'PageUp' ? -1 : 1);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const dow = (parseISODate(focusDay).getUTCDay() - firstDay + 7) % 7;
      moveTo(addDays(focusDay, e.key === 'Home' ? -dow : 6 - dow));
    }
  };

  return (
    <div className={s.calendar} data-readonly={readOnly ? 'true' : undefined}>
      <div className={s.head}>
        {!readOnly && <IconButton icon="chevron-left" label="Previous month" size={30} onClick={() => shiftMonth(-1)} />}
        <span className={s.month} aria-live="polite">
          {MONTHS[m - 1]} {y}
        </span>
        {!readOnly && <IconButton icon="chevron-right" label="Next month" size={30} onClick={() => shiftMonth(1)} />}
      </div>
      <div ref={grid} role="grid" aria-label={`${MONTHS[m - 1]} ${y}`} className={s.grid} onKeyDown={onKey}>
        <div role="row" className={s.row}>
          {orderedWeekdays.map((w) => (
            <span key={w} role="columnheader" className={s.weekday} aria-label={w}>
              {w.slice(0, 2)}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div role="row" key={wi} className={s.row}>
            {week.map((d) => {
              const outside = d.slice(0, 7) !== month;
              const isSel = d === value;
              const isHi = highlight.includes(d);
              return (
                <span role="gridcell" key={d} aria-selected={readOnly ? undefined : isSel}>
                  {readOnly ? (
                    <span className={s.day} data-outside={outside || undefined} data-today={d === today || undefined} data-highlight={isHi || undefined}>
                      {parseISODate(d).getUTCDate()}
                    </span>
                  ) : (
                    <button
                      type="button"
                      data-day={d}
                      tabIndex={d === focusDay ? 0 : -1}
                      disabled={disabled(d)}
                      className={s.day}
                      data-outside={outside || undefined}
                      data-today={d === today || undefined}
                      data-selected={isSel || undefined}
                      data-highlight={isHi || undefined}
                      aria-label={`${formatDate(d)}${d === today ? ', today' : ''}`}
                      aria-current={d === today ? 'date' : undefined}
                      onClick={() => onSelect(d)}
                      onFocus={() => setFocusDay(d)}
                    >
                      {parseISODate(d).getUTCDate()}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
