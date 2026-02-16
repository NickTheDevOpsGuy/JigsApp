# Lighthouse CI

Lighthouse runs in CI on every PR (perf, a11y, best-practices). Results save to `lhci-reports/`.

## Fixing "GitHub token not set" Warning

### In CI (GitHub Actions)

Already wired: the workflow passes `LHCI_UPLOAD__GITHUB_TOKEN: ${{ github.token }}` to the Lighthouse step, and `lighthouserc.cjs` reads `process.env.GITHUB_TOKEN`. No extra setup needed.

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
