#!/usr/bin/env bash
# Check gzip'd JS bundle size vs baseline. Fails CI if over budget.
# CI can set BASELINE_REF to compare against the target branch dynamically.
# Tiny gzip changes are expected, so budget allows a small configurable headroom.
set -euo pipefail
cd "$(dirname "$0")/.."

bundle_size_bytes() {
  local total=0
  local size
  shopt -s nullglob
  for f in dist/assets/*.js; do
    [[ "$f" == *.map ]] && continue
    size=$(gzip -c "$f" | wc -c)
    total=$((total + size))
  done
  shopt -u nullglob
  echo "$total"
}

bundle_size_kb() {
  local bytes="$1"
  echo $(((bytes + 1023) / 1024))
}

baseline_from_ref() {
  local ref="$1"
  local worktree
  worktree="$(mktemp -d)"

  cleanup() {
    git worktree remove --force "$worktree" >/dev/null 2>&1 || true
  }
  trap cleanup RETURN

  git worktree add --detach "$worktree" "$ref" >/dev/null 2>&1
  (
    cd "$worktree"
    npm ci --silent >/dev/null
    npm run build --silent >/dev/null 2>&1
    bundle_size_bytes
  )
}

BUNDLE_TOLERANCE_KB="${BUNDLE_TOLERANCE_KB:-8}"

if ! [[ "$BUNDLE_TOLERANCE_KB" =~ ^[0-9]+$ ]]; then
  echo "ERROR: BUNDLE_TOLERANCE_KB must be a non-negative integer"
  exit 1
fi

if [ "${CHECK_BUNDLE_USE_EXISTING_DIST:-}" = "1" ]; then
  if [ ! -d dist/assets ]; then
    echo "ERROR: CHECK_BUNDLE_USE_EXISTING_DIST=1 but dist/assets does not exist"
    exit 1
  fi
else
  npm run build --silent 2>/dev/null
fi
TOTAL_BYTES="$(bundle_size_bytes)"
TOTAL_KB="$(bundle_size_kb "$TOTAL_BYTES")"

if [ -n "${BASELINE_KB:-}" ]; then
  if ! [[ "$BASELINE_KB" =~ ^[0-9]+$ ]]; then
    echo "ERROR: BASELINE_KB must be a non-negative integer"
    exit 1
  fi
  BASELINE_BYTES=$((BASELINE_KB * 1024))
  BASELINE_LABEL="baseline"
elif [ -n "${BASELINE_REF:-}" ]; then
  BASELINE_BYTES="$(baseline_from_ref "$BASELINE_REF")"
  BASELINE_LABEL="$BASELINE_REF"
else
  BASELINE_BYTES=$((320 * 1024))
  BASELINE_LABEL="fallback baseline"
fi

BASELINE_KB="$(bundle_size_kb "$BASELINE_BYTES")"
BUDGET_BYTES=$((BASELINE_BYTES + BUNDLE_TOLERANCE_KB * 1024))
BUDGET_KB="$(bundle_size_kb "$BUDGET_BYTES")"

echo "Bundle gzip total: ${TOTAL_KB} kB (baseline: ${BASELINE_KB} kB, budget: ${BUDGET_KB} kB)"
if [ "$TOTAL_BYTES" -gt "$BUDGET_BYTES" ]; then
  echo "ERROR: Bundle size ${TOTAL_KB} kB exceeds ${BASELINE_LABEL} budget ${BUDGET_KB} kB"
  echo "       Baseline ${BASELINE_KB} kB + tolerance ${BUNDLE_TOLERANCE_KB} kB"
  exit 1
fi
echo "Bundle size OK"
