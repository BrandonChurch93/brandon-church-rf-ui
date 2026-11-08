import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { gsap } from 'gsap';
import type { ViewProps } from '../../shell/ViewSwitch';
import { ViewHeader } from '../../shell/ViewHeader';
import { useStore, selectActive } from '@/store/store';
import { typeCounts } from '@/store/selectors';
import { SWATCHES, type AttendeeType, type Swatch } from '@/store/types';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { Modal } from '../../ui/Modal';
import { Badge, Chip } from '../../ui/display';
import { Tooltip } from '../../ui/Tooltip';
import { Input } from '../../ui/form/Input';
import { Select } from '../../ui/form/Select';
import { SortableList } from '../../ui/Sortable';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { Flip, flash, useFlipList } from '@/motion/flip';
import { isReducedMotion } from '@/motion/reduced';
import { plural } from '../../lib/format';
import { useShell, registerIntent } from '../../shellStore';
import l from '../shared/lists.module.scss';
import s from './types.module.scss';

registerIntent('add-type');

const NAME_MAX = 32;
const DESC_MAX = 80;
const SWATCH_LABEL: Record<Swatch, string> = { grape: 'Grape', berry: 'Berry', amber: 'Amber', teal: 'Teal', sky: 'Sky', lime: 'Lime', plum: 'Plum', slate: 'Slate' };

interface Draft {
  name: string;
  description: string;
  swatch: Swatch;
}

