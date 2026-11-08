import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useStore, selectActive } from '@/store/store';
import { defaultType } from '@/store/selectors';
import type { Workflow } from '@/store/types';
import { SortableList } from '../../ui/Sortable';
import { Icon } from '../../ui/Icon';
import { Chip } from '../../ui/display';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { Menu } from '../../ui/Menu';
import { Tooltip } from '../../ui/Tooltip';
import { InlineEdit } from '../../ui/InlineEdit';
import { confirmDialog } from '../../ui/confirmStore';
import { toast } from '../../ui/toastStore';
import { useFlipList, animateOut, flash } from '@/motion/flip';
import { isReducedMotion } from '@/motion/reduced';
import { plural, relativeTime } from '../../lib/format';
import { useShell, registerIntent } from '../../shellStore';
import { TemplatePicker } from './TemplatePicker';
import { WorkflowEditor } from './WorkflowEditor';
import c from '../../ui/cards.module.scss';
import s from './guide.module.scss';

registerIntent('add-workflow');

const VISIBLE = 6;
const GATE_COPY = 'Configure general settings before creating registration workflows.';

/** Step 2: registration workflows, gated by General, sortable, with templates and an editor. */
export function WorkflowsStep() {
  const ev = useStore(selectActive);
  const reorder = useStore((st) => st.reorderWorkflows);
  const showAllMap = useStore((st) => st.ui.guideShowAll);
  const setShowAll = useStore((st) => st.setGuideShowAll);
  const intent = useShell((st) => st.intent);
  const consume = useShell((st) => st.consume);
  const workflows = ev.guide.workflows;
  const locked = !ev.guide.settings.general;
  const showAllKey = `${ev.id}:workflows`;
  const showAll = Boolean(showAllMap[showAllKey]);
  const visible = showAll ? workflows : workflows.slice(0, VISIBLE);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLDivElement>(null);

  useFlipList(grid, visible.map((w) => w.id).join(','));

  // A freshly created workflow flashes once it has landed.
  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => flash(grid.current?.querySelector<HTMLElement>(`[data-flip-id="${fresh}"]`) ?? null), 300);
    setFresh(null);
    return () => window.clearTimeout(t);
  }, [fresh]);

  // Gate unlock: the cards rise into place, 60 ms apart.
  const wasLocked = useRef(locked);
  useLayoutEffect(() => {
    if (wasLocked.current && !locked && !isReducedMotion()) {
      const cards = grid.current?.querySelectorAll(':scope > [data-flip-id], :scope > [data-add]') ?? [];
      gsap.fromTo(cards, { y: 4 }, { y: 0, duration: 0.42, ease: 'power3.out', stagger: 0.06, clearProps: 'transform' });
    }
    wasLocked.current = locked;
  }, [locked]);

  // Show all and Show less animate the grid's height.
  const lastHeight = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = clip.current;
    if (!el) return;
    const prev = lastHeight.current;
    const next = el.scrollHeight;
    if (prev !== null && prev !== next && !isReducedMotion()) {
      gsap.fromTo(el, { height: prev }, { height: next, duration: next > prev ? 0.48 : 0.32, ease: next > prev ? 'power3.out' : 'power2.in', clearProps: 'height' });
    }
    lastHeight.current = next;
  }, [showAll]);

  useEffect(() => {
    if (intent?.type === 'add-workflow') {
      consume(intent.id);
      if (locked) toast(GATE_COPY);
      else setPicker(true);
    }
  }, [intent, consume, locked]);

  const editingWorkflow = workflows.find((w) => w.id === editing) ?? null;

  return (
    <div className={s.step}>
      <div className={s.stepLabel}>
        <h3 className={s.stepName}>
          <strong>Step 2</strong>
          <span>Build registration workflows</span>
        </h3>
        <div className={s.stepMeta}>
          {locked && (
            <Tooltip content={GATE_COPY}>
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the badge is focusable so keyboard users can read why Step 2 is locked (08, Gate) */}
              <span className={s.lockBadge} tabIndex={0} role="note">
                <Icon name="lock" size={12} />
                Locked
              </span>
            </Tooltip>
          )}
          <span>{plural(workflows.length, 'workflow')}</span>
          {workflows.length > VISIBLE && (
            <Button size="sm" variant="ghost" aria-expanded={showAll} onClick={() => setShowAll(showAllKey, !showAll)}>
              {showAll ? 'Show less' : `Show all ${workflows.length}`}
            </Button>
          )}
        </div>
      </div>
      {workflows.length === 0 && <p className={s.emptyNote}>No workflows yet</p>}
      <Tooltip content={locked ? GATE_COPY : null} placement="top" describe={false}>
        <div className={s.gateGroup} data-locked={locked} aria-describedby={locked ? 'gate-note' : undefined}>
          {locked && (
            <span id="gate-note" className="sr-only">
              {GATE_COPY}
            </span>
          )}
          <div ref={clip} className={`${c.gridWrap} ${s.gated}`} inert={locked}>
            <div ref={grid} className={c.grid}>
              <SortableList
                items={visible}
                layout="grid"
                getId={(w) => w.id}
                getName={(w) => w.name}
                onReorder={(ids) => reorder([...ids, ...workflows.slice(visible.length).map((w) => w.id)])}
                render={(w, p) => (
                  <WorkflowCard key={w.id} workflow={w} sortable={p} onOpen={() => setEditing(w.id)} />
                )}
              />
              <button type="button" className={c.add} data-add onClick={() => setPicker(true)}>
                <span className={c.addCircle}>
                  <Icon name="plus" size={18} />
                </span>
                Add registration workflow
              </button>
            </div>
          </div>
        </div>
      </Tooltip>
      <TemplatePicker
        open={picker}
        onClose={() => setPicker(false)}
        onCreated={(id, openEditor) => {
          setFresh(id);
          if (openEditor) window.setTimeout(() => setEditing(id), 360);
        }}
      />
      <WorkflowEditor workflow={editingWorkflow} onClose={() => setEditing(null)} />
    </div>
  );
}

