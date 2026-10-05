/**
 * Persistence layer.
 *
 * Storage strategy (see README for the full explanation):
 *
 *  1. In production (a real Tauri window) we persist to disk through the
 *     official `tauri-plugin-store`. This writes a JSON file to the OS app
 *     data directory (on Linux: ~/.local/share/com.fiqtor.dailytask/), so the
 *     data survives app updates and is shared by the autostart instance too.
 *
 *  2. When the app is opened in a plain browser (`npm run dev` without Tauri)
 *     the Tauri IPC bridge is absent, so we transparently fall back to
 *     `localStorage`. This keeps `vite` development usable.
 */

import { load, type Store } from "@tauri-apps/plugin-store";
import type { Task } from "../types";

const STORE_FILE = "tasks.json";
const STORE_KEY = "tasks";
const LS_KEY = "daily-task-manager:tasks";

/** True when running inside a Tauri webview (IPC available). */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let storePromise: Promise<Store> | null = null;

/** Lazily open (and cache) the on-disk store. */
function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(STORE_FILE, { autoSave: false });
  }
  return storePromise;
}

/**
 * Defensive parsing: the stored JSON is user-writable, so never trust its
 * shape. Anything malformed is dropped rather than crashing the app.
 */
function sanitize(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Task => {
    if (typeof item !== "object" || item === null) return false;
    const t = item as Record<string, unknown>;
    return (
      typeof t.id === "string" &&
      typeof t.title === "string" &&
      typeof t.description === "string" &&
      typeof t.category === "string" &&
      typeof t.priority === "string" &&
      typeof t.completed === "boolean"
    );
  });
}

/** Load every task. Returns [] when nothing has been saved yet. */
export async function loadTasks(): Promise<Task[]> {
  try {
    if (isTauri()) {
      const store = await getStore();
      const raw = await store.get<unknown>(STORE_KEY);
      return sanitize(raw);
    }
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch (error) {
    console.error("[storage] failed to load tasks:", error);
    return [];
  }
}

/** Persist the full task list (last-write-wins snapshot). */
export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    if (isTauri()) {
      const store = await getStore();
      await store.set(STORE_KEY, tasks);
      await store.save();
      return;
    }
    window.localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("[storage] failed to save tasks:", error);
  }
}
