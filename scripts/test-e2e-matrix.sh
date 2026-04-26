#!/usr/bin/env bash
set -euo pipefail

<<<<<<< HEAD
cd "$(git rev-parse --show-toplevel)"
=======
. "$(git rev-parse --show-toplevel)/scripts/playwright-env.sh"
>>>>>>> a993bc024c51cda3263b81d4dc23a1edfb3bf8bf

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

<<<<<<< HEAD
failed_projects=()
=======
maybe_enable_edge_channel

>>>>>>> a993bc024c51cda3263b81d4dc23a1edfb3bf8bf
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
