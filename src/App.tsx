import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AutostartToggle } from "./components/AutostartToggle";
import { PriorityTabs } from "./components/PriorityTabs";
import { SortableTaskList, arrayMove } from "./components/SortableTaskList";
import { TaskForm } from "./components/TaskForm";
import { createId } from "./lib/id";
import { loadTasks, saveTasks } from "./lib/storage";
import { lastOrderFor, normalizeOrders, tasksForPriority } from "./lib/task-utils";
import { type Priority, type Task, type TaskDraft } from "./types";

/** UI state for the Add/Edit modal. */
type ModalState = { open: false } | { open: true; editing: Task | null };

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activePriority, setActivePriority] = useState<Priority>("High");
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [hydrated, setHydrated] = useState(false);

  // ── Persistence ────────────────────────────────────────────────────────────
  // Load once on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await loadTasks();
      if (!cancelled) {
        setTasks(normalizeOrders(stored));
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save on every change, but only after the initial load (otherwise we would
  // immediately overwrite the file with the empty initial state).
  const isFirstSave = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    void saveTasks(tasks);
  }, [tasks, hydrated]);

  // ── Derived data ───────────────────────────────────────────────────────────
  /** Tasks of the active tab, ordered by their manual `order`. */
  const visibleTasks = useMemo(
    () => tasksForPriority(tasks, activePriority),
    [tasks, activePriority],
  );

  /** Task count per tab, for the tab pills. */
  const counts = useMemo(() => {
    const result = { High: 0, Medium: 0, Low: 0 } as Record<Priority, number>;
    for (const task of tasks) result[task.priority] += 1;
    return result;
  }, [tasks]);

  const openAdd = useCallback(() => setModal({ open: true, editing: null }), []);
  const openEdit = useCallback((task: Task) => setModal({ open: true, editing: task }), []);
  const closeModal = useCallback(() => setModal({ open: false }), []);

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  /** Add a new task to the end of its priority bucket, or update an existing one. */
  const handleSubmit = useCallback(
    (draft: TaskDraft) => {
      setTasks((prev) => {
        const editing = modal.open ? modal.editing : null;

        if (editing) {
          // UPDATE: if the priority changed, move the task to the end of the new bucket.
          const moved = editing.priority !== draft.priority;
          const updated: Task = {
            ...editing,
            ...draft,
            order: moved ? lastOrderFor(prev, draft.priority) + 1 : editing.order,
          };
          return normalizeOrders(prev.map((t) => (t.id === editing.id ? updated : t)));
        }

        // CREATE
        const created: Task = {
          ...draft,
          id: createId(),
          order: lastOrderFor(prev, draft.priority) + 1,
        };
        return normalizeOrders([...prev, created]);
      });

      // Follow the task to its tab so the user sees the result immediately.
      setActivePriority(draft.priority);
      setModal({ open: false });
    },
    [modal],
  );

  const handleDelete = useCallback((id: string) => {
    setTasks((prev) => normalizeOrders(prev.filter((t) => t.id !== id)));
  }, []);

  const handleToggle = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  /**
   * Reorder within the active tab.
   *
   * The DnD library reports the moved id and the id it was dropped onto. We
   * apply the move to the *visible* (filtered) array, then splice the new
   * ordering back into the full list and re-normalize the `order` values.
   */
  const handleReorder = useCallback(
    (activeId: string, overId: string) => {
      setTasks((prev) => {
        const visible = tasksForPriority(prev, activePriority);
        const from = visible.findIndex((t) => t.id === activeId);
        const to = visible.findIndex((t) => t.id === overId);
        if (from === -1 || to === -1) return prev;

        const reordered = arrayMove(visible, from, to);

        // Rebuild the global list: everything not in this tab keeps its place,
        // the tab's tasks get the freshly computed order values.
        const orderById = new Map(reordered.map((t, index) => [t.id, index]));
        return normalizeOrders(
          prev.map((t) => (orderById.has(t.id) ? { ...t, order: orderById.get(t.id)! } : t)),
        );
      });
    },
    [activePriority],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  const remaining = visibleTasks.filter((t) => !t.completed).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900/60 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-50">Daily Task Manager</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Fokus harian — {remaining} tugas belum selesai di tab {activePriority}.
          </p>
        </div>
        <AutostartToggle />
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <PriorityTabs active={activePriority} onChange={setActivePriority} counts={counts} />
      </div>

      {/* List */}
      <main className="scroll-slim flex-1 overflow-y-auto px-6 py-5">
        {visibleTasks.length === 0 ? (
          <EmptyState priority={activePriority} onAdd={openAdd} />
        ) : (
          <SortableTaskList
            tasks={visibleTasks}
            onReorder={handleReorder}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Floating "add" button */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 transition hover:bg-indigo-500 active:scale-95"
        aria-label="Tambah tugas"
        title="Tambah tugas (Ctrl/Cmd + N)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>

      {/* Add / Edit modal */}
      {modal.open && (
        <TaskForm
          editing={modal.editing}
          defaultPriority={activePriority}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      )}

      {/* Keyboard shortcut: Ctrl/Cmd + N opens the add form */}
      <KeyboardShortcuts onAdd={openAdd} disabled={modal.open} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small presentational helpers                                               */
/* -------------------------------------------------------------------------- */

function EmptyState({ priority, onAdd }: { priority: Priority; onAdd: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="rounded-2xl border border-dashed border-slate-700 p-8">
        <p className="text-base font-medium text-slate-300">Belum ada tugas berprioritas {priority}</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Tambahkan tugas, lalu geser-letakkan (drag &amp; drop) untuk mengatur urutan fokus harianmu.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Tambah Tugas
        </button>
      </div>
    </div>
  );
}

/** Invisible component that wires the global Ctrl/Cmd + N shortcut. */
function KeyboardShortcuts({ onAdd, disabled }: { onAdd: () => void; disabled: boolean }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (!disabled) onAdd();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAdd, disabled]);

  return null;
}
