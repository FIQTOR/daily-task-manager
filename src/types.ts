/**
 * Domain model for the Daily Task Manager.
 * Keeping the vocabulary in one place means the UI, the form and the
 * persistence layer all agree on the exact same string literals.
 */

/** Priority tabs shown at the top of the app. */
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Category options for the <select> inside the task form. */
export const CATEGORIES = [
  "Tugas Kuliah",
  "Produktif",
  "Bisnis",
  "Investing",
  "Lainnya",
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * A single task.
 *
 * `id`         – UUID v4 generated on creation.
 * `title`      – short, required label.
 * `description`– optional longer text.
 * `category`   – one of CATEGORIES.
 * `priority`   – one of PRIORITIES (determines which tab the task lives in).
 * `completed`  – checkbox state.
 *
 * `order` is *not* part of the required data model, but it is needed to make
 * drag-and-drop reordering survive an app restart. It is an implementation
 * detail of the list rendering (see `orderTasks` in lib/task-utils.ts).
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  completed: boolean;
  order: number;
}

/** Shape produced by the task form (no id/order yet – those are assigned by the store). */
export type TaskDraft = Omit<Task, "id" | "order">;
