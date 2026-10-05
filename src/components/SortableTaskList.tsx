import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task } from "../types";
import { TaskCard } from "./TaskCard";

interface SortableTaskListProps {
  /** Tasks of the currently active priority tab, already ordered. */
  tasks: Task[];
  onReorder: (activeId: string, overId: string) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

/**
 * SortableTaskList – the drag-and-drop task list.
 *
 * Design notes:
 *  - Sensors: PointerSensor with a 5px activation distance so that a plain
 *    click on the checkbox / buttons is never interpreted as a drag, plus
 *    KeyboardSensor so reordering is accessible via the keyboard (space to
 *    lift, arrows to move, space to drop).
 *  - Modifiers restrict movement to the vertical axis and keep the item inside
 *    the list bounds.
 *  - We translate the drag result into a simple `(activeId, overId)` callback
 *    and let the parent own the array mutation.
 */
export function SortableTaskList({
  tasks,
  onReorder,
  onToggle,
  onEdit,
  onDelete,
}: SortableTaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // A tiny threshold prevents accidental drags when the user just clicks.
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Stable array of ids for SortableContext.
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

/** Re-exported so the parent can compute the new array without extra imports. */
export { arrayMove };
