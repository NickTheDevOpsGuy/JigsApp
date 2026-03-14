# Lighthouse CI

Lighthouse runs in CI on every PR (performance, accessibility, best practices). Reports go to `lhci-reports/`.

---

## “GitHub token not set” warning

**In CI (GitHub Actions)**  
Nothing extra. GitHub sets `GITHUB_TOKEN`. You can also set:

```yaml
env:
  LHCI_UPLOAD__GITHUB_TOKEN: ${{ github.token }}
```

**Locally**  
To remove the warning:

```bash
# Option 1
LHCI_UPLOAD__GITHUB_TOKEN=ghp_xxx npx lhci autorun

# Option 2
export LHCI_UPLOAD__GITHUB_TOKEN=ghp_xxx
npx lhci autorun
```

Create a token: GitHub → Settings → Developer settings → Personal access tokens.  
For filesystem-only output you don’t need a token; it’s only for optional GitHub status checks (e.g. upload modes).

---

## Token names

- `github.token` — GitHub Actions context value.
- `GITHUB_TOKEN` — Env var set by GitHub Actions.
- `LHCI_UPLOAD__GITHUB_TOKEN` — LHCI env var for upload; passing the token enables status checks.
- `lighthouserc.cjs` reads `process.env.GITHUB_TOKEN` or `process.env.LHCI_GITHUB_APP_TOKEN`.

---

## Where output goes

- **Local:** `./lhci-reports`
- **CI:** Reports are uploaded as artifacts if the workflow is configured for it.

---

## Accessibility

The app has a **skip link** (“Skip to main content”) that is hidden until focused (Tab from top). It moves focus to `<main id="main">`. This helps keyboard and screen reader users skip repeated nav. Lighthouse/axe “bypass blocks” and main landmark checks should pass.
