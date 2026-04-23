#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

layout_spec="src/app/responsive.responsive.e2e.spec.ts"

projects=(
  chrome
  firefox
  safari
  edge
  safari-iphone-responsive
  safari-ipad-responsive
  chrome-android-responsive
  chrome-android-tablet-responsive
)

project_args=()
for project in "${projects[@]}"; do
  project_args+=(--project="${project}")
done

echo "Running responsive layout suite across desktop, iPhone, iPad, Android phone, and Android tablet projects..."
npx playwright test "${project_args[@]}" "${layout_spec}"
