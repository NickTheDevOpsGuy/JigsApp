#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -gt 0 ]; then
  exec npx playwright test "$@"
fi

projects=(
  chromium
  chromium-tz-la
  chromium-tz-auckland
  firefox
  webkit
  msedge
)

for project in "${projects[@]}"; do
  echo
  echo "==> Running Playwright project: ${project}"
  npx playwright test --project="${project}"
done