/** Attendee types: a small sortable list edited in place. */
export function AttendeeTypesView(_props: ViewProps) {
  const ev = useStore(selectActive);
  const reorder = useStore((st) => st.reorderTypes);
  const add = useStore((st) => st.addType);
  const update = useStore((st) => st.updateType);
  const setDefault = useStore((st) => st.setDefaultType);
  const duplicate = useStore((st) => st.duplicateType);
  const removeType = useStore((st) => st.removeType);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);
  const counts = typeCounts(ev);
  const [editing, setEditing] = useState<string | null>(null);
  const [selectName, setSelectName] = useState(false);
  const [reassign, setReassign] = useState<AttendeeType | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const chipState = useRef<Flip.FlipState | null>(null);
  const defaultId = ev.attendeeTypes.find((t) => t.isDefault)?.id;

  useFlipList(list, `${editing}|${ev.attendeeTypes.map((t) => t.id).join(',')}`, { duration: 0.32, ease: 'power3.out', enter: false });

  useEffect(() => {
    if (intent?.type === 'add-type') {
      consume(intent.id);
      setEditing('new');
    }
  }, [intent, consume]);

  // The Default chip glides from its old row to the new one (Flip, 320 ms).
  useLayoutEffect(() => {
    if (!chipState.current || isReducedMotion()) return;
    Flip.from(chipState.current, { targets: list.current?.querySelectorAll('[data-flip-id="default-chip"]'), duration: 0.32, ease: 'power3.out' });
    chipState.current = null;
  }, [defaultId]);

  const usedSwatches = new Set(ev.attendeeTypes.map((t) => t.swatch));
  const nextSwatch = SWATCHES.find((sw) => !usedSwatches.has(sw)) ?? SWATCHES[ev.attendeeTypes.length % SWATCHES.length];
  const names = (exceptId?: string) => ev.attendeeTypes.filter((t) => t.id !== exceptId).map((t) => t.name.toLowerCase());

  const flashRow = (id: string) => requestAnimationFrame(() => flash(list.current?.querySelector<HTMLElement>(`[data-row="${id}"]`) ?? null));

  const saveEdit = (id: string, d: Draft) => {
    if (id === 'new') {
      const newId = add({ name: d.name.trim(), description: d.description.trim(), swatch: d.swatch });
      toast.success(`Added ${d.name.trim()}`);
      flashRow(newId);
    } else {
      update(id, { name: d.name.trim(), description: d.description.trim(), swatch: d.swatch });
      toast.success(`Saved ${d.name.trim()}`);
      flashRow(id);
    }
    setEditing(null);
  };

  const onRemove = async (t: AttendeeType) => {
    const n = counts.get(t.id) ?? 0;
    const wf = ev.guide.workflows.filter((w) => w.attendeeTypeId === t.id).length;
    if (n > 0 || wf > 0) {
      setReassign(t);
      return;
    }
    if (!(await confirmDialog({ title: `Remove ${t.name}?`, body: 'No attendees or workflows use this type.', confirmLabel: 'Remove', danger: true }))) return;
    const token = removeType(t.id, null);
    if (token) toast.undo(`Removed ${t.name}`, token, `Undo removing ${t.name}`);
  };

  const makeDefault = (t: AttendeeType) => {
    chipState.current = Flip.getState(list.current?.querySelectorAll('[data-flip-id="default-chip"]') ?? []);
    setDefault(t.id);
    toast.success(`${t.name} is now the default type`);
  };

  return (
    <>
      <ViewHeader
        title="Attendee types"
        description="Categories that drive registration workflows and badges."
        actions={
          <Button variant="primary" icon="plus" className="primary-action" onClick={() => setEditing('new')} disabled={editing === 'new'}>
            Add type
          </Button>
        }
      />
      <section data-part aria-label="Attendee types">
        <div ref={list} className={l.card}>
          <SortableList
            items={ev.attendeeTypes}
            getId={(t) => t.id}
            getName={(t) => t.name}
            onReorder={(ids, moved) => {
              reorder(ids);
              toast(`Moved ${moved.name} to position ${moved.to}`);
            }}
            render={(t, p) => {
              const n = counts.get(t.id) ?? 0;
              const isEditing = editing === t.id;
              return (
                <div ref={p.setNodeRef} style={p.style} className={`${l.row} ${s.rowWrap}`} data-row={t.id} data-flip-id={t.id} data-clickable={!isEditing || undefined}>
                  <div className={s.row}>
                    <span className={s.handle}>{p.handle}</span>
                    <span className={s.dot} style={{ background: `var(--sw-${t.swatch})` }} aria-hidden="true" />
                    <div className={s.text}>
                      <button
                        type="button"
                        className={s.name}
                        aria-expanded={isEditing}
                        aria-label={`${t.name}${t.isDefault ? ', default type' : ''}. ${plural(n, 'attendee')}. Edit`}
                        onClick={() => {
                          setSelectName(false);
                          setEditing(t.id);
                        }}
                      >
                        {t.name}
                      </button>
                      <span className={s.desc}>{t.description || 'No description'}</span>
                    </div>
                    <div className={s.meta}>
                      {t.isDefault && (
                        <span data-flip-id="default-chip">
                          <Chip tone="accent">Default</Chip>
                        </span>
                      )}
                      {n > 0 ? (
                        <>
                          <Badge className={s.countLong}>{plural(n, 'attendee')}</Badge>
                          <Tooltip content={plural(n, 'attendee')}>
                            <span className={s.countShort} tabIndex={-1}>
                              <Badge>{n}</Badge>
                            </span>
                          </Tooltip>
                        </>
                      ) : (
                        <span className={s.noCount}>No attendees</span>
                      )}
                      <Menu
                        label={`${t.name} actions`}
                        width={220}
                        items={[
                          { id: 'edit', label: 'Edit', icon: 'pencil', onSelect: () => (setSelectName(false), setEditing(t.id)) },
                          { id: 'default', label: 'Set as default', icon: 'star', disabled: t.isDefault, reason: 'This is already the default type', onSelect: () => makeDefault(t) },
                          {
                            id: 'dup',
                            label: 'Duplicate',
                            icon: 'duplicate',
                            onSelect: () => {
                              const id = duplicate(t.id);
                              if (id) {
                                setSelectName(true);
                                setEditing(id);
                              }
                            },
                          },
                          { id: 'div', type: 'divider' },
                          { id: 'remove', label: 'Remove', icon: 'trash', danger: true, disabled: t.isDefault, reason: 'The default type cannot be removed', onSelect: () => void onRemove(t) },
                        ]}
                        trigger={(tp) => <IconButton {...tp} icon="ellipsis" label={`${t.name} actions`} size={30} className={s.kebab} />}
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <TypeEditor
                      initial={{ name: t.name, description: t.description, swatch: t.swatch }}
                      taken={names(t.id)}
                      selectName={selectName}
                      onCancel={() => setEditing(null)}
                      onSave={(d) => saveEdit(t.id, d)}
                    />
                  )}
                </div>
              );
            }}
          />
          {editing === 'new' && (
            <div className={l.row}>
              <TypeEditor initial={{ name: '', description: '', swatch: nextSwatch }} taken={names()} isNew onCancel={() => setEditing(null)} onSave={(d) => saveEdit('new', d)} />
            </div>
          )}
        </div>
      </section>
      <ReassignModal type={reassign} onClose={() => setReassign(null)} />
    </>
  );
}

