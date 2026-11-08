import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useStore, selectActive } from '@/store/store';
import { defaultType } from '@/store/selectors';
import { uniqueName } from '@/store/slices/guide';
import { uid } from '@/store/ids';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { toast } from '../../ui/toastStore';
import { TEMPLATES, stepMeta, type WorkflowTemplate } from './templates';
import s from './guide.module.scss';

/** Choose a template, then create a Draft workflow from it (double click creates too). */
export function TemplatePicker({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string, openEditor: boolean) => void }) {
  const ev = useStore(selectActive);
  const add = useStore((st) => st.addWorkflow);
  const [selected, setSelected] = useState<string | null>(null);
  const group = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  const target = (t: WorkflowTemplate) => {
    const match = t.targetType ? ev.attendeeTypes.find((x) => x.name.toLowerCase() === t.targetType!.toLowerCase()) : null;
    const def = defaultType(ev);
    return { type: match ?? def, fallback: !match };
  };

  const create = (name: string | null) => {
    const t = TEMPLATES.find((x) => x.name === name);
    if (!t) return;
    const { type } = target(t);
    const scratch = t.targetType === null;
    const wfName = uniqueName(scratch ? 'New workflow' : `${t.name} Registration`, ev.guide.workflows.map((w) => w.name));
    const id = add({
      name: wfName,
      description: scratch ? '' : t.description,
      attendeeTypeId: type.id,
      status: 'draft',
      steps: t.steps.map((k) => ({ id: uid(), kind: k, name: stepMeta(k).name })),
      template: scratch ? null : t.name,
    });
    onClose();
    toast.success(`Added ${wfName}`);
    onCreated(id, scratch);
  };

  const onKey = (e: KeyboardEvent) => {
    const tiles = Array.from(group.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []);
    const i = tiles.indexOf(document.activeElement as HTMLElement);
    const cols = window.matchMedia('(max-width: 599px)').matches ? 1 : 2;
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
    if (e.key in map) {
      e.preventDefault();
      const n = Math.min(tiles.length - 1, Math.max(0, (i < 0 ? 0 : i) + map[e.key]));
      tiles[n].focus();
      setSelected(TEMPLATES[n].name);
    } else if (e.key === 'Enter' && selected) {
      e.preventDefault();
      create(selected);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a registration workflow"
      width={640}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!selected} onClick={() => create(selected)}>
            Create workflow
          </Button>
        </>
      }
    >
      <p style={{ marginBottom: 16, fontSize: 14 }}>Start from a template. You can change everything afterwards.</p>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the tiles carry a roving tabindex */}
      <div ref={group} role="radiogroup" aria-label="Templates" className={s.templates} onKeyDown={onKey}>
        {TEMPLATES.map((t, i) => {
          const { type, fallback } = target(t);
          const checked = selected === t.name;
          return (
            <button
              key={t.name}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked || (!selected && i === 0) ? 0 : -1}
              className={s.template}
              onClick={() => setSelected(t.name)}
              onDoubleClick={() => create(t.name)}
            >
              <span className={s.templateIcon}>
                <Icon name={t.icon} size={18} />
              </span>
              <span className={s.templateText}>
                <span className={s.templateName}>{t.name}</span>
                <span className={s.templateDesc}>{t.description}</span>
                <span className={s.templateTarget}>{fallback ? `Uses ${type.name}, this event's default type` : `For ${type.name}`}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
