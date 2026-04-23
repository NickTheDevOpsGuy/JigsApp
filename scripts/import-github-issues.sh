#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

usage() {
  cat <<'EOF'
Usage:
  bash ./scripts/import-github-issues.sh <issues.json> [--repo owner/name] [--dry-run]

JSON formats accepted:
  1. An array of issue objects
  2. An object with an "issues" array

Each issue object supports:
  - title: string (required)
  - body: string (optional)
  - labels: string[] (optional)
  - assignees: string[] (optional)

Example:
  bash ./scripts/import-github-issues.sh ./docs/examples/github-issues.sample.json --dry-run
EOF
}

fail() {
  echo "🛑 $1" >&2
  exit 1
}

pass() {
  echo "✅ $1"
}

require_cmd() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "Missing required command \`$cmd\`. ${hint}"
  fi
}

json_file=""
repo=""
dry_run="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      [ "$#" -ge 2 ] || fail "--repo requires a value like owner/name."
      repo="$2"
      shift 2
      ;;
    --dry-run)
      dry_run="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      fail "Unknown flag: $1"
      ;;
    *)
      if [ -n "$json_file" ]; then
        fail "Only one JSON file may be provided."
      fi
      json_file="$1"
      shift
      ;;
  esac
done

[ -n "$json_file" ] || {
  usage
  exit 1
}

[ -f "$json_file" ] || fail "JSON file not found: $json_file"

require_cmd gh "Install GitHub CLI and run \`gh auth login\`."
require_cmd node "Install Node.js 22+ and try again."

if ! gh auth status >/dev/null 2>&1; then
  fail "GitHub CLI is not authenticated. Run \`gh auth login\` first."
fi

if [ -z "$repo" ]; then
  repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)"
fi

[ -n "$repo" ] || fail "Unable to determine the GitHub repo automatically. Pass --repo owner/name."

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

export PHUZZLE_ISSUES_SOURCE="$json_file"
export PHUZZLE_ISSUES_TMP_DIR="$tmp_dir"

issue_count="$(
  node <<'EOF'
const fs = require('fs');

const source = process.env.PHUZZLE_ISSUES_SOURCE;
const tmpDir = process.env.PHUZZLE_ISSUES_TMP_DIR;

const raw = fs.readFileSync(source, 'utf8');
const parsed = JSON.parse(raw);
const issues = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.issues) ? parsed.issues : null;

if (!issues) {
  console.error('JSON must be an array of issues or an object with an "issues" array.');
  process.exit(1);
}

issues.forEach((issue, index) => {
  if (!issue || typeof issue !== 'object' || Array.isArray(issue)) {
    console.error(`Issue at index ${index} must be an object.`);
    process.exit(1);
  }

  if (typeof issue.title !== 'string' || issue.title.trim() === '') {
    console.error(`Issue at index ${index} is missing a non-empty "title".`);
    process.exit(1);
  }

  if ('body' in issue && typeof issue.body !== 'string') {
    console.error(`Issue "${issue.title}" has a non-string "body".`);
    process.exit(1);
  }

  for (const field of ['labels', 'assignees']) {
    if (!(field in issue)) continue;
    if (!Array.isArray(issue[field]) || issue[field].some((value) => typeof value !== 'string' || value.trim() === '')) {
      console.error(`Issue "${issue.title}" has an invalid "${field}" array.`);
      process.exit(1);
    }
  }

  const normalized = {
    title: issue.title.trim(),
    body: typeof issue.body === 'string' ? issue.body : '',
    labels: Array.isArray(issue.labels) ? issue.labels : [],
    assignees: Array.isArray(issue.assignees) ? issue.assignees : [],
  };

  fs.writeFileSync(`${tmpDir}/issue-${index}.json`, JSON.stringify(normalized, null, 2));
}
);

process.stdout.write(String(issues.length));
EOF
)" || fail "Unable to parse issues from $json_file"

[ "$issue_count" -gt 0 ] || fail "No issues found in $json_file"

echo "📥 Importing $issue_count issue(s) into $repo"

for ((index = 0; index < issue_count; index += 1)); do
  issue_path="$tmp_dir/issue-${index}.json"
  title="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).title" "$issue_path")"

  if [ "$dry_run" = "true" ]; then
    echo "------------------------------------------------------------"
    echo "DRY RUN: would create issue $((index + 1))/$issue_count"
    cat "$issue_path"
    continue
  fi

  response_path="$tmp_dir/response-${index}.json"
  gh api \
    --method POST \
    -H "Accept: application/vnd.github+json" \
    "repos/${repo}/issues" \
    --input "$issue_path" \
    > "$response_path"

  issue_url="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).html_url" "$response_path")"
  pass "Created issue $((index + 1))/$issue_count: $title -> $issue_url"
done

if [ "$dry_run" = "true" ]; then
  pass "Dry run complete. No GitHub issues were created."
else
  pass "Issue import complete."
fi
