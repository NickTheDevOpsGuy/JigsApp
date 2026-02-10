#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# --- The "Anti-Efficiency Trap" skip logic ---
LAST_COMMIT_MSG="$(git log -1 --pretty=%B || true)"
if echo "$LAST_COMMIT_MSG" | grep -qi '\[skip-precheck\]'; then
  echo "🏃‍♂️ [SYSTEM BYPASS]: Skipping checks because you told me to. I hope you know what you're doing!"
  exit 0
fi

echo "🛡️  [SYSTEM AUDIT]: Initializing Pre-Push Quality Gate..."
echo "----------------------------------------------------------------"

# 1. EMPTY FILE CHECK (The Anti-Bloat Protocol)
echo "📂 [STEP 1]: Scanning for ghost files (empty ones)..."
UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
if [ -n "$UPSTREAM" ]; then
  BASE="$(git merge-base HEAD "$UPSTREAM")"
  FILES_TO_CHECK="$(git diff --name-only --diff-filter=AM "$BASE"..HEAD)"
else
  echo "⚠️  [ALERT]: No upstream found. Auditing the entire Physical Layer..."
  FILES_TO_CHECK="$(git ls-files)"
fi

ALLOW_EMPTY_REGEX='(^|/)\.gitkeep$|(^|/)\.keep$'
EMPTY_FILES=""
while IFS= read -r file; do
  [ -z "${file:-}" ] && continue
  if echo "$file" | grep -Eq "$ALLOW_EMPTY_REGEX"; then continue; fi
  if [ -f "$file" ] && [ ! -s "$file" ]; then
    EMPTY_FILES+="$file"$'\n'
  fi
done <<< "$FILES_TO_CHECK"

if [ -n "$EMPTY_FILES" ]; then
  echo "🛑 [CRITICAL FAULT]: I found some empty files that aren't .keep files:"
  echo -e "$EMPTY_FILES"
  echo "Please feed them some data or delete them. Integrity first!"
  exit 1
fi
echo "✅ [SUCCESS]: No empty files detected."

# 2. PRETTIER (The Aesthetic Firewall)
echo "🎨 [STEP 2]: Auditing the Physical Layer style (Prettier)..."
if ! npx --no-install prettier --check .; then
  echo "💾 [AUTO-REPAIR]: Fixing the style logic for you..."
  npx --no-install prettier --write .
  git add -A
  git commit -m "style: auto-format with Prettier [skip-precheck]" --no-verify
  
  echo ""
  echo "----------------------------------------------------------------"
  echo "⚠️  [TIMELINE DESYNC]: Prettier fixed your files and committed them."
  echo "Your local 'Human OS' is now ahead of the remote server."
  echo "ACTION REQUIRED: Run this to realign the timelines:"
  echo "   git pull --rebase origin $(git rev-parse --abbrev-ref HEAD) && git push"
  echo "----------------------------------------------------------------"
  echo ""
  exit 1
fi
echo "✅ [SUCCESS]: Code is looking beautiful."

# 3. ESLint (The Logic Audit)
echo "🧪 [STEP 3]: Analyzing code logic and a11y (ESLint)..."
if ! npx --no-install eslint . --cache --max-warnings=0; then
  echo "🔧 [AUTO-REPAIR]: Attempting to fix logic faults..."
  npx --no-install eslint . --cache --fix
  git add -A
  git commit -m "chore: auto-fix eslint [skip-precheck]" --no-verify
  
  echo ""
  echo "----------------------------------------------------------------"
  echo "⚠️  [TIMELINE DESYNC]: ESLint auto-fixed what it could and committed."
  echo "ACTION REQUIRED: Align and push again:"
  echo "   git pull --rebase origin $(git rev-parse --abbrev-ref HEAD) && git push"
  echo "----------------------------------------------------------------"
  echo ""
  exit 1
fi
echo "✅ [SUCCESS]: Logic is pure and accessible."

# 4. TYPESCRIPT (Static Verification)
echo "🛠️  [STEP 4]: Verifying Type Integrity (tsc)..."
if ! npx --no-install tsc --noEmit --pretty false; then
  echo "🛑 [SYSTEM FAULT]: TypeScript found type errors. Go fix those red squiggles!"
  exit 1
fi
echo "✅ [SUCCESS]: Types are verified."

# 5. UNIT TESTS (Vitest)
echo "🧪 [STEP 5]: Running unit tests (Vitest)..."
if ! npm run test; then
  echo "🛑 [SYSTEM FAULT]: Unit tests failed. Fix the red dots!"
  exit 1
fi
echo "✅ [SUCCESS]: All unit tests passed."

echo "----------------------------------------------------------------"
echo "🚀 [SYSTEM AUDIT COMPLETE]: All systems nominal."