# Daily Task Manager

A focus-oriented daily task board for **Ubuntu**, built with **Tauri v2 + React 19 + TypeScript + Tailwind CSS v4**.

Tasks are grouped into three priority tabs (**High / Medium / Low**) and can be **reordered by drag & drop** inside each tab to match your personal daily focus. The app can **register itself to launch on Ubuntu login** via `tauri-plugin-autostart`.

---

## 1. Feature overview

| Requirement | Implementation |
|---|---|
| 3 priority tabs | `src/components/PriorityTabs.tsx` (accessible `role="tablist"`) |
| Per-tab task list | `src/App.tsx` → `tasksForPriority()` |
| Drag & drop reordering | `@dnd-kit/core` + `@dnd-kit/sortable` in `src/components/SortableTaskList.tsx` |
| Task cards w/ category badge | `src/components/TaskCard.tsx`, `src/components/CategoryBadge.tsx` |
| Add / Edit / Delete modal | `src/components/TaskForm.tsx` |
| Local persistence | `tauri-plugin-store` (disk) with a `localStorage` fallback — `src/lib/storage.ts` |
| Ubuntu autostart | `tauri-plugin-autostart` — `src-tauri/src/lib.rs` + `src/hooks/useAutostart.ts` |

---

## 2. Prerequisites (Ubuntu 24.04)

Rust and the WebKit system libraries are required. **Rust needs no sudo; the system libraries do.**

```bash
# 1. Rust toolchain (installs to ~/.cargo, no sudo)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# 2. System dependencies for Tauri on Ubuntu (needs sudo)
sudo apt-get update
sudo apt-get install -y \
  pkg-config \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libglib2.0-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

> A helper that checks/installs the above is provided: `bash scripts/setup-toolchain.sh`

---

## 3. Scaffold & run

The project was generated with the official Tauri v2 template. To reproduce from scratch:

```bash
# Scaffold (Tauri v2, React + TypeScript, npm)
cd /home/fiqtor/AppDevelopment
npm create tauri-app@latest daily-task-manager -- --template react-ts --manager npm --identifier com.fiqtor.dailytask
cd daily-task-manager

# App dependencies
npm install

# Drag & drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers

# Tauri plugins (JS side)
npm install @tauri-apps/plugin-autostart @tauri-apps/plugin-store

# Tailwind CSS v4 (Vite plugin — no tailwind.config.js needed)
npm install -D tailwindcss @tailwindcss/vite
```

### Development

```bash
npm run tauri dev      # hot-reloading desktop window
npm run dev            # browser-only UI preview (autostart is disabled here)
npm run test:logic     # 15 assertions covering the reorder/ordering logic
```

### Production bundle (.deb / AppImage)

```bash
npm run tauri build
```

Outputs land in `src-tauri/target/release/bundle/`:

```
bundle/deb/Daily Task Manager_0.1.0_amd64.deb
bundle/appimage/Daily Task Manager_0.1.0_amd64.AppImage
```

Install the `.deb`:

```bash
sudo dpkg -i "src-tauri/target/release/bundle/deb/Daily Task Manager_0.1.0_amd64.deb"
```

---

## 4. Ubuntu autostart — how it works

`tauri-plugin-autostart` uses the standard **freedesktop** mechanism. When you turn the switch on (top-right of the header), the plugin writes:

```
~/.config/autostart/daily-task-manager.desktop
```

which is the canonical way for a desktop application to be started when the user logs in. No `systemd` unit and no `crontab` entry is involved.

### Rust side — `src-tauri/Cargo.toml`

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener    = "2"
tauri-plugin-autostart = "2"   # <— enables autostart
tauri-plugin-store     = "2"   # <— persistence
serde      = { version = "1", features = ["derive"] }
serde_json = "1"
```

