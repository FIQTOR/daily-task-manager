import type { Category } from "../types";

/**
 * Visually distinct badge per category.
 * Tailwind v4 scans this file statically, so full class strings must appear
 * literally here (no dynamic `bg-${color}` construction).
 */
const CATEGORY_STYLES: Record<Category, string> = {
  "Tugas Kuliah": "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  Produktif: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  Bisnis: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  Investing: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  Lainnya: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_STYLES[category]}`}
    >
      {category}
    </span>
  );
}
