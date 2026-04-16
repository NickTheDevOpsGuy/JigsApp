#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

FAILED=0

search_matches() {
  local mode="$1"
  local pattern="$2"
  shift 2

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$@"
  else
    case "$mode" in
      skip_e2e)
        find src/app -type f \( -name "*.e2e.spec.ts" -o -name "*.e2e.spec.tsx" \) -print0 \
          | xargs -0 grep -En "$pattern"
        ;;
      console_src)
        find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 \
          | xargs -0 grep -En "$pattern"
        ;;
      *)
        return 1
        ;;
    esac
  fi
}

echo "🔎 [GUARD]: Checking for skipped E2E tests..."
if search_matches skip_e2e '\b(?:test|describe)\.skip\s*\(' \
  --glob 'src/app/**/*.e2e.spec.ts' \
  --glob 'src/app/**/*.e2e.spec.tsx' \
  --glob '!src/app/accessibility.e2e.spec.ts' \
  src/app; then
  echo "🛑 [GUARD FAIL]: Found skipped E2E tests. Remove skip before merge."
  FAILED=1
else
  echo "✅ [GUARD]: No skipped E2E tests found."
fi

echo "🔎 [GUARD]: Checking for console.log in src/..."
if search_matches console_src '\bconsole\.log\s*\(' --glob 'src/**/*.ts' --glob 'src/**/*.tsx' src; then
  echo "🛑 [GUARD FAIL]: Found console.log in src/. Use logger or remove debug logs."
  FAILED=1
else
  echo "✅ [GUARD]: No console.log found in src/."
fi

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi

echo "✅ [GUARD COMPLETE]: Quality guards passed."