### Rust side — `src-tauri/src/lib.rs`

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let autostart = tauri_plugin_autostart::Builder::new()
        // Filename of the generated .desktop entry.
        .app_name("daily-task-manager")
        // Extra argv passed when the OS launches the app at login.
        .args(["--autostart"]);

    // `macos_launcher` is `#[cfg(target_os = "macos")]` inside the plugin, so it
    // does NOT exist when compiling for Linux. It must be gated, otherwise you
    // get `error[E0599]: no method named macos_launcher found`.
    #[cfg(target_os = "macos")]
    let autostart = autostart.macos_launcher(tauri_plugin_autostart::MacosLauncher::LaunchAgent);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(autostart.build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

> **Portability note:** on Linux you can skip `macos_launcher` entirely and use the
> simpler `tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--autostart"]))`,
> because `init` takes `macos_launcher` as a plain argument and only *forwards* it
> on macOS. The `#[cfg]`-gated builder form above is what keeps a single codebase
> compiling on both Linux and macOS.

`src-tauri/src/main.rs` stays a thin wrapper:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    daily_task_manager_lib::run()
}
```

### Permissions — `src-tauri/capabilities/default.json`

Tauri v2 blocks plugin commands unless they are explicitly allowed. `autostart:default` grants `allow-enable`, `allow-disable` and `allow-is-enabled`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "store:default",
    "autostart:default"
  ]
}
```

### Frontend side — `src/hooks/useAutostart.ts`

```ts
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

await isEnabled(); // -> boolean
await enable();    // -> registers the .desktop file
await disable();   // -> removes it
```

The header switch (`src/components/AutostartToggle.tsx`) calls these through the `useAutostart()` hook.

### Verifying it manually

```bash
# Is the entry registered?
cat ~/.config/autostart/daily-task-manager.desktop

# Simulate a login-time launch without logging out
gtk-launch daily-task-manager
```

> **Note:** autostart points at the *installed* binary. Run `npm run tauri build` and install the `.deb` (or copy the AppImage to a stable path) *before* enabling the switch, otherwise the recorded path will point into `target/debug`.

---

## 5. Data model

```ts
interface Task {
  id: string;           // UUID v4
  title: string;
  description: string;
  category: string;     // "Tugas Kuliah" | "Produktif" | "Bisnis" | "Investing" | "Lainnya"
  priority: string;     // "High" | "Medium" | "Low"
  completed: boolean;
  order: number;        // internal: preserves drag & drop order across restarts
}
```

Stored as a JSON array under the key `tasks` in `tasks.json` inside the OS app-data
directory (`~/.local/share/com.fiqtor.dailytask/` on Linux).

---

## 6. Project structure

```
daily-task-manager/
├── src/
│   ├── App.tsx                       # tabs + list + CRUD orchestration
│   ├── main.tsx
│   ├── index.css                     # Tailwind v4 entry + design tokens
│   ├── types.ts                      # Task, Priority, Category
│   ├── components/
│   │   ├── PriorityTabs.tsx          # High / Medium / Low tablist
│   │   ├── SortableTaskList.tsx      # DndContext + SortableContext
│   │   ├── TaskCard.tsx              # draggable card
│   │   ├── CategoryBadge.tsx         # coloured category badge
│   │   ├── TaskForm.tsx              # Add / Edit modal
│   │   └── AutostartToggle.tsx       # autostart switch
│   ├── hooks/
│   │   └── useAutostart.ts
│   └── lib/
│       ├── id.ts                     # UUID v4 helper
│       ├── storage.ts                # tauri-plugin-store / localStorage
│       └── task-utils.ts             # ordering helpers
├── tests/
│   └── ordering.test.ts              # dependency-free assertions (npm run test:logic)
├── scripts/
│   ├── setup-toolchain.sh            # Rust + Ubuntu system deps checker
│   └── run-logic-tests.sh            # bundles + runs the logic tests
└── src-tauri/
    ├── Cargo.toml                    # plugin dependencies
    ├── tauri.conf.json
    ├── capabilities/default.json     # plugin permissions
    └── src/
        ├── main.rs                   # binary entry
        └── lib.rs                    # plugin + autostart setup
```

---

## 7. Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + N` | New task |
| `Esc` | Close the modal |
| `←` / `→` (on tabs) | Switch priority tab |
| `Space` then `↑`/`↓` then `Space` | Reorder a focused task via keyboard |
