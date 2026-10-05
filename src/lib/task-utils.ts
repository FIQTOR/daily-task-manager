import { PRIORITIES, type Priority, type Task } from "../types";

/** Return the tasks of a given priority, sorted by their manual `order`. */
export function tasksForPriority(tasks: Task[], priority: Priority): Task[] {
  return tasks
    .filter((t) => t.priority === priority)
    .sort((a, b) => a.order - b.order);
}

/**
 * Rewrite the `order` values of every task so that, inside each priority
 * bucket, they are 0, 1, 2, ... This keeps the numbers small and stable after
 * arbitrary reorders / inserts / deletes.
 */
export function normalizeOrders(tasks: Task[]): Task[] {
  const next = tasks.map((t) => ({ ...t }));
  for (const priority of PRIORITIES) {
    tasksForPriority(next, priority).forEach((task, index) => {
      const ref = next.find((t) => t.id === task.id);
      if (ref) ref.order = index;
    });
  }
  return next;
}

/** Highest existing order inside a priority bucket, or -1 when empty. */
export function lastOrderFor(tasks: Task[], priority: Priority): number {
  const bucket = tasksForPriority(tasks, priority);
  return bucket.length === 0 ? -1 : bucket[bucket.length - 1].order;
}
