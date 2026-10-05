#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Installs the Tauri build dependencies for this app on Ubuntu 24.04.
#
# RUN THIS YOURSELF in your own terminal:
#
#     sudo bash /home/fiqtor/AppDevelopment/daily-task-manager/scripts/install-deps.sh
#
# It is the only step that needs root, and it is deliberately kept to a single
# `apt-get install` so you can read exactly what it does before running it.
# ---------------------------------------------------------------------------
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must run as root. Use:  sudo bash $0" >&2
  exit 1
fi

echo "=== Installing Tauri build dependencies ==="

apt-get update

apt-get install -y \
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

echo
echo "=== Verifying ==="
for pkg in pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev libglib2.0-dev \
           libsoup-3.0-dev libjavascriptcoregtk-4.1-dev libxdo-dev \
           libssl-dev libayatana-appindicator3-dev librsvg2-dev; do
  if dpkg -s "$pkg" >/dev/null 2>&1; then
    echo "  OK   $pkg"
  else
    echo "  FAIL $pkg"
    exit 1
  fi
done

echo
echo "All dependencies installed."
echo
echo "Next steps (as your normal user, NOT root):"
echo "  source \"\$HOME/.cargo/env\""
echo "  cd /home/fiqtor/AppDevelopment/daily-task-manager"
echo "  npm run tauri dev"
