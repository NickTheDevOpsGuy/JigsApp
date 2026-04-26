#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
. "${PWD}/scripts/playwright-env.sh"

if [ "$#" -gt 0 ]; then
  exec npx playwright test "$@"
fi

smoke_specs=(
  src/app/App.e2e.spec.ts
  src/app/accessibility.e2e.spec.ts
  src/app/screens/Play/PlayScreen.e2e.spec.ts
  src/app/screens/Menu/MenuScreen.e2e.spec.ts
  src/app/screens/Stats/StatsScreen.e2e.spec.ts
)

echo "Running Phuzzle smoke E2E suite across Chrome, Firefox, Safari/WebKit, and Edge-compatible Chromium..."
projects=(
  chrome
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
  echo "Running Phuzzle smoke E2E suite on ${project}..."
  if ! npx playwright test --project="${project}" "${smoke_specs[@]}"; then
    failed_projects+=("${project}")
  fi
done

if [ "${#failed_projects[@]}" -gt 0 ]; then
  echo
  echo "Failed smoke E2E projects: ${failed_projects[*]}"
  exit 1
fi
