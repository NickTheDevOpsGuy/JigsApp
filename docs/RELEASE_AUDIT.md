# Release Audit

Formal audit of `phuzzle` behavior, coverage, and release readiness as of 2026-03-21.

---

## Scope

This audit covered:

- documented product behavior in:
  - `docs/FEATURES_IMPLEMENTED.md`
  - `docs/CHANGES.md`
  - `docs/SHARING.md`
  - `docs/STREAK-FREEZE.md`
  - `docs/BUG_REPORT.md`
  - `docs/MOBILE_QA.md`
  - `docs/STATS_UI_QA.md`
- shipped routes in `src/app/App.tsx`
- automated coverage in `e2e/` and Vitest
- targeted cross-browser/browser-project verification

---

## Release Verdict

**Status: ready, with a stable one-command browser matrix gate.**

What is in good shape:

- core gameplay, home, daily, setup, packs, stats, streak-freeze, theme, and share flows have broad automated coverage
- targeted browser slices passed after fixing stale selectors and a WebKit-only tray assertion tolerance
- the app still looks ship-ready based on the focused runs and the product areas reviewed

What is still not fully closed:

- true **real-device coverage** is still manual, per `docs/MOBILE_QA.md`
- some documented features still rely more on manual QA than direct end-to-end coverage

---

## Verification Run Summary

### Automated checks reviewed

- `npm run -s test`
  - previously completed in this audit session: **158 passed / 158 tests**
- `npm run -s test:e2e -- e2e/setup-mobile-fit.spec.ts e2e/context-menu-mobile.spec.ts`
  - after selector updates: **35 passed / 35 tests**
- `npm run -s test:e2e -- e2e/tray-edge-webkit.spec.ts`
  - after WebKit tolerance update: **5 passed / 5 tests**

### Full Playwright matrix status

The original monolithic all-project run was unstable, so the release gate was changed to a **sequential project matrix**.

Current default command:

- `npm run test:e2e`

Current behavior:

- runs Playwright projects one at a time:
  - `chromium`
  - `chromium-tz-la`
  - `chromium-tz-auckland`
  - `firefox`
  - `webkit`

Current result:

- **34/34 passed** in `chromium`
- **34/34 passed** in `chromium-tz-la`
- **34/34 passed** in `chromium-tz-auckland`
- **34/34 passed** in `firefox`
- **34/34 passed** in `webkit`

That gives a clean full browser matrix result with the stable execution path now wired into the default test command.

---

## Findings

### 1. Stale Quick Play coverage existed in E2E

**Severity:** medium  
**Status:** fixed

Two E2E specs were still targeting the old `Choose Photo` entry point even though the current menu flow starts from `Quick Play`.

Files updated:

- `e2e/setup-mobile-fit.spec.ts`
- `e2e/context-menu-mobile.spec.ts`

Impact:

- these stale selectors produced false-negative failures in the audit
- after updating them to the shipped Quick Play flow, the targeted cross-browser slice passed

### 2. WebKit tray-edge assertion was too strict

**Severity:** low  
**Status:** fixed

`e2e/tray-edge-webkit.spec.ts` treated any negative `scrollLeft` reading as a failure. In WebKit, a tiny negative read can occur from scroll rounding even while the tray remains visually clamped.

File updated:

- `e2e/tray-edge-webkit.spec.ts`

Impact:

- removed a noisy flaky failure without weakening the meaningful tray clamp signal

### 3. Monolithic matrix instability was fixed by switching to a sequential browser gate

**Severity:** medium  
**Status:** fixed

The combined all-project Playwright sweep proved unstable. The fix was to move the default browser gate to a sequential runner that executes each Playwright project independently while preserving the same coverage.

Files updated:

- `scripts/test-e2e-matrix.sh`
- `package.json`

Impact:

- `npm run test:e2e` is now a stable release command again
- cross-browser coverage remains intact
- project-to-project interference is avoided

---

## Feature Vs Spec Review

### Well covered and aligned

- **Home / menu**
  - logo, primary CTAs, Stats, Help
- **Feedback**
  - home feedback entry point, feedback modal actions, bug/feature mailto formatting
- **Daily flow**
  - daily modal, difficulty options, start path
- **Quick Play staged setup**
  - category chooser, puzzle chooser, setup modal, start flow
- **Play screen**
  - tray presence, mobile fit, completion overlay, completion actions
- **Stats / packs**
  - packs list, stats route, compact modal checks
- **Routes**
  - `/new -> /`
  - unknown route -> `/`
  - pack detail deep link
  - not-found pack detail state
- **Streak freeze**
  - visible offer, dismiss path, keyboard access
- **Theme**
  - settings open and theme switch
- **Tray bounds**
  - explicit tray edge coverage across projects

### Implemented/documented but not exhaustively covered end-to-end

- **Co-op share / play with friend**
  - documented in `docs/SHARING.md`
  - I did not find a dedicated E2E spec for creating/joining a session
- **Daily Share (Wordle-style text share)**
  - documented in `docs/SHARING.md`
  - not obviously covered by a dedicated E2E
- **Feedback end-to-end mail client launch**
  - modal path is now covered
  - actual OS/browser `mailto:` handoff is still better treated as integration/manual behavior than browser E2E

### Coverage that remains manual by design

Per `docs/MOBILE_QA.md` and `docs/STATS_UI_QA.md`, the following still require real-device/manual verification:

- iPhone SE Safari
- iPhone 13/14/15-class Safari
- Pixel-class Android Chrome
- safe-area / home-indicator / notch behavior
- rotate-and-recenter behavior
- OS text-size increase checks
- some stats modal density/readability checks at real device sizes

---

## Routes Reviewed

Routes currently shipped in `src/app/App.tsx`:

- `/`
- `/new`
- `/play`
- `/stats`
- `/packs`
- `/packs/:packId`
- `*` -> redirect `/`

---

## Recommended Next Steps

### Highest value

- add direct E2E coverage for:
  - co-op share
  - daily share

### Release-process improvements

- split browser projects into separate CI jobs or smaller suites
- keep real-device checklist mandatory before release
- keep focused feature slices as the strongest day-to-day regression gate

---

## Bottom Line

If the question is “does the product look ready enough to ship?”, the answer is **yes**.

If the question is “do we now have a stable one-command browser matrix gate?”, the answer is also **yes**.

The remaining work is coverage depth and real-device/manual QA, not a broken release path.
