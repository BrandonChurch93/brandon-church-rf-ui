import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Announcements,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandle } from './display';
import { announce } from '@/paper/lib/announce';

export interface SortableRenderProps {
  /** Spread on the element that moves. */
  setNodeRef: (el: HTMLElement | null) => void;
  style: CSSProperties;
  isDragging: boolean;
  /** The drag handle: the only element that starts a drag, keyboard included. */
  handle: ReactNode;
}

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  onReorder: (ids: string[], moved: { name: string; to: number }) => void;
  render: (item: T, props: SortableRenderProps, index: number) => ReactNode;
  layout?: 'vertical' | 'grid';
  /** Noun for the handle label: "Reorder Employee Registration". */
  disabled?: boolean;
}

/** Drag to reorder with a handle; pointer, touch (200 ms hold) and keyboard (Space, arrows, Space). */
export function SortableList<T>({ items, getId, getName, onReorder, render, layout = 'vertical', disabled }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // dnd-kit compares the id list by reference. A fresh array on every render reads as "the items
  // changed", and each item then keeps an inline `transition: transform 0ms` that overrides the
  // card's own hover transitions. The list keeps its reference while its ids stay the same.
  const idKey = items.map(getId).join('\u0000');
  const ids = useMemo(() => (idKey ? idKey.split('\u0000') : []), [idKey]);
  const nameOf = (id: UniqueIdentifier) => {
    const it = items.find((x) => getId(x) === id);
    return it ? getName(it) : 'item';
  };
  const position = (id: UniqueIdentifier | undefined) => (id === undefined ? 0 : ids.indexOf(String(id)) + 1);
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}. Position ${position(active.id)} of ${ids.length}. Use the arrow keys to move, Space to drop, Escape to cancel.`,
    onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} is over position ${position(over.id)} of ${ids.length}.` : `${nameOf(active.id)} is no longer over a position.`),
    onDragEnd: ({ active, over }) => (over ? `Moved ${nameOf(active.id)} to position ${position(over.id)} of ${ids.length}.` : `${nameOf(active.id)} was dropped.`),
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
  };
  const onEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    const next = arrayMove(ids, from, to);
    onReorder(next, { name: nameOf(active.id), to: to + 1 });
    announce(`Moved ${nameOf(active.id)} to position ${to + 1} of ${ids.length}`);
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd} accessibility={{ announcements, screenReaderInstructions: { draggable: 'To reorder, press Space, move with the arrow keys, then press Space to drop or Escape to cancel.' } }}>
      <SortableContext items={ids} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy} disabled={disabled}>
        {items.map((item, i) => (
          <SortableItem key={getId(item)} id={getId(item)} name={getName(item)} disabled={disabled}>
            {(props) => render(item, props, i)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, name, disabled, children }: { id: string; name: string; disabled?: boolean; children: (p: SortableRenderProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isSorting } = useSortable({ id, disabled, transition: { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } });
  const translate = CSS.Translate.toString(transform);
  const live = useLiveTransition(transition, translate, isSorting);
  const style: CSSProperties = { transform: translate, transition: live, position: 'relative', zIndex: isDragging ? 5 : undefined };
  const handle = (
    <DragHandle
      ref={setActivatorNodeRef}
      label={`Reorder ${name}`}
      {...attributes}
      {...listeners}
      aria-roledescription="sortable"
      disabled={disabled}
    />
  );
  return <>{children({ setNodeRef, style, isDragging, handle })}</>;
}

/** Longer than the 320 ms sort transition, so a drop or a reorder finishes its settle first. */
const SETTLE_MS = 400;

/**
 * dnd-kit's inline transition, only while it is doing something. After a drop or a reorder it
 * leaves its transition on the element until the next render, and an inline `transition` replaces
 * every transition the element's stylesheet declares (hover included). Once nothing has moved for
 * SETTLE_MS, the element goes back to its stylesheet transitions.
 */
function useLiveTransition(transition: string | undefined, transform: string | undefined, isSorting: boolean) {
  const [settled, setSettled] = useState(false);
  const [seen, setSeen] = useState({ transition, transform, isSorting });
  if (seen.transition !== transition || seen.transform !== transform || seen.isSorting !== isSorting) {
    setSeen({ transition, transform, isSorting });
    setSettled(false);
  }
  useEffect(() => {
    if (!transition || isSorting || settled) return;
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [transition, transform, isSorting, settled]);
  return settled ? undefined : transition;
}
