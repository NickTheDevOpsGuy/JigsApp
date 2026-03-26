#!/usr/bin/env bash
# Check gzip'd JS bundle size vs baseline. Fails CI if over limit.
set -e
BASELINE_KB=${BASELINE_KB:-280}
cd "$(dirname "$0")/.."
npm run build --silent 2>/dev/null
TOTAL=0
for f in dist/assets/*.js; do
  [ -f "$f" ] || continue
  [[ "$f" == *.map ]] && continue
  SZ=$(gzip -c "$f" | wc -c)
  TOTAL=$((TOTAL + SZ))
done
TOTAL_KB=$((TOTAL / 1024))
echo "Bundle gzip total: ${TOTAL_KB} kB (baseline: ${BASELINE_KB} kB)"
if [ "$TOTAL_KB" -gt "$BASELINE_KB" ]; then
  echo "ERROR: Bundle size ${TOTAL_KB} kB exceeds baseline ${BASELINE_KB} kB"
  exit 1
fi
echo "Bundle size OK"
