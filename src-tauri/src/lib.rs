//! Tauri application entry point (the "Rust side").
//!
//! In Tauri v2 the *library* holds all the logic and `src/main.rs` is a thin
//! binary wrapper around it. This split is what allows the same code to be
//! reused for desktop and mobile targets, so keep the logic here.
//!
//! Plugins registered below:
//!   * `tauri_plugin_opener`     – open links/files with the OS.
//!   * `tauri_plugin_store`      – on-disk JSON persistence for the task list.
//!   * `tauri_plugin_autostart`  – register the app to run on Ubuntu login.
//!
//! IMPORTANT: every plugin must *also* be allowed in
//! `src-tauri/capabilities/default.json`, otherwise the frontend calls are
//! rejected at runtime by Tauri's permission system.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Build the autostart plugin.
    //
    // On Linux this writes an XDG autostart entry to:
    //     ~/.config/autostart/<app_name>.desktop
    //
    // `app_name` defaults to the bundle `productName` ("Daily Task Manager").
    // We set it explicitly to a filesystem-friendly value so the generated
    // filename has no spaces.
    //
    // `args` are extra CLI arguments passed to the app when the OS starts it at
    // login. Use them to detect an autostart launch later (e.g. to start
    // minimised) — read them in Rust from `std::env::args()`.
    let autostart = tauri_plugin_autostart::Builder::new()
        .app_name("daily-task-manager")
        .args(["--autostart"]);

    // `macos_launcher` is `#[cfg(target_os = "macos")]` in the plugin, so it
    // only exists when compiling FOR macOS. Calling it unconditionally fails
    // to compile on Linux with E0599. Gate it to keep the code portable.
    #[cfg(target_os = "macos")]
    let autostart = autostart.macos_launcher(tauri_plugin_autostart::MacosLauncher::LaunchAgent);

    tauri::Builder::default()
        // --- Built-in / template plugins ---------------------------------
        .plugin(tauri_plugin_opener::init())
        // --- Persistence --------------------------------------------------
        // `Builder::default().build()` gives us the default store; the
        // frontend opens the concrete JSON file via `load("tasks.json")`,
        // which resolves to <AppData>/tasks.json
        // (on Linux: ~/.local/share/com.fiqtor.dailytask/tasks.json).
        .plugin(tauri_plugin_store::Builder::default().build())
        // --- Autostart ----------------------------------------------------
        .plugin(autostart.build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
