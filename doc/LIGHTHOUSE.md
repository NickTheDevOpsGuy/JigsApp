# Lighthouse CI

Lighthouse runs in CI on every PR (performance, accessibility, best practices). Reports are saved to `lhci-reports/`.

This doc also explains the common "GitHub token not set" warning and how tokens map between GitHub Actions and LHCI.

---

## Token naming (what goes where)

- `github.token` - A GitHub Actions expression (built-in context), not a secret name. Use `${{ github.token }}` to get the token value.
- `GITHUB_TOKEN` - Environment variable automatically set by GitHub Actions in every job.
- `LHCI_UPLOAD__GITHUB_TOKEN` - LHCI env var for `upload.githubToken`. Passing `${{ github.token }}` into this enables optional status checks when using LHCI upload modes that post back to GitHub.
- `lighthouserc.cjs` - Reads `process.env.GITHUB_TOKEN || process.env.LHCI_GITHUB_APP_TOKEN`. In GitHub Actions, `GITHUB_TOKEN` is already set.

---

## Fixing "GitHub token not set" warning

### In CI (GitHub Actions)

No extra setup is required. GitHub sets `GITHUB_TOKEN` automatically. The workflow may also pass:

```yaml
env:
  LHCI_UPLOAD__GITHUB_TOKEN: ${{ github.token }}
```

That is redundant but explicit.

### Local runs

To remove the warning locally, set one of:

```bash
# Option 1: inline
LHCI_UPLOAD__GITHUB_TOKEN=ghp_xxx npx lhci autorun

# Option 2: export in your shell
export LHCI_UPLOAD__GITHUB_TOKEN=ghp_xxx
npx lhci autorun
```

Token creation: GitHub -> Settings -> Developer settings -> Personal access tokens.

Notes:

- For filesystem output only, a token is not required.
- A token is only used for optional GitHub status checks when using upload modes like `temporary-public-storage`.

---

## Where to find the output

- Local: `./lhci-reports`
- CI artifacts: the workflow uploads reports if configured to do so
