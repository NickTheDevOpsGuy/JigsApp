# Phuzzle — Recent Changes Summary

A single post summarizing all recent updates: UX polish, leaderboards, performance, testing, PWA, tap-to-rotate, layout (PDF spec), grid presets, and docs.

---

## 📊 Analytics & UX (latest)

### Live completion counter

- **Leaderboard** – Real-time count of players who completed today's daily puzzle
- **Supabase Realtime** – Subscribes to INSERTs on `completions` for today; updates without refresh
- **Files** – `leaderboardService.ts` (`getTodayCompletionCount`, `subscribeTodayCompletionCount`), `StatsScreen.tsx`, `001_full_schema.sql`

### Percentile ranking

- **Completion overlay** – Shows "Top X%" (e.g. Top 12%) after puzzle completion
- **Per grid size** – Calculated against best times for that grid (3×3, 4×4, etc.)
- **Files** – `leaderboardService.ts` (`getPercentileRank`), `CompletionOverlay.tsx`, `PlayScreen.module.css` (`.percentileRank`)

### Snap proximity visual

- **While dragging** – Glow behind piece intensifies as you get closer to the correct snap point
- **Proximity-based** – `getSnapPreviewState()` now returns `proximity` (0–1); renderBoard uses it for alpha
- **Files** – `PuzzleManager.ts`, `renderBoard.ts`, `renderBoardHelpers.ts`

### Supabase changes

- **Single migration** – `001_full_schema.sql` consolidates all tables, RLS, policies, Realtime. Idempotent (safe to re-run). Run `supabase db push` or SQL Editor.

---

## 📐 Layout revert

- **Play screen** – Reverted to board on top, tray below. No stats sidebar; HUD in top bar only. Tray 150px (desktop), 160px (mobile). No collapse on mobile.
- **Font** – Nunito for UI; Arial removed from fallback stack.

---

## 🧩 Grid presets, piece counts & undo

