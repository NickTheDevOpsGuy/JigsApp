#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

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

echo "Running Phuzzle smoke E2E suite on Chromium..."
npx playwright test --project=chromium "${smoke_specs[@]}"
