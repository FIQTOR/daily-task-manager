// Prevents an additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! Thin binary entry point.
//!
//! All the real setup (plugins, autostart registration, etc.) lives in
//! `src/lib.rs` — this file only exists so `cargo build` produces an
//! executable. See `lib.rs` for the autostart configuration.

fn main() {
    daily_task_manager_lib::run()
}
