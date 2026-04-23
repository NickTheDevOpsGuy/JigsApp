#!/usr/bin/env bash
set -euo pipefail

. "$(git rev-parse --show-toplevel)/scripts/playwright-env.sh"

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

maybe_enable_edge_channel

for project in "${projects[@]}"; do
  echo
  echo "==> Running Playwright project: ${project}"
  npx playwright test --project="${project}"
done
