import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { PRIORITIES, type Priority } from "../types";

interface PriorityTabsProps {
  active: Priority;
  onChange: (priority: Priority) => void;
  /** Number of tasks per priority, used for the little counter pill. */
  counts: Record<Priority, number>;
}

/** Accent colours per tab, kept literal so Tailwind can statically extract them. */
const TAB_ACCENT: Record<Priority, { active: string; dot: string }> = {
  High: { active: "border-rose-500 text-rose-300", dot: "bg-rose-500" },
  Medium: { active: "border-amber-500 text-amber-300", dot: "bg-amber-500" },
  Low: { active: "border-emerald-500 text-emerald-300", dot: "bg-emerald-500" },
};

/**
 * PriorityTabs – the three High / Medium / Low tabs.
 * Implemented as an accessible tablist (roving tabindex via arrow keys).
 */
export function PriorityTabs({ active, onChange, counts }: PriorityTabsProps) {
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const index = PRIORITIES.indexOf(active);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onChange(PRIORITIES[(index + 1) % PRIORITIES.length]);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onChange(PRIORITIES[(index - 1 + PRIORITIES.length) % PRIORITIES.length]);
    }
  }

  return (
    <div role="tablist" aria-label="Filter prioritas" onKeyDown={onKeyDown} className="flex gap-1 border-b border-slate-700">
      {PRIORITIES.map((priority) => {
        const isActive = priority === active;
        const accent = TAB_ACCENT[priority];
        return (
          <button
            key={priority}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(priority)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              isActive
                ? `${accent.active}`
                : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${accent.dot}`} aria-hidden="true" />
            {priority}
            <span className="rounded-full bg-slate-700/70 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {counts[priority]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