- **Extreme (9×9)** – New 81-piece preset between Legend and Custom (Setup and Today's Puzzle).
- **Piece counts in labels** – All difficulty dropdowns show piece count: "🌱 3×3 (9 pieces)", "Custom 5×5 (25 pieces)", etc. (mobile and desktop).
- **Suggested difficulty** – "Based on your progress, try X×Y next" now suggests 9×9 when 8×8 is completed.
- **Custom grid hint** – When choosing 81+ pieces, a brief note: "Larger puzzles may run slower on some devices."
- **Undo cap** – 50 steps for puzzles ≤64 pieces, 25 for 81+ to reduce memory on low-end devices. Previously fixed at 30.
- **Stats/leaderboard on mobile** – Layout and scrolling fixed so content fits and scrolls inside the card (flex, overflow-y: auto, cardContent wrapper).
- **E2E coverage** – Stats mobile viewport test; Setup and Daily modal 9×9 preset tests; changelog v9 in all E2E specs.

---

## 📐 Layout & mobile (reverted – see Layout revert above)

- **Play layout** — Board on top, tray below. HUD in top bar. Tray 150px / 160px. No sidebar.
- **Previously** — Had 20/60/20 grid with stats sidebar; reverted per user preference.
- **Board** — 94vw width, max 520px on mobile; 65–70% viewport height.
- **Piece scaling** — Minimum 42px on mobile; zoom scales if needed.
- **Snap animation** — 120ms pop + glow.
- **Completion screen** — Share Result primary CTA; Download and Copy secondary. Simpler layout.
- **Today's Puzzle modal** — Difficulty overflow fix on mobile (removed fixed height).
- **Visual system** — Spacing variables, typography, ~15% less vertical padding.
- **Dead code** — Removed `shareUrls` and `openShareWindow` from `useShareResults`.
- **E2E tests** — Added: `daily-modal.spec.ts`, `play-screen.spec.ts`, `setup-play.spec.ts`, `packs-stats.spec.ts`.

---

## 📱 Tap-to-rotate (mobile)

- **Single tap on piece** — Rotates 90° on touch release. Uses distance (6px) and time (400ms) thresholds so drags never trigger accidental rotation.
- **No accidental rotate during drag** — Movement beyond 6px or hold longer than 400ms is treated as drag, not tap.
- **Double-trigger guard** — Avoids duplicate rotate when both click and touch/pointer events fire on some devices.
- **Pinch zoom unchanged** — Two-finger pinch on empty space zooms only; never rotates pieces.
- **Multi-touch fix** — Only the finger that started a piece drag can move it; second finger does not hijack the drag.

---

## 🧩 Play screen & mobile polish

- **Completion overlay (mobile)** — Text stays inside the container: padding, scroll, responsive font sizes (smaller heading/body on narrow screens), and word-wrap so long messages don’t overflow.
- **Piece selection** — Blue border is thinner (1.5px). Selection auto-clears after 1 second so it doesn’t stick until you click another piece. Tapping empty board space clears selection immediately.
- **Board size by piece count** — On mobile, the board uses a higher fill ratio when there are more pieces (16+ → 96%, 25+ → 98%), so bigger puzzles get more screen space and are easier to plan.
- **Piece tray** — Compact mode on mobile for 25+ pieces (toggle to expand); scroll snapping; "you are here" scroll indicator; filters wrap on small screens.
- **Smooth scrolling** — Completion overlay uses `-webkit-overflow-scrolling: touch` for better scroll on iOS.

---

## 🏆 Leaderboards & anonymous mode

- **Leaderboard views** — Daily puzzle (today’s daily by time), Weekly totals (completions in last 7 days), Monthly totals (last 30 days), All-time completions, Streaks, and All-time best by grid. All backed by Supabase.
- **Anonymous mode** — Toggle in Profile (Stats): “Show my name on leaderboards.” When off, you appear as a **fun raccoon-style name** (e.g. “Trash Eater 42”, “Feral Raccoon 7”) — deterministic per user, still tracked, and you can turn the toggle back on anytime.
- **Docs** — README and Supabase README updated: leaderboard views, migrations (including `player_profiles`), and anonymous behavior.

---

## ⚡ Performance (100+ piece puzzles)

- **Canvas redraw** — When idle (no drag, no completion animation), redraw is throttled to 30fps for puzzles with 50+ pieces. Full frame rate during drag and completion.
- **Snap calculations** — A single (row, col) → piece map per snap check for O(1) neighbor lookups. Only **boundary** pieces of the dragged group are considered for neighbor snap.
- **Overlap checks** — Group bounding boxes are compared first; only groups that intersect the moved group’s bounds are checked piece-by-piece.

---

## 🎮 UX & copy

- **Help menu** — Two clear options: **How to Play** (gameplay basics) and **Keyboard & Controls** (shortcuts, mouse/touch, zoom/pan). Second option renamed from “Keyboard shortcuts” to “Keyboard & Controls.” No duplicate content between the two.
- **Menu tip** — Replaced “The tray is for organizing—not giving up.” with “Use the tray to hold pieces and free up space on the board.”

---

## 📱 Stats / Leaderboard on mobile

- **Layout** — Tighter padding, scrollable main and leaderboard sub-tabs (no cramped wrap), touch-friendly list rows (min height 52px).
- **List** — Bordered container, player names truncate with ellipsis, rank and time don’t shrink. Header stacks on small screens (tabs → grid selector → Share).

---

## 🧪 Testing

- **Vitest (unit)** — Config in `vite.config.ts`. Example: `playScreenUtils.test.ts` (e.g. `parseGrid`). Scripts: `npm run test`, `npm run test:watch`, `npm run test:ui`.
- **Playwright (E2E)** — Config: `playwright.config.ts`. Tests in `e2e/` (e.g. `home.spec.ts`: menu loads, main buttons visible). Scripts: `npm run test:e2e`, `npm run test:e2e:ui`. First run: `npx playwright install`.
- **CI** — GitHub Action on PRs: lint, typecheck, format check, build, **unit tests**, then **E2E (Chromium)**. Pre-push (Husky): empty-file check, Prettier, ESLint, TypeScript, **unit tests**.

---

## 📲 PWA (Progressive Web App)

- **Installable** — Users can “Install” or “Add to Home Screen” from the live site (e.g. phuzzle.vercel.app).
- **Manifest** — Name, short name, description, theme color, background color, `display: standalone`, start URL, icons (192×192 and 512×512 from existing logo).
- **Service worker** — Generated by `vite-plugin-pwa` (Workbox); precaches built assets; `registerType: "autoUpdate"`.
- **Apple** — `apple-mobile-web-app-capable`, `apple-touch-icon`, status bar style, app title.
- **Assets** — `public/icon-192.png` and `public/icon-512.png` (from app logo).

---

## 📱 Recent updates (mobile, a11y, offline, tests, Stats, home)

- **Home screen** — Removed Help from main actions. Added corner buttons: Stats/Leaderboard (trophy) on left, Help (?) on right. Opens Help choice modal (How to Play, Keyboard & Controls, About).
- **Stats screen** — Renamed "Leaderboard" to "Stats". On mobile: dropdown instead of 8 leaderboard sub-tabs; shorter main tab labels (Dash, Board, Badges); hidden Expand/Compact; shorter Profile hint.

- **Mobile layout** — Setup screen difficulty + time mode in 2-column grid on mobile; shorter dropdown labels; compact mode; tray height 142px. Daily difficulty modal scrollable. Pack list/detail and Stats tweaked for small screens.
- **Accessibility** — ARIA labels on Setup (tabs, buttons, file input), Menu actions, Dropdowns; `role="alert"` on errors; focus-visible for input/select; tab panel semantics.
- **Offline indicator** — Banner when `navigator.onLine` is false: “You’re offline. Puzzles work; leaderboards and co-op need internet.”
- **Loading/error screens** — PageFallback and ErrorBoundary use `100dvh` and safe-area padding.
- **Image validation** — Friendlier error messages; 50MB upload limit; shorter labels on mobile.
- **Tests** — New: `puzzleStorage.test.ts` (save/load/clear/hasSavedGame), expanded `PuzzleManager.test.ts`, `useImagePicker.test.ts`. E2E: setup→play flow, play screen load, packs and stats.

---

## 📄 Documentation

- **README** — Tap-to-rotate reliability (distance/time thresholds, multi-touch fix). Piece tray (compact mode, scroll snapping, scroll indicator). Adding Sample Puzzles: nested subfolders, `import.meta.glob`, supported formats, rebuild note.
- **samplePuzzles.ts** — Doc comment: correct path (`src/app/assets/puzzles/`), clearer folder example, add/remove note.
- **Pull request template** — Testing checklist (unit tests, build, optional PWA). How to Test steps: `npm run test`, `npm run build`, optional E2E and PWA preview.
- **CONTRIBUTORS** — Project name fixed: “ClocksAbound” → “Phuzzle.”
- **supabase/README** — Note that Phuzzle is a PWA and Supabase is used when online.
- **.gitignore** — `test-results/`, `playwright-report/`, `playwright/.cache/`, `.vitest/`.

---

## Summary

- **Mobile:** Completion overlay fits, thinner selection that auto-clears, board scales with piece count, leaderboard layout and touch targets improved.
- **Leaderboards:** Daily, weekly, monthly, all-time views; anonymous mode with raccoon names; profile toggle; docs updated.
- **Performance:** Idle redraw throttle, O(1) snap neighbor lookups, boundary-only snap, bounds-based overlap filter.
- **UX:** Help = How to Play + Keyboard & Controls; clearer menu tip.
- **Testing:** Vitest + Playwright, CI and pre-push run unit tests; E2E on PRs (Chromium).
- **PWA:** Installable app with manifest, service worker, and icons; README and roadmap updated.
- **Docs:** README, PR template, CONTRIBUTORS, supabase/README, and .gitignore updated everywhere relevant.

You can use this as a PR description, release notes, or copy sections for a blog/LinkedIn post.

---

## LinkedIn post (copy-paste)

**Phuzzle just got a big update.** 🧩

I shipped a bunch of improvements to the puzzle game I’ve been building:

**Mobile & UX** — The completion screen now fits properly on small screens. Piece selection is subtler and clears automatically. The board scales better with more pieces so planning on mobile is easier. The leaderboard tab is scrollable and touch-friendly.

**Leaderboards** — Daily, weekly, monthly, and all-time views are in, backed by Supabase. You can go anonymous and show up as a fun raccoon-style name (e.g. “Trash Eater 42”) — you’re still tracked, and you can switch back to your display name anytime.

**Performance** — For 100+ piece puzzles, the canvas redraw is throttled when idle, and snap/overlap logic is optimized so big puzzles stay smooth.

**Help** — The help flow is now two clear options: How to Play and Keyboard & Controls, with no duplicate content.

**Testing & PWA** — Unit tests (Vitest) and E2E (Playwright) run in CI and before push. And Phuzzle is now a PWA: you can install it from the browser (Add to Home Screen / Install app) and get a standalone app experience.

Docs and README are updated to match. If you want to try it or install it on your phone, the link is in the comments. 👇

#Phuzzle #WebDev #PWA #React #SideProject
