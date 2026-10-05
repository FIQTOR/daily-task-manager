/**
 * `useAutostart` – React wrapper around `tauri-plugin-autostart`.
 *
 * Responsibilities:
 *  - read the current OS autostart status when the app boots;
 *  - expose `enable()` / `disable()` / `toggle()` to the UI;
 *  - degrade gracefully when the plugin is unavailable (e.g. running the UI in
 *    a plain browser during `npm run dev`, where there is no Tauri IPC).
 *
 * On Ubuntu/Linux the plugin installs a `.desktop` file in
 * `~/.config/autostart/` — that is the standard freedesktop mechanism for
 * "launch this application when the user logs in".
 */

import { useCallback, useEffect, useState } from "react";
import {
  disable as autostartDisable,
  enable as autostartEnable,
  isEnabled as autostartIsEnabled,
} from "@tauri-apps/plugin-autostart";

/** True when running inside a Tauri webview (IPC available). */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface UseAutostartResult {
  /** Whether the OS will start the app on login. `null` while unknown. */
  enabled: boolean | null;
  /** True while a plugin call is in flight. */
  busy: boolean;
  /** Non-null when the last operation failed (e.g. missing permissions). */
  error: string | null;
  /** False in a plain browser, where autostart cannot be controlled. */
  supported: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  toggle: () => Promise<void>;
}

export function useAutostart(): UseAutostartResult {
  const supported = isTauri();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read the initial status once on mount.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    void (async () => {
      try {
        const current = await autostartIsEnabled();
        if (!cancelled) setEnabled(current);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await autostartEnable();
      setEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await autostartDisable();
      setEnabled(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (enabled) await disable();
    else await enable();
  }, [enabled, enable, disable]);

  return { enabled, busy, error, supported, enable, disable, toggle };
}
