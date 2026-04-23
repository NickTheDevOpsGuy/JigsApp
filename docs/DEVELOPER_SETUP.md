# Developer Setup

This guide is the quickest way to get a local Phuzzle environment running, verify your toolchain, and debug the common issues that show up while developing the app.

## Prerequisites

- `Node.js 22+`
- `npm`
- Git
- Optional: Docker Desktop if you want local Supabase workflows

Check your version:

```bash
node -v
npm -v
```

## First-time setup

```bash
git clone https://github.com/NickTheDevOpsGuy/phuzzle.git
cd phuzzle
npm install
npx playwright install chromium firefox webkit
npm run doctor
```

What each step does:

- `npm install` installs app dependencies and local hooks.
- `npx playwright install chromium firefox webkit` downloads the browser binaries used by the e2e suite.
- `npm run doctor` checks Node, dependencies, Playwright availability, Supabase/Docker reachability, and whether preview port `4173` is already in use.

## Daily development flow

Start the app:

```bash
npm run dev
```

Open the local site shown by Vite, usually `http://127.0.0.1:5173/`.

Useful local commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
```

## Firefox-specific testing

If you are working on performance, layout, or input behavior, run Firefox explicitly:

```bash
npx playwright test src/app/screens/Play/PlayScreen.e2e.spec.ts --project=firefox --workers=1
npx playwright test src/app/accessibility.e2e.spec.ts --project=firefox --workers=1
```

Notes:

- Use `--workers=1` when debugging viewport or animation issues so results are easier to read.
- If Playwright says a browser executable is missing, rerun `npx playwright install firefox`.
- If the preview server fails because port `4173` is already in use, stop the old preview process or run `npm run doctor` to confirm what is occupying it.

## Cross-browser testing

The standard matrix already covers the popular desktop browsers:

```bash
npm run test:e2e:smoke
npm run test:e2e
```

Notes:

- `chrome`, `firefox`, and `safari` run directly from the Playwright config.
- The smoke and full matrix scripts now auto-detect a local Microsoft Edge install and set `PW_USE_EDGE=1` for you when Edge is available.
- If Edge is not installed, the `edge` project still runs with Edge-compatible Chromium coverage instead of failing.

For touch-first Safari and tablet coverage, run the responsive projects explicitly:

```bash
npx playwright test src/app/responsive.responsive.e2e.spec.ts --project=safari-iphone-responsive --workers=1
npx playwright test src/app/responsive.responsive.e2e.spec.ts --project=safari-ipad-responsive --workers=1
npx playwright test src/app/responsive.responsive.e2e.spec.ts --project=chrome-android-tablet-responsive --workers=1
```

## Recommended pre-PR check

Run this before pushing:

```bash
npm run precheck
```

If you want the shorter manual version:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e:smoke
```

## Optional Supabase setup

If you need leaderboards, co-op, or database work:

- Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- Use the `supabase:push:*` scripts from `package.json` once your env vars are configured

## Common problems

### Playwright browsers missing

```bash
npx playwright install chromium firefox webkit
```

### Preview server port collision

The e2e config uses preview on port `4173`. If that port is already busy, close the old preview process and rerun the test command.

### Firefox feels hot or noisy during debugging

Use the Firefox project commands above. The app includes a lighter Firefox performance profile now, but long-running dev tools, traces, and repeated e2e runs can still warm up a laptop during investigation.

### Edge does not use the real browser channel

The smoke and matrix scripts will opt into real Edge automatically when the browser is installed locally. If you want to force it manually, run:

```bash
PW_USE_EDGE=1 npx playwright test --project=edge
```

## Where to look next

- [README.md](../README.md) for project overview
- [README.md](README.md) for the docs index
- [MOBILE_QA.md](MOBILE_QA.md) for mobile and viewport regression coverage
- [RELEASE_AUDIT.md](RELEASE_AUDIT.md) for recent cross-browser QA notes