function WorkflowCard({ workflow: w, sortable: p, onOpen }: { workflow: Workflow; sortable: import('../../ui/Sortable').SortableRenderProps; onOpen: () => void }) {
  const ev = useStore(selectActive);
  const update = useStore((st) => st.updateWorkflow);
  const duplicate = useStore((st) => st.duplicateWorkflow);
  const remove = useStore((st) => st.removeWorkflow);
  const [renaming, setRenaming] = useState(false);
  const card = useRef<HTMLDivElement | null>(null);
  const type = ev.attendeeTypes.find((t) => t.id === w.attendeeTypeId) ?? defaultType(ev);
  const meta = [type?.name, plural(w.steps.length, 'step'), `Updated ${relativeTime(w.updatedAt)}`].join(' · ');

  const onRemove = async () => {
    const ok = await confirmDialog({ title: `Remove ${w.name}?`, body: 'Attendees already registered through it keep their records.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    animateOut(card.current, () => {
      const token = remove(w.id);
      toast.undo(`Removed ${w.name}`, token, `Undo removing ${w.name}`);
    });
  };

  return (
    <div
      ref={(el) => {
        card.current = el;
        p.setNodeRef(el);
      }}
      style={p.style}
      data-flip-id={w.id}
      className={`${c.card} ${c.clickable} ${s.workflowCard} ${p.isDragging ? s.dragging : ''}`}
    >
      <span className={s.handleSlot}>{p.handle}</span>
      <div className={s.cardTop}>
        <Icon name="git-branch" size={20} className={`${s.cardIcon} ${c.above}`} />
        {renaming ? (
          <span className={`${s.cardRename} ${c.above}`}>
            <InlineEdit value={w.name} label="Workflow name" editing onEditingChange={setRenaming} onCommit={(name) => update(w.id, { name })} maxLength={60} />
          </span>
        ) : (
          <Tooltip content={w.name.length > 28 ? w.name : null} describe={false}>
            <button type="button" className={`${c.stretch} ${s.cardTitle}`} onClick={onOpen} aria-label={`${w.name}, ${w.status === 'live' ? 'Live' : 'Draft'}. Open the workflow editor`}>
              {w.name}
            </button>
          </Tooltip>
        )}
        <span className={c.hoverHide}>
          <Chip tone={w.status === 'live' ? 'success' : 'neutral'} dot>
            {w.status === 'live' ? 'Live' : 'Draft'}
          </Chip>
        </span>
      </div>
      <p className={s.cardDesc}>{w.description || 'No description yet.'}</p>
      <p className={s.cardMeta}>{meta}</p>
      <div className={c.actions}>
        <IconButton icon="pencil" label={`Edit ${w.name}`} size={30} onClick={onOpen} />
        <Menu
          label={`${w.name} actions`}
          width={200}
          items={[
            {
              id: 'dup',
              label: 'Duplicate',
              icon: 'duplicate',
              onSelect: () => {
                duplicate(w.id);
                toast.success(`Duplicated ${w.name}`);
              },
            },
            { id: 'rename', label: 'Rename', icon: 'pencil', onSelect: () => setRenaming(true) },
            { id: 'div', type: 'divider' },
            { id: 'remove', label: 'Remove', icon: 'trash', danger: true, onSelect: () => void onRemove() },
          ]}
          trigger={(t) => <IconButton {...t} icon="ellipsis" label={`More actions for ${w.name}`} size={30} />}
        />
      </div>
    </div>
  );
}
