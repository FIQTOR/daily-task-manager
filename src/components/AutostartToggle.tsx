import { useAutostart } from "../hooks/useAutostart";

/**
 * AutostartToggle – a switch that registers/unregisters the app with the OS
 * login startup. Backed by `tauri-plugin-autostart` (see src-tauri/src/lib.rs).
 */
export function AutostartToggle() {
  const { enabled, busy, error, supported, toggle } = useAutostart();

  // Outside Tauri (plain `vite` dev server) there is nothing to control.
  if (!supported) {
    return (
      <span className="text-xs text-slate-500" title="Hanya tersedia di aplikasi desktop Tauri">
        Autostart: n/a
      </span>
    );
  }

  const on = enabled === true;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={busy || enabled === null}
        onClick={() => void toggle()}
        title={on ? "Matikan autostart saat login" : "Jalankan otomatis saat login Ubuntu"}
        className="group flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 disabled:opacity-50"
      >
        {/* Track + knob */}
        <span
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
            on ? "bg-indigo-500" : "bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
              on ? "translate-x-3.5" : "translate-x-0.5"
            }`}
          />
        </span>
        {busy ? "Menyimpan..." : on ? "Autostart aktif" : "Autostart mati"}
      </button>
      {error && <span className="max-w-[220px] text-right text-[11px] text-rose-400">{error}</span>}
    </div>
  );
}