function TypeEditor({ initial, taken, isNew, selectName, onCancel, onSave }: { initial: Draft; taken: string[]; isNew?: boolean; selectName?: boolean; onCancel: () => void; onSave: (d: Draft) => void }) {
  const [d, setD] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (el && !isReducedMotion()) gsap.fromTo(el, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.48, ease: 'power3.out', clearProps: 'height,opacity' });
    requestAnimationFrame(() => {
      nameInput.current?.focus();
      if (selectName || !isNew) nameInput.current?.select();
    });
    // Runs once when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Closing is immediate; the list's Flip slides the rows below into place.
  const close = (then: () => void) => then();
  const nameError = !d.name.trim() ? 'Enter a name' : taken.includes(d.name.trim().toLowerCase()) ? 'Another type already has this name' : null;
  const save = () => {
    setSubmitted(true);
    if (nameError) {
      nameInput.current?.focus();
      return;
    }
    close(() => onSave(d));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(onCancel);
    } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      save();
    }
  };
  const onSwatchKey = (e: KeyboardEvent) => {
    const i = SWATCHES.indexOf(d.swatch);
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = SWATCHES[(i + dir + SWATCHES.length) % SWATCHES.length];
    setD((x) => ({ ...x, swatch: next }));
    requestAnimationFrame(() => wrap.current?.querySelector<HTMLElement>(`[data-swatch="${next}"]`)?.focus());
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Enter and Escape shortcuts for the inline editor; every control inside is a real input or button
    <div ref={wrap} className={s.editorWrap} onKeyDown={onKey} onClick={(e) => e.stopPropagation()} role="group" aria-label={isNew ? 'New attendee type' : `Edit ${initial.name}`}>
      <div className={s.editor}>
        <Input ref={nameInput} label="Name" required value={d.name} maxLength={NAME_MAX} onChange={(e) => setD({ ...d, name: e.target.value })} error={submitted ? nameError : undefined} size="sm" placeholder="Speaker" />
        <Input label="Description" value={d.description} maxLength={DESC_MAX} maxCount={DESC_MAX} onChange={(e) => setD({ ...d, description: e.target.value })} size="sm" placeholder="Presenting at one or more sessions" />
        <div className={s.editorBottom}>
          <div>
            <div className={s.swatchLabel} id={`sw-${initial.name || 'new'}`}>
              Color
            </div>
            {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the swatches carry a roving tabindex */}
            <div className={s.swatches} role="radiogroup" aria-labelledby={`sw-${initial.name || 'new'}`} onKeyDown={onSwatchKey}>
              {SWATCHES.map((sw) => (
                <button
                  key={sw}
                  type="button"
                  role="radio"
                  data-swatch={sw}
                  aria-checked={d.swatch === sw}
                  aria-label={SWATCH_LABEL[sw]}
                  tabIndex={d.swatch === sw ? 0 : -1}
                  className={s.swatch}
                  style={{ background: `var(--sw-${sw})` }}
                  onClick={() => setD({ ...d, swatch: sw })}
                />
              ))}
            </div>
          </div>
          <div className={s.actions}>
            <Button size="sm" variant="ghost" onClick={() => close(onCancel)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={save}>
              {isNew ? 'Add type' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReassignModal({ type, onClose }: { type: AttendeeType | null; onClose: () => void }) {
  const ev = useStore(selectActive);
  const removeType = useStore((st) => st.removeType);
  const [shown, setShown] = useState(type);
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    if (type) {
      setShown(type);
      setTarget(ev.attendeeTypes.find((t) => t.isDefault)?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
  if (!shown) return null;
  const n = ev.attendees.filter((a) => a.attendeeTypeId === shown.id).length;
  const wf = ev.guide.workflows.filter((w) => w.attendeeTypeId === shown.id).length;
  const usage = [n ? plural(n, 'attendee') : null, wf ? plural(wf, 'workflow') : null].filter(Boolean).join(' and ');
  return (
    <Modal
      open={Boolean(type)}
      onClose={onClose}
      title={`Remove ${shown.name}?`}
      width={420}
      role="alertdialog"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!target}
            onClick={() => {
              const to = ev.attendeeTypes.find((t) => t.id === target);
              const token = removeType(shown.id, target);
              onClose();
              if (token) toast.undo(`Removed ${shown.name}`, token, `Undo removing ${shown.name}`);
              if (to) window.setTimeout(() => toast(`Moved ${usage} to ${to.name}`), 50);
            }}
          >
            Remove and reassign
          </Button>
        </>
      }
    >
      <p style={{ marginBottom: 16 }}>
        {usage} {n + wf === 1 ? 'uses' : 'use'} this type. Choose where they should go.
      </p>
      <Select label="Move them to" value={target} onChange={setTarget} options={ev.attendeeTypes.filter((t) => t.id !== shown.id).map((t) => ({ value: t.id, label: t.name, description: t.isDefault ? 'Default type' : undefined }))} />
    </Modal>
  );
}
