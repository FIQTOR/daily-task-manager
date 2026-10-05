#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-time toolchain bootstrap for building this Tauri app on Ubuntu 24.04.
#
#   bash scripts/setup-toolchain.sh
#
# Rust installs without sudo. The system libraries need your password, so this
# script only *prints* the apt command for them (it never calls sudo itself).
# ---------------------------------------------------------------------------
set -euo pipefail

echo "=== 1/3  Node.js ==="
if command -v node >/dev/null 2>&1; then
  echo "OK: node $(node -v), npm $(npm -v)"
else
  echo "MISSING: install Node.js 20+ first (https://nodejs.org)."
  exit 1
fi

echo
echo "=== 2/3  Rust toolchain (no sudo required) ==="
if command -v cargo >/dev/null 2>&1; then
  echo "OK: $(cargo --version)"
elif [ -x "$HOME/.cargo/bin/cargo" ]; then
  echo "OK: $("$HOME/.cargo/bin/cargo" --version)  (run: source \"\$HOME/.cargo/env\")"
else
  echo "Installing Rust via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
  echo "OK: $(cargo --version)"
fi

echo
echo "=== 3/3  Tauri system libraries (Ubuntu) ==="
# These are the packages Tauri's Linux backend needs. `pkg-config` and the
# glib/gtk/webkit dev headers are what `cargo build` fails on when missing.
REQUIRED=(
  pkg-config
  libwebkit2gtk-4.1-dev
  libgtk-3-dev
  libglib2.0-dev
  libsoup-3.0-dev
  libjavascriptcoregtk-4.1-dev
  build-essential
  curl
  wget
  file
  libxdo-dev
  libssl-dev
  libayatana-appindicator3-dev
  librsvg2-dev
)

MISSING=()
for pkg in "${REQUIRED[@]}"; do
  dpkg -s "$pkg" >/dev/null 2>&1 || MISSING+=("$pkg")
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "All system libraries are present."
  echo
  echo "Toolchain ready. Next:  npm install && npm run tauri dev"
else
  echo "Still MISSING (requires sudo):"
  echo
  echo "  sudo apt-get update"
  echo "  sudo apt-get install -y ${MISSING[*]}"
  echo
  echo "Then re-run this script, or go straight to:  npm run tauri dev"
  exit 1
fi
