import { useEffect, useRef, useState } from 'react';
import { useStore, selectActive } from '@/store/store';
import type { StepKind, Workflow } from '@/store/types';
import { uid } from '@/store/ids';
import { Sheet, useCloseGuard } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Icon } from '../../ui/Icon';
import { Select } from '../../ui/form/Select';
import { Textarea } from '../../ui/form/Input';
import { SegmentedControl } from '../../ui/form/SegmentedControl';
import { InlineEdit } from '../../ui/InlineEdit';
import { Popover } from '../../ui/overlay/Popover';
import { SortableList } from '../../ui/Sortable';
import { useSaveFlow } from '../../hooks/useSaveFlow';
import { toast } from '../../ui/toastStore';
import { STEP_KINDS, stepMeta } from './templates';
import s from './guide.module.scss';
import m from '../../ui/menu.module.scss';

type Draft = Pick<Workflow, 'name' | 'attendeeTypeId' | 'status' | 'description' | 'steps'>;
const DESCRIPTION_MAX = 160;

/** Side sheet (560): name, type, Draft or Live, description, and the ordered steps. */
export function WorkflowEditor({ workflow, onClose }: { workflow: Workflow | null; onClose: () => void }) {
  const ev = useStore(selectActive);
  const update = useStore((st) => st.updateWorkflow);
  const flow = useSaveFlow();
  const [shown, setShown] = useState<Workflow | null>(workflow);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [base, setBase] = useState<Draft | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const addBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!workflow) return;
    setShown(workflow);
    const d: Draft = { name: workflow.name, attendeeTypeId: workflow.attendeeTypeId, status: workflow.status, description: workflow.description, steps: structuredClone(workflow.steps) };
    setDraft(d);
    setBase(d);
    // Taken once per opened workflow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow?.id]);

  const open = Boolean(workflow);
  const dirty = Boolean(draft && base && JSON.stringify(draft) !== JSON.stringify(base));
  const cancel = useCloseGuard(dirty && flow.state === 'idle', onClose);
  const d = draft;
  const typeExists = Boolean(d && ev.attendeeTypes.some((t) => t.id === d.attendeeTypeId));
  const canGoLive = Boolean(d && d.steps.length > 0 && typeExists);
  const liveReason = !d ? '' : d.steps.length === 0 ? 'Add at least one step before going live' : !typeExists ? 'Choose an attendee type before going live' : '';
  const missing = STEP_KINDS.filter((k) => !d?.steps.some((x) => x.kind === k.kind));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((x) => (x ? { ...x, [k]: v } : x));

  // A workflow that loses its last step drops back to Draft.
  useEffect(() => {
    if (d && d.status === 'live' && !canGoLive) set('status', 'draft');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGoLive]);

  const submit = () => {
    if (!d || !shown) return;
    if (d.description.length > DESCRIPTION_MAX) return;
    flow.run(() => {
      update(shown.id, { ...d, description: d.description.trim() });
      toast.success(`Saved ${d.name}`);
    }, onClose);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      titleText={d?.name ?? 'Workflow'}
      title={d ? <InlineEdit value={d.name} label="Workflow name" onCommit={(name) => set('name', name)} maxLength={60} /> : null}
      subtitle={shown?.template ? `From the ${shown.template} template` : 'Registration workflow'}
      dirty={dirty && flow.state === 'idle'}
      footer={
        <>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={() => void cancel()}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={flow.loading} success={flow.success} disabled={!dirty}>
            Save
          </Button>
        </>
      }
    >
      {d && (
        <div className={s.form}>
          <div className={s.row2}>
            <Select label="Attendee type" value={typeExists ? d.attendeeTypeId : null} onChange={(v) => set('attendeeTypeId', v)} options={ev.attendeeTypes.map((t) => ({ value: t.id, label: t.name, leading: <i style={{ width: 8, height: 8, borderRadius: 4, background: `var(--sw-${t.swatch})` }} aria-hidden="true" /> }))} placeholder="Choose a type" />
            <div className={s.sectionGap}>
              <span className={s.labelRow}>Status</span>
              <SegmentedControl
                label="Status"
                value={d.status}
                fullWidth
                onChange={(v) => set('status', v)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'live', label: 'Live', disabled: !canGoLive, reason: liveReason },
                ]}
              />
            </div>
          </div>
          <Textarea label="Description" value={d.description} onChange={(e) => set('description', e.target.value)} maxCount={DESCRIPTION_MAX} rows={3} error={d.description.length > DESCRIPTION_MAX ? `Keep it to ${DESCRIPTION_MAX} characters` : null} placeholder="Who this workflow is for and what it collects" />
          <div className={s.sectionGap}>
            <div className={s.labelRow}>
              <span id="steps-label">Steps</span>
              <Button ref={addBtn} size="sm" variant="ghost" icon="plus" disabled={missing.length === 0} aria-haspopup="menu" aria-expanded={addOpen} onClick={() => setAddOpen(true)}>
                Add step
              </Button>
            </div>
            <div className={s.stepList}>
              {d.steps.length === 0 && <div className={s.listEmpty}>No steps yet. Add the first step to build the flow.</div>}
              <SortableList
                items={d.steps}
                getId={(x) => x.id}
                getName={(x) => x.name}
                onReorder={(ids) => set('steps', ids.map((id) => d.steps.find((x) => x.id === id)!))}
                render={(step, p, i) => (
                  <div ref={p.setNodeRef} style={p.style} className={s.stepRow}>
                    {p.handle}
                    <span className={s.stepIcon}>
                      <Icon name={stepMeta(step.kind).icon} size={16} />
                    </span>
                    <span className={s.stepText}>
                      <span className={s.stepTitle}>
                        {i + 1}. {step.name}
                      </span>
                      <span className={s.stepKind}>{stepMeta(step.kind).label}</span>
                    </span>
                    <IconButton icon="x" label={`Remove ${step.name}`} size={30} onClick={() => set('steps', d.steps.filter((x) => x.id !== step.id))} />
                  </div>
                )}
              />
            </div>
          </div>
          <Popover open={addOpen} onClose={() => setAddOpen(false)} anchor={addBtn} label="Add step" sheetTitle="Add step" placement="bottom-end" width={260} role="presentation">
            <div role="menu" aria-label="Step kinds" className={m.list}>
              {missing.map((k) => (
                <button
                  key={k.kind}
                  type="button"
                  role="menuitem"
                  className={m.item}
                  onClick={() => {
                    set('steps', [...d.steps, { id: uid(), kind: k.kind as StepKind, name: k.name }]);
                    setAddOpen(false);
                  }}
                >
                  <Icon name={k.icon} size={16} className={m.icon} />
                  <span className={m.text}>
                    <span className={m.label}>{k.name}</span>
                    <span className={m.description}>{k.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </Popover>
        </div>
      )}
    </Sheet>
  );
}
