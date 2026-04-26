# Lighthouse CI

Lighthouse runs in CI on every PR (performance, accessibility, best practices). Reports go to `lhci-reports/`.

---

## Run it locally

Use the repo scripts:

```bash
npm run lighthouse
```

Useful variants:

```bash
npm run lighthouse:collect
npm run lighthouse:assert
npm run lighthouse:open
npm run check:images
```

What they do:

- `npm run lighthouse` builds the app and runs the full LHCI flow.
- `npm run lighthouse:collect` builds and collects reports only.
- `npm run lighthouse:assert` checks the collected results against thresholds.
- `npm run lighthouse:open` opens the generated local HTML report on macOS.
- `npm run check:images` reports the heaviest shipped image assets and estimates WebP savings when `cwebp` is available.

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

## Local Chrome setup

LHCI needs a Chrome/Chromium binary. If you see `Chrome installation not found`, point LHCI at a local browser binary.

If Playwright browsers are already installed, this usually works on macOS:

```bash
CHROME_PATH="$HOME/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
npm run lhci
```

You can also run collect directly while debugging:

```bash
CHROME_PATH="$HOME/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
npx lhci collect --staticDistDir=./dist --numberOfRuns=1 --settings.preset=desktop
```

If your cached Playwright revision differs, adjust the `chromium-####` segment to match the folder under `~/Library/Caches/ms-playwright/`.

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

The local `npm run lighthouse` and `npm run lhci` scripts both build the app first, then run `lhci autorun`.

---

## Accessibility

The app has a **skip link** (“Skip to main content”) that is hidden until focused (Tab from top). It moves focus to `<main id="main">`. This helps keyboard and screen reader users skip repeated nav. Lighthouse/axe “bypass blocks” and main landmark checks should pass.

---

## Recent baseline improvements

- Added explicit page `meta description`
- Added `color-scheme` metadata for light/dark aware browser UI
- Removed the runtime Google Fonts dependency in favor of local/system font stacks
- Added Workbox runtime caches for same-origin puzzle images and fonts so repeat play starts from warm browser storage.
- Added short-lived deployment cache headers for public icons, social images, and generated manifests while keeping HTML and the service worker fresh.
- Added stable local scripts so Lighthouse can be run without remembering raw `lhci` commands
- Ignored Lighthouse output folders in ESLint so lint stays reliable after audits
- Added a repo image-audit script so oversized puzzle and social assets are easy to spot before shipping
- Converted the heaviest shipped social image and several top puzzle outliers to WebP to cut transfer size sharply

---

## Latest local audit

Latest local desktop Lighthouse collect run on 2026-03-26 using Playwright Chromium:

- Run 1: Performance `100`, Accessibility `100`, Best Practices `100`, SEO `100`
- Run 2: Performance `100`, Accessibility `100`, Best Practices `100`, SEO `100`

Representative timings:

- FCP: `0.7s`
- LCP: `0.7s`
- TBT: `0ms`
- CLS: `0`

Largest remaining opportunities from the report:

- Reduce unused JavaScript: about `180-200ms`
- Eliminate render-blocking resources: about `35-90ms`
- Reduce unused CSS: about `40ms`

Current takeaway:

- The app is already comfortably fast on the measured desktop baseline.
- The biggest remaining performance lever is bundle trimming in the Play setup chunk, not interaction stutter.

---

## Image budget

Use these as the project guardrails when adding new assets:

- **Puzzle images**
  - Ideal: `200-500 kB`
  - Acceptable: up to `1 MB`
  - Too large: `2 MB+`
- **Hero / social / OG images**
  - Ideal: `100-250 kB`
  - Acceptable: up to `500 kB`
  - Too large: `1 MB+`
- **Small UI images / icons**
  - Ideal: under `100 kB`

Practical rule: if a puzzle image lands above `1 MB`, run `npm run check:images` and compress it before merging. If it lands above `2 MB`, treat that as a blocker unless there is a very unusual reason.

Recommended formats:

- Prefer `webp` for large photographic or illustrated puzzle assets
- Keep `png` only when you truly need lossless transparency
- Use `jpg` only when it materially beats `webp` for a given asset

Current workflow:

```bash
npm run check:images
```

This prints the heaviest shipped image assets and, when `cwebp` is available, estimates how much smaller a WebP version would be.
