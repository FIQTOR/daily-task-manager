import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";
import { CategoryBadge } from "./CategoryBadge";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

/**
 * TaskCard – a single draggable task row.
 *
 * `useSortable` gives us the transform/transition for the drag animation and,
 * importantly, splits the "drag handle" from the rest of the card: only the
 * handle carries the listeners, so clicking Edit/Delete/checkbox still works.
 */
export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift the card visually while it is being dragged.
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 rounded-xl border bg-slate-800/70 p-3.5 shadow-sm backdrop-blur transition-colors ${
        isDragging ? "border-indigo-500 ring-2 ring-indigo-500/40" : "border-slate-700/80 hover:border-slate-600"
      }`}
    >
      {/* Drag handle – the ONLY element with the sortable listeners. */}
      <button
        type="button"
        aria-label="Geser untuk mengubah urutan"
        className="mt-0.5 cursor-grab touch-none rounded-md p-1 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>

      {/* Completion checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`Tandai "${task.title}" sebagai selesai`}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-500 bg-slate-700 accent-indigo-500"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-medium transition ${
            task.completed ? "text-slate-500 line-through" : "text-slate-100"
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-400">{task.description}</p>
        )}
        <div className="mt-2">
          <CategoryBadge category={task.category} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit "${task.title}"`}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-sky-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" strokeLinecap="round" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Hapus "${task.title}"`}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-rose-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </li>
  );
}
