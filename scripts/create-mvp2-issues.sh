#!/usr/bin/env bash
# Create GitHub issues from mvp2-issues.json using gh CLI
# Usage: ./scripts/create-mvp2-issues.sh
# Requires: gh (GitHub CLI), jq

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ISSUES_JSON="${REPO_ROOT}/.github/mvp2-issues.json"

if ! command -v gh &>/dev/null; then
  echo "Error: gh CLI not found. Install from https://cli.github.com/"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "Error: jq not found. Install with: brew install jq"
  exit 1
fi

if [[ ! -f "$ISSUES_JSON" ]]; then
  echo "Error: $ISSUES_JSON not found"
  exit 1
fi

cd "$REPO_ROOT"

count=$(jq 'length' "$ISSUES_JSON")
echo "Creating $count issues from mvp2-issues.json..."
echo ""

for i in $(seq 0 $((count - 1))); do
  title=$(jq -r ".[$i].title" "$ISSUES_JSON")
  body=$(jq -r ".[$i].body" "$ISSUES_JSON")

  echo "Creating: $title"
  args=(--title "$title" --body "$body")
  while IFS= read -r label; do
    [[ -n "$label" ]] && args+=(--label "$label")
  done < <(jq -r ".[$i].labels[]?" "$ISSUES_JSON")

  gh issue create "${args[@]}"
  echo "  Done."
  echo ""
done

echo "All $count issues created."
