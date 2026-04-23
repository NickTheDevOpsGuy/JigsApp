#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -gt 0 ]; then
  exec npx playwright test "$@"
fi

projects=(
  chrome
  chrome-tz-la
  chrome-tz-auckland
  firefox
  safari
  edge
)

for project in "${projects[@]}"; do
  echo
  echo "==> Running Playwright project: ${project}"
  npx playwright test --project="${project}"
done
