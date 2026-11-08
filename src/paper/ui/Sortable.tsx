import type { CSSProperties, ReactNode } from 'react';
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
  const ids = items.map(getId);
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
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled, transition: { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } });
  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition, position: 'relative', zIndex: isDragging ? 5 : undefined };
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
