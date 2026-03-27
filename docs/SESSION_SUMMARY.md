# Session summary (layout & features)

Summary of work on layout, piece drawer, input, leaderboards, co-op, packs, onboarding, testing, PWA, and docs. Includes Play screen and puzzle manager file splits, mobile touch hardening, and QA/docs updates.

---

## Layout

- **Play:** Board on top, tray below. HUD in top bar only. Tray 150px desktop, 160px mobile. No stats sidebar. Font: Nunito (replaced Inter).
- **Grid:** 9×9 preset; piece counts in difficulty labels; suggested difficulty; custom grid hint for 81+ pieces; undo cap (50 for ≤64 pieces, 25 for 81+).
- **Stats mobile:** Card content flex/scroll; `data-testid="stats-card-content"`.

---

## Piece drawer

- Compact mode for 25+ pieces (toggle). Sticky filter row (All/Edges/Center/Corners, Grid/Color). Scroll snap; progress bar. Tray heights: desktop 150px, mobile 130px, tablet 180px.

---

## Input

- One piece per interaction (pointer capture). Tap-to-rotate 90° (threshold 8px, 350ms). Double-trigger guard. Pinch = zoom only.

---

## Play & mobile

- Completion overlay: responsive text, scroll, smaller fonts on narrow. Piece selection: blue border, auto-clear. Board fill by piece count (96–98% on mobile). No text selection / callouts on touch (PZ-045).

---

## Image & validation

- Min resolution by grid (e.g. 3×3–4×4: 160px; 7×7+: 400px or 45px per piece). `validateBeforeStart` on Start; clear errors.

---

## Milestones & undo

- `placedCount` = correctly placed only. Undo/redo safe via `recomputeDerivedState`. PostHog events for milestones, streak, first snap.

---

## Leaderboards & stats

- Daily, weekly, monthly, all-time, streaks, best by grid. Anonymous mode (raccoon names). Narrow screens: compact leaderboard (PZ-041). Mobile: tighter padding, scrollable tabs, touch-friendly rows.

---

## Time modes

- Elapsed, countdown (5–30 min), active-only, relaxed, best time.

---

## Share & co-op

- Share via Menu → Share → “Play with friend?”. Puzzle sessions + Realtime. Verification steps in `docs/SUPABASE_SETUP.md`.

---

## Help & menu

- HelpChoiceModal: How to Play or Keyboard & Controls. About top-level. Menu tip for tray.

---

## Mobile modals

- Sticky dismiss/close; condensed content on small screens; fixed header/footer, scrollable body.

---

## Packs & onboarding

- Pack list and detail; progress per pack. Onboarding: start → firstSnapDone → trayTipSeen → done; toasts and persistence.

---

## Testing & CI

- Vitest unit tests; Playwright E2E (home, Stats mobile, Setup/Daily 9×9). CI: lint, typecheck, build, unit, E2E. Pre-push: Prettier, ESLint, TypeScript, unit tests.

---

## PWA & docs

- Installable; manifest; service worker (autoUpdate). Doc index in `docs/README.md`; Supabase and session notes. Realtime in migrations.

---

## Changelog (then)

- v8: layout revert, Nunito. v7: 9×9, piece counts, Stats mobile, undo cap. v4: piece drawer, touch, validation, milestones, help.

---

## Files (representative)

Play screen, PieceTray, pointer handlers, image picker, PuzzleManager, CompletionOverlay, HeaderMenu, modals, packs, sessions, onboarding, Stats, time modes, docs/ and README.
