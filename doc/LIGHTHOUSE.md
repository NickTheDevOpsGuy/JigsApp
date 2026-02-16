# Lighthouse CI

Lighthouse runs in CI on every PR (perf, a11y, best-practices). Results save to `lhci-reports/`.

## Token naming (what goes where)

- **`github.token`** – This is a **GitHub Actions expression** (built-in context), not an env var name. Use `${{ github.token }}` in your workflow to get the token value. You don’t create a secret or env var named `github.token`.
- **`GITHUB_TOKEN`** – GitHub Actions sets this env var automatically in every job. You usually don’t need to pass it yourself.
- **`LHCI_UPLOAD__GITHUB_TOKEN`** – LHCI’s env var for `upload.githubToken`. The workflow passes `${{ github.token }}` into it so LHCI can post status checks if you switch to `temporary-public-storage`.
- **`lighthouserc.cjs`** – Reads `process.env.GITHUB_TOKEN || process.env.LHCI_GITHUB_APP_TOKEN`. In GitHub Actions, `GITHUB_TOKEN` is already set, so the token is available without extra config.

## Fixing "GitHub token not set" Warning

### In CI (GitHub Actions)

No extra setup needed. `GITHUB_TOKEN` is set automatically by GitHub Actions. The workflow also passes `LHCI_UPLOAD__GITHUB_TOKEN: ${{ github.token }}` for LHCI’s upload config (redundant but explicit).

### Local Runs

To remove the warning locally, set one of:

```bash
# Option 1: Inline when running
LHCI_UPLOAD__GITHUB_TOKEN=ghp_xxx npx lhci autorun

# Option 2: Export in your shell
export LHCI_UPLOAD__GITHUB_TOKEN=ghp_your_personal_access_token
npx lhci autorun
```

Create a token: GitHub → Settings → Developer settings → Personal access tokens → fine-grained (or classic) → no extra scopes needed for the healthcheck.

### Skip Token (Warning Is Harmless)

You can ignore the warning. Lighthouse still runs, asserts, and writes reports. The token is only used for optional PR status checks when using `temporary-public-storage` instead of `filesystem`.
