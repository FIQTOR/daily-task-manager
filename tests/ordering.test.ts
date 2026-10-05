/**
 * Standalone sanity tests for the ordering logic that backs drag & drop.
 *
 * Run with:  npm run test:logic
 *
 * These are deliberately dependency-free (plain assertions, no test runner) so
 * they can be executed in any environment, including CI where the GTK/WebKit
 * system libraries needed for a full Tauri build may not be installed.
 */

import { arrayMove } from "@dnd-kit/sortable";
import { lastOrderFor, normalizeOrders, tasksForPriority } from "../src/lib/task-utils";
import type { Priority, Task } from "../src/types";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
  }
}

function makeTask(id: string, priority: Priority, order: number, title = id): Task {
  return {
    id,
    title,
    description: "",
    category: "Produktif",
    priority,
    completed: false,
    order,
  };
}

/** Mirror of App.tsx `handleReorder` so the real algorithm is under test. */
function reorderWithinTab(tasks: Task[], priority: Priority, activeId: string, overId: string): Task[] {
  const visible = tasksForPriority(tasks, priority);
  const from = visible.findIndex((t) => t.id === activeId);
  const to = visible.findIndex((t) => t.id === overId);
  if (from === -1 || to === -1) return tasks;
  const reordered = arrayMove(visible, from, to);
  const orderById = new Map(reordered.map((t, index) => [t.id, index]));
  return normalizeOrders(
    tasks.map((t) => (orderById.has(t.id) ? { ...t, order: orderById.get(t.id)! } : t)),
  );
}

console.log("\nfiltering by priority tab");
{
  const tasks = [
    makeTask("a", "High", 0),
    makeTask("b", "Low", 0),
    makeTask("c", "High", 1),
    makeTask("d", "Medium", 0),
  ];
  check("High tab returns only High tasks", tasksForPriority(tasks, "High").every((t) => t.priority === "High"));
  check("High tab is sorted by order", tasksForPriority(tasks, "High").map((t) => t.id).join(",") === "a,c");
  check("Medium tab returns 1 task", tasksForPriority(tasks, "Medium").length === 1);
  check("Empty bucket returns []", tasksForPriority([makeTask("x", "High", 0)], "Low").length === 0);
}

console.log("\ndrag & drop reordering (within a tab)");
{
  const tasks = [makeTask("a", "High", 0), makeTask("b", "High", 1), makeTask("c", "High", 2)];
  const moved = reorderWithinTab(tasks, "High", "a", "c");
  check("moving first onto last reorders to b,c,a", tasksForPriority(moved, "High").map((t) => t.id).join(",") === "b,c,a");
  check("order values are re-normalized 0,1,2", tasksForPriority(moved, "High").map((t) => t.order).join(",") === "0,1,2");

  const movedUp = reorderWithinTab(tasks, "High", "c", "a");
  check("moving last onto first reorders to c,a,b", tasksForPriority(movedUp, "High").map((t) => t.id).join(",") === "c,a,b");
}

console.log("\nreordering must NOT leak across tabs");
{
  const tasks = [
    makeTask("h1", "High", 0),
    makeTask("m1", "Medium", 0),
    makeTask("h2", "High", 1),
    makeTask("m2", "Medium", 1),
  ];
  const moved = reorderWithinTab(tasks, "High", "h1", "h2");
  check("High order becomes h2,h1", tasksForPriority(moved, "High").map((t) => t.id).join(",") === "h2,h1");
  check(
    "Medium tasks keep their relative order",
    tasksForPriority(moved, "Medium").map((t) => t.id).join(",") === "m1,m2",
  );
  check("Medium order values untouched", tasksForPriority(moved, "Medium").map((t) => t.order).join(",") === "0,1");
  check("total task count unchanged", moved.length === tasks.length);
}

console.log("\nordering helpers");
{
  const tasks = [makeTask("a", "High", 7), makeTask("b", "High", 3), makeTask("c", "Medium", 9)];
  const normalized = normalizeOrders(tasks);
  check("normalizeOrders compacts each bucket from 0", tasksForPriority(normalized, "High").map((t) => t.order).join(",") === "0,1");
  check("normalizeOrders handles other buckets too", tasksForPriority(normalized, "Medium")[0].order === 0);
  check("lastOrderFor returns -1 for an empty bucket", lastOrderFor(tasks, "Low") === -1);
  check("lastOrderFor returns the max order in a bucket", lastOrderFor(tasks, "High") === 7);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
