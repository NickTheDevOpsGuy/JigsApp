# Developer Setup

This guide is the quickest way to get a local Phuzzle environment running,
verify your toolchain, and debug the common issues that show up while developing
the app.

## Prerequisites

- Node.js `22+`
- npm, which ships with Node.js
- Git
- Optional: Docker Desktop if you want local Supabase workflows
- Optional: GitHub CLI (`gh`) if you work on GitHub issues, PRs, or Actions

The required Node version is declared in `package.json`:

```json
"engines": {
  "node": ">=22.0.0"
}
```

Check your version:

```bash
node -v
npm -v
git --version
```

## Install Node.js

Use one of these setup paths. A version manager is preferred because it keeps
this project isolated from other Node projects on your machine.

### Option A: nvm

macOS/Linux:

```bash
nvm install 22
nvm use 22
nvm alias default 22
```

Then confirm:

```bash
node -v
npm -v
```

### Option B: fnm

macOS/Linux/Windows:

```bash
fnm install 22
fnm use 22
```

Then confirm:

```bash
node -v
npm -v
```

### Option C: Direct installer

Install Node.js `22+` from the official Node.js installer for your operating
system. After installation, open a new terminal and run:

```bash
node -v
npm -v
```

If your terminal still shows an older version, restart the terminal and check
whether another version manager is overriding your PATH.

## First-time setup

```bash
git clone https://github.com/NickTheDevOpsGuy/phuzzle.git
cd phuzzle
npm install
npm run test:e2e:install
npm run doctor
```

What each step does:

- `npm install` installs app dependencies and local hooks.
- `npm run test:e2e:install` downloads the browser binaries used by the e2e
  suite.
- `npm run doctor` checks Node, dependencies, Playwright availability,
  Supabase/Docker reachability, and whether preview port `4173` is already in
  use.

## Environment Variables

Most frontend development works without local secrets. If you need Supabase,
copy the example file and fill in the values for your project:

```bash
cp .env.example .env.local
```

Do not commit `.env.local` or any secret-bearing env file.

## Daily development flow

Start the app:

```bash
npm run dev
```

Open the local site shown by Vite, usually `http://127.0.0.1:5173/`.

`npm run dev` intentionally runs lint and build before starting Vite. If that
feels slow while iterating, fix the reported issue first; the dev command is
meant to keep the local loop close to the production gate.

Useful local commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run preview
```

What they do:

| Command             | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `npm run lint`      | ESLint for TypeScript and React files.        |
| `npm run typecheck` | TypeScript validation without emitting files. |
| `npm run test`      | Vitest unit/component tests.                  |
| `npm run build`     | Production TypeScript + Vite build.           |
| `npm run preview`   | Serve the production build locally.           |
| `npm run precheck`  | Local pre-push style gate.                    |

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
npm run test:e2e:layouts
npm run test:e2e
```

Notes:

- `test:e2e:smoke` covers Chrome, Firefox, Safari/WebKit, and Edge-compatible Chromium.
- `test:e2e:layouts` covers iPhone WebKit, iPad WebKit, and Android tablet Chromium.
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
npm run test:e2e:layouts
```

## Reusing a production build

CI builds once, then reuses `dist` for bundle size, Playwright, and Lighthouse checks. You can use the same shortcuts locally after `npm run build`:

```bash
CHECK_BUNDLE_USE_EXISTING_DIST=1 npm run check:bundle
PW_USE_EXISTING_BUILD=1 npm run test:e2e:smoke
PW_USE_EXISTING_BUILD=1 npm run test:e2e:layouts
```

The bundle check compares against the target branch when `BASELINE_REF` is set, with
a small default gzip allowance for normal build drift. Override it with
`BUNDLE_TOLERANCE_KB=0` for an exact comparison.

## Optional Supabase setup

If you need leaderboards, co-op, or database work:

- Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- Use the `supabase:push:*` scripts from `package.json` once your env vars are
  configured

## Common problems

### Node version is too old

If `npm install`, `npm run doctor`, or `npm run build` reports a Node engine
problem, switch to Node `22+`:

```bash
nvm install 22
nvm use 22
```

Then reinstall dependencies:

```bash
npm install
```

### Playwright browsers missing

```bash
npm run test:e2e:install
```

### Preview server port collision

The e2e config uses preview on port `4173`. If that port is already busy, close
the old preview process and rerun the test command.

### Dependency install looks stale

If package installation behaves strangely after switching Node versions:

```bash
rm -rf node_modules
npm install
```

Avoid deleting `package-lock.json` unless you intentionally want to update the
dependency graph.

### Firefox feels hot or noisy during debugging

Use the Firefox project commands above. The app includes a lighter Firefox
performance profile now, but long-running dev tools, traces, and repeated e2e
runs can still warm up a laptop during investigation.

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
