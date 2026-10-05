import { useEffect, useRef, useState, type FormEvent } from "react";
import { CATEGORIES, PRIORITIES, type Category, type Priority, type Task, type TaskDraft } from "../types";

interface TaskFormProps {
  /** `null` => "Add" mode. A task => "Edit" mode. */
  editing: Task | null;
  /** Priority tab that was active when the user opened the modal. */
  defaultPriority: Priority;
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
}

/**
 * TaskForm – the Add / Edit modal.
 *
 * It is a controlled component: the parent owns the task list, this component
 * owns only the *draft* being typed. On submit it hands back a `TaskDraft`
 * (no id / no order) and lets the store assign those.
 */
export function TaskForm({ editing, defaultPriority, onSubmit, onCancel }: TaskFormProps) {
  const isEdit = editing !== null;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState<Category>(editing?.category ?? "Produktif");
  const [priority, setPriority] = useState<Priority>(editing?.priority ?? defaultPriority);
  const [titleError, setTitleError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  // Re-fill the fields whenever a different task is opened for editing.
  useEffect(() => {
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setCategory(editing?.category ?? "Produktif");
    setPriority(editing?.priority ?? defaultPriority);
    setTitleError(null);
  }, [editing, defaultPriority]);

  // Focus the title field when the modal opens.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape – a small but expected desktop nicety.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Judul tugas tidak boleh kosong.");
      titleRef.current?.focus();
      return;
    }
    onSubmit({
      title: trimmed,
      description: description.trim(),
      category,
      priority,
      completed: editing?.completed ?? false,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Click on the backdrop (not the panel) closes the modal.
        if (e.target === e.currentTarget) onCancel();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <h2 id="task-form-title" className="text-lg font-semibold text-slate-100">
            {isEdit ? "Edit Tugas" : "Tambah Tugas Baru"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-slate-300">
              Judul <span className="text-rose-400">*</span>
            </label>
            <input
              id="task-title"
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="mis. Review materi kalkulus"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            {titleError && <p className="mt-1.5 text-xs text-rose-400">{titleError}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="mb-1.5 block text-sm font-medium text-slate-300">
              Deskripsi
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detail singkat, link, atau catatan..."
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Category + Priority side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-category" className="mb-1.5 block text-sm font-medium text-slate-300">
                Kategori
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-priority" className="mb-1.5 block text-sm font-medium text-slate-300">
                Prioritas
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <footer className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.98]"
            >
              {isEdit ? "Simpan Perubahan" : "Tambah Tugas"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
