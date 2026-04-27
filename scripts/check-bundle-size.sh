#!/usr/bin/env bash
# Check gzip'd JS bundle size vs baseline. Fails CI if over limit.
# CI can set BASELINE_REF to compare against the target branch dynamically.
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
  echo $((bytes / 1024))
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

if [ "${CHECK_BUNDLE_USE_EXISTING_DIST:-}" = "1" ]; then
  if [ ! -d dist/assets ]; then
    echo "ERROR: CHECK_BUNDLE_USE_EXISTING_DIST=1 but dist/assets does not exist"
    exit 1
  fi
else
  npm run build --silent 2>/dev/null
fi
TOTAL_KB=$(bundle_size_kb "$(bundle_size_bytes)")

if [ -n "${BASELINE_KB:-}" ]; then
  BASELINE_LABEL="baseline"
elif [ -n "${BASELINE_REF:-}" ]; then
  BASELINE_KB=$(bundle_size_kb "$(baseline_from_ref "$BASELINE_REF")")
  BASELINE_LABEL="$BASELINE_REF"
else
  BASELINE_KB=320
  BASELINE_LABEL="fallback baseline"
fi

echo "Bundle gzip total: ${TOTAL_KB} kB (baseline: ${BASELINE_KB} kB)"
if [ "$TOTAL_KB" -gt "$BASELINE_KB" ]; then
  echo "ERROR: Bundle size ${TOTAL_KB} kB exceeds ${BASELINE_LABEL} ${BASELINE_KB} kB"
  exit 1
fi
echo "Bundle size OK"
