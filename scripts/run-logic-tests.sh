#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Bundles tests/ordering.test.ts with rolldown (already present via Vite) and
# runs it with Node.
#
# Why bundle instead of running the TS directly? Node's ESM resolver requires
# explicit file extensions on relative imports, while the app source uses
# bundler-style extensionless imports (as Vite/tsc expect). Bundling bridges
# the two without contorting the app code.
# ---------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="$(mktemp -d)/ordering.test.mjs"
node_modules/.bin/rolldown tests/ordering.test.ts \
  --format esm \
  --platform node \
  --file "$OUT" >/dev/null

node "$OUT"
