#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

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

failed_projects=()
for project in "${projects[@]}"; do
  echo
  echo "==> Running Playwright project: ${project}"
  if ! npx playwright test --project="${project}"; then
    failed_projects+=("${project}")
  fi
done

if [ "${#failed_projects[@]}" -gt 0 ]; then
  echo
  echo "Failed Playwright projects: ${failed_projects[*]}"
  exit 1
fi
