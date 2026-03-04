#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

FAILED=0

echo "🔎 [GUARD]: Checking for skipped E2E tests..."
if rg -n --glob 'e2e/**/*.spec.ts' --glob 'e2e/**/*.spec.tsx' '\b(?:test|describe)\.skip\s*\(' e2e; then
  echo "🛑 [GUARD FAIL]: Found skipped E2E tests. Remove skip before merge."
  FAILED=1
else
  echo "✅ [GUARD]: No skipped E2E tests found."
fi

echo "🔎 [GUARD]: Checking for console.log in src/..."
if rg -n --glob 'src/**/*.ts' --glob 'src/**/*.tsx' '\bconsole\.log\s*\(' src; then
  echo "🛑 [GUARD FAIL]: Found console.log in src/. Use logger or remove debug logs."
  FAILED=1
else
  echo "✅ [GUARD]: No console.log found in src/."
fi

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi

echo "✅ [GUARD COMPLETE]: Quality guards passed."
