#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

PASS_COUNT=0
WARN_COUNT=0

pass() {
  echo "✅ $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

warn() {
  echo "⚠️  $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

fail() {
  echo "🛑 $1"
  exit 1
}

require_cmd() {
  local cmd="$1"
  local hint="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    pass "Found \`$cmd\`"
  else
    fail "Missing required command \`$cmd\`. ${hint}"
  fi
}

require_node_module() {
  local module_name="$1"
  local hint="$2"
  if node -e "require.resolve(process.argv[1])" "$module_name" >/dev/null 2>&1; then
    pass "Resolved node module \`$module_name\`"
  else
    fail "Missing node module \`$module_name\`. ${hint}"
  fi
}

echo "🩺 Phuzzle doctor"
echo "----------------------------------------------------------------"

require_cmd node "Install Node.js 22+ and try again."
require_cmd npm "Install npm and try again."
require_cmd npx "Install npm/npx and try again."
require_cmd git "Install git and try again."
require_cmd rg "Install ripgrep (\`rg\`) for local scripts."

NODE_MAJOR="$(node -p 'process.versions.node.split(`.`)[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  fail "Node $(node -v) is too old. Phuzzle requires Node 22+."
fi
pass "Node version $(node -v) satisfies the >=22 engine"

if [ ! -d node_modules ]; then
  fail "node_modules is missing. Run \`npm install\` first."
fi
pass "node_modules is present"

require_node_module "prettier/package.json" "Run \`npm install\` to install repo dependencies."
require_node_module "eslint/package.json" "Run \`npm install\` to install repo dependencies."
require_node_module "typescript/package.json" "Run \`npm install\` to install repo dependencies."
require_node_module "@playwright/test/package.json" "Run \`npm install\` to install repo dependencies."

if node -e "require.resolve('@axe-core/playwright')" >/dev/null 2>&1; then
  pass "Resolved optional accessibility module \`@axe-core/playwright\`"
else
  warn "Optional accessibility dependency \`@axe-core/playwright\` is missing. Accessibility smoke will skip until you run \`npm install\`."
fi

if npx --no-install playwright --version >/dev/null 2>&1; then
  pass "Playwright CLI is available"
else
  fail "Playwright CLI is unavailable. Run \`npm install\`."
fi

if [ -d "$HOME/.cache/ms-playwright" ]; then
  pass "Playwright browser cache directory exists"
else
  warn "Playwright browser cache was not found. Run \`npx playwright install\` before E2E work."
fi

if command -v docker >/dev/null 2>&1; then
  if docker ps >/dev/null 2>&1; then
    pass "Docker daemon is reachable"
    if docker ps --format '{{.Names}}' | grep -q '^supabase_db$'; then
      pass "Supabase local database container is running"
    else
      warn "Supabase local database is not running. Precheck will skip backend-dependent E2E checks."
    fi
  else
    warn "Docker is installed but the daemon is not reachable right now."
  fi
else
  warn "Docker is not installed. Backend-dependent E2E checks will be skipped."
fi

if timeout 1 bash -lc '</dev/tcp/127.0.0.1/4173' >/dev/null 2>&1; then
  warn "Port 4173 is already in use. Playwright will reuse that server locally if it is Phuzzle."
else
  pass "Port 4173 is free for preview/dev server startup"
fi

echo "----------------------------------------------------------------"
echo "Doctor finished with ${PASS_COUNT} checks passing and ${WARN_COUNT} warning(s)."
