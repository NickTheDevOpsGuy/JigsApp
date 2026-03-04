# Phuzzle — Recent Changes Summary

A single post summarizing all recent updates: UX polish, leaderboards, performance, testing, PWA, tap-to-rotate, layout (PDF spec), grid presets, play modes, and docs.

---

## 🧩 Latest (share screen, draw order, seams, unwinnable fix, grid minimum)

### Share screen (no modal)

- **Share Result** and **Challenge Friend** both open the same inline share screen: one panel with “Share how you did” (Copy link, Share Card, Download) and “Challenge a friend” (Copy link, Send challenge). Back returns to completion view; no modal.
- **Files** — `CompletionOverlay.tsx` (single share screen, both sections + divider; removed `shareScreenMode`), `PlayScreen.module.css` (`.shareResultInlineDivider`).

### Piece draw order

- **Locked/placed** pieces draw first (bottom); **movable** pieces draw last (on top) and are hit-tested first, so pieces never appear or get stuck behind locked sections.
- **Files** — `puzzle/canvas/renderBoard.ts` (`isBottom = isPlaced || locked`; sort by bottom then z), `puzzle/canvas/pickPiece.ts` (same order for hit test).

### Unwinnable state fix

- **Overlap-based clamp** — Drag delta is clamped so the group’s bounds keep **overlapping** the playable area (not full containment). A group partly off the bottom can always be dragged up; groups taller than the playable height no longer get an empty allowed range.
- **Files** — `PuzzleManager.ts` (`clampGroupDelta`: `minDx = minX - b.maxX`, `maxDx = maxX - b.minX`, same for Y; removed soft overflow).

### Seam alignment (pixel-perfect)

- **Integer target grid** — Board origin `targetStartX` / `targetStartY` rounded in play screen manager; `setGroupToExactTargetPositions` rounds `x`/`y` when snapping so piece positions are integer and seams line up 100%.
- **Files** — `usePlayScreenManager.ts` (`Math.round` on targetStartX/Y), `PuzzleManager.ts` (`Math.round(p.targetX - p.pad)` in setGroupToExactTargetPositions), `createInitialPieces.ts` (comment only).

### Grid minimum 3×3

- **2×2 removed** — Smallest grid is 3×3. Presets and custom/parseGrid clamp to minimum 3 rows/cols.
- **Files** — `useGridConfig.ts` (MIN_GRID 3), `playScreenUtils.ts` (MIN_GRID_SIZE 3, parseGrid clamp), `playScreenUtils.test.ts` (parseGrid "2x2" → 3×3).

### Docs

- **README.md** — Features: 3×3 to 10×10 grids; share screen (inline, no modal); win screen share copy; grid presets Starter (3×3); Polish: piece draw order, pixel-aligned seams.
- **doc/CHANGES.md** — New “Recent” section for share screen, draw order, seams, unwinnable fix, grid minimum; grid sizes 3×3 to 10×10.
- **src/app/data/changelog.ts** — Version 28: share screen, piece order, seam alignment, unwinnable fix, grid 3×3.

---

## 🧩 Earlier (play modes: Zen, Mystery, Precision, Dynamic Difficulty, Adaptive Personality)

### New modes (Settings → Modes)

- **Zen Ambient** — Toggle hides timer and rankings, adds a subtle animated gradient background and longer transitions for a pressure-free experience. Persisted in localStorage.
- **Mystery Mode** — Full reference image is hidden; regions reveal only after correct placements (uses progressive reveal).
- **Precision Mode** — Each snap records distance (px) before magnet; completion overlay shows average precision and bonus points (e.g. +N for tight snaps). Board and neighbor snap both report precision.
- **Dynamic Difficulty** — Snap tolerance is adjusted from completion history (`adaptiveDifficultyService.getToleranceMultiplier`): 0.9× for fast players, 1.1× for slower, per grid size. Ref is passed into `PuzzleManager` and `getEffectiveTolerance`.
- **Adaptive Personality** — Pace (moves per minute) is derived from placed count and elapsed time. Fast (≥6 moves/min) → competitive UI: shorter HUD labels (“N left”), snappier pill transitions (0.15s). Slow → calm: “N remaining”, gentler transitions (0.4s). Completion message set (calm vs competitive) and tone passed to completion overlay.

### File / folder changes

- **State & persistence** — `Play/playScreenUtils.ts` (storage keys), `playScreenUIInitial.ts`, `usePlayScreenUI.ts`, `usePlayScreenUIPersistence.ts` for the five toggles.
- **Menu** — `headerMenuConfigTypes.ts`, `headerMenuItemsNavModes.ts` (Modes submenu items).
- **Top bar / HUD** — `usePlayScreenTopBarProps.ts` (uiTone from pace, passed in hudProps), `PlayScreenTopBar.tsx`, `PlayHUD.tsx` (uiTone microcopy and `.hudCompetitive` / `.hudCalm` classes).
- **Play screen** — `PlayScreen.tsx` (zen class, mystery preview/reveal, precision ref, dynamic-difficulty ref, completion gate props), `PlayScreen.module.css` (`.zenMode`, `.hudCompetitive`, `.hudCalm`, `.completeStatBonus`).
- **Completion** — `CompletionOverlayGate.tsx` (precision stats, uiTone), `CompletionOverlay.tsx`, `CompletionStatsBlock.tsx` (precision row, bonus), `completionMessages.ts` (tone-based message sets).
- **Puzzle / snap** — `puzzleSnap.ts` (NeighborSnapResult.dist), `PuzzleManager.ts` (onPieceSnapped with precisionPx, dynamicDifficultyMultiplierRef), `puzzleManagerUtils.ts` (EffectiveToleranceOptions.dynamicDifficultyMultiplierRef), `playScreenManagerEvents.ts` (onPrecisionSnap).
- **Service** — `adaptiveDifficultyService.ts` (`getToleranceMultiplier(rows, cols)`).
- **In-app changelog** — `src/app/data/changelog.ts` version 26 with the five new mode entries. **README.md** — Features and Documentation updated; key-files note for play modes.

---

## 🧩 Earlier (completion layout, tray, lock smoothness)

### Completion screen

- **Larger image** — Puzzle image on the win overlay is more prominent (e.g. `min(52vh, 280px)` desktop, `min(42vh, 220px)` mobile).
- **Vertical menu** — Action buttons (Continue, Play again, Back to home, Share Result) are in a single column, full-width menu instead of a 2×2 grid.

### Mobile tray

- **Shorter tray** — On viewports ≤600px, tray height reduced from 200px to 175px (195px for large puzzles) to free vertical space for the board.

### Lock animation

- **Smooth snap** — When pieces lock to the board, they lerp from the last **display** position (interpolated drag position) to the exact target over 120ms (ease-out) instead of jumping. Applied on both desktop and mobile.
- **Implementation** — `lockLerpOverrides` in animation state; `lastPiecePositionsRef` updated from `dragDisplayOverrides` during drag so the lerp starts from where the piece was drawn; `renderBoard` uses `undoSnapBackOverrides ?? lockLerpOverrides ?? dragDisplayOverrides` for draw order.

### Refactors (code structure)

- **Stats** — `screens/Stats/hooks/useStatsScreenState.ts`, `useStatsScreenData.ts`, `hooks/index.ts`; StatsScreen composes them.
- **Piece Tray** — `components/PieceTray/usePieceTrayDisplay.ts`, `usePieceTrayScroll.ts`, `usePieceTrayThumbs.ts`; PieceTray uses them for filter/scroll/thumbs.
- **SFX** — `audio/soundsSfxTypes.ts`, `soundsSfxSnap.ts`, `soundsSfxMisc.ts`, `soundsSfxComplete.ts`; `soundsSfx.ts` re-exports.
- **Play hooks** — `useSnapComboAnnouncer.ts`, `usePlayScreenUIPersistence.ts`; usePlayScreenManager and usePlayScreenUI use them.
- **Setup** — `screens/Setup/hooks/useSetupScreenGalleryScroll.ts` for gallery scroll state.
- **Leaderboard** — `screens/Stats/tabs/LeaderboardTabLists.tsx` (renderTimeList, renderCompletionList).
- **Menu config** — `data/menuConfigConstants.ts` (TIME_MODE_LABELS, MenuNode); `menuConfig.ts` re-exports getMenuTree and MenuNode.
- **Header menu items** — `headerMenuItemsDisplay.ts` (display/effects/assistance/piece shape), `headerMenuItemsRest.ts` (audio/advanced/stats/share/contribute/help); `headerMenuItemsDisplayRest.ts` composes getDisplayAudioAdvancedItems.
- **Viewport** — `hooks/viewportStorage.ts` (loadViewport, saveViewport, MIN/MAX_SCALE, ViewportState); `useViewport.ts` uses it for persistence.
- **Pointer handlers** — `PointerHandlerFactoryDeps` moved to `pointerHandlers/types.ts`; factory re-exports it.
- **Win screen Share** — Share is a full menu row (Button, same style as Play again / Back to home) so it’s always visible.
- **Lock animation** — Logic kept in `usePlayScreenAnimation.ts` (120ms lock lerp, ease-out 1-(1-t)^1.6, drag position snapshot when drag ends) for smooth snap.
- **README** — File/folder structure updated; playScreenAnimationOverrides removed after inlining again. **doc/CHANGES.md** — Code structure section updated.

### Docs

- **README** — File/folder structure includes refactor adds (Stats hooks, PieceTray hooks, SFX split, Play hooks, Setup gallery scroll, LeaderboardTabLists; menuConfigConstants, headerMenuItemsDisplay/Rest, viewportStorage; playScreenAnimationOverrides).
- **changelog.ts** — Version 19: Win screen Share as menu option; lock animation restored in usePlayScreenAnimation. Version 18: menu config, header items, viewport, pointer types. Version 17: code refactor. Version 16: smooth lock, completion, tray.

---

## 🏆 Earlier (win screen, confetti, mobile, a11y, docs)

### Win screen redesign

- **New completion overlay** — Image at top, stats block (Time, Moves, Accuracy, Rank with icons), “Can you beat my run?”, primary **Continue** button (with play icon), secondary **Share Result** link. Rank shows “#X / Y (Top Z%)” when leaderboard data exists.
- **Confetti on win** — Burst when the completion overlay appears (theme-colored); respects `prefers-reduced-motion` and battery saver.
- **CompletionOverlayGate** — New wrapper component in `PlayScreen` to keep completion props in one place.

### Mobile & accessibility

- **Compact layouts** — Menu, Setup, Stats, Packs, Play: no page scroll; content scrolls inside cards where needed. Touch targets ≥44px; 16px inputs on mobile to prevent iOS zoom.
- **Skip link** — “Skip to main content” (visually hidden, visible on focus); `<main id="main">` wraps app content; clicking/focusing the link moves focus into main for screen readers. Documented in Keyboard & Controls modal.
- **Loading states** — New `Loader` component (spinner + label); used on Stats and Packs while data loads. Spinner respects reduced motion.
- **Touch-action** — `touch-action: manipulation` on board wrapper and tray to prevent double-tap zoom; canvas keeps `touch-action: none` for pan/zoom.
- **Reduced motion** — Tray piece pulse animation disabled when `prefers-reduced-motion: reduce`; confetti and completion animations already gated in JS/CSS.

### PWA & docs

- **Manifest** — `display_override`, `categories: ["games", "entertainment"]`, `theme_color` to brand blue; `includeAssets` adds icons and og-image.
- **Changelog (in-app)** — Version 14: win screen, confetti, mobile polish, skip link, reduced motion.
- **README** — Mobile layout section updated (touch-action, tray spacing, win screen, loading spinners).
- **CHANGELOG_UPDATE.md** — This section added for release notes.
- **Lighthouse / a11y** — `doc/LIGHTHOUSE.md` documents the skip link and main landmark for audits (bypass blocks, main region).
- **E2E** — Completion overlay test: `e2e/play-screen.spec.ts` uses `?e2eCompletion=1` to assert “Puzzle Completed!” and “Continue” without solving the puzzle.

### Refactors

- **StatsScreen** — Formatting helpers moved to `statsFormatting.ts` (formatDuration, formatTime, formatGap, getDatesInWeek, formatWeekRangeLabel, PODIUM).
- **PlayScreen** — Completion overlay block replaced by `CompletionOverlayGate` component.

---

## 🧩 Earlier (undo animation, drag lift, daily comments)

### Undo snap-back animation

- **Single-step undo** — Undo reverts last placement/drag; piece animates back to prior position (~280ms ease-out)
- **Ctrl/Cmd+Z** — Keyboard shortcut triggers same animation
- **Files** — `playUtils.ts` (`createUndoRedoHandler`, `UndoSnapBackFrom`), `usePlayScreenAnimation.ts` (`undoSnapBackRef`), `renderBoard.ts` (`undoSnapBackOverrides`), `HeaderMenu.tsx` (shortcuts)

### Drag lift (visual polish)

- **Stronger shadow** — Dragged piece: blur 28px, offset 8×12px, opacity 0.55
- **Scale-up** — 1.02× when dragging (piece feels physically lifted)
- **Top z-order** — Dragged group always drawn last
- **Files** — `renderBoardHelpers.ts` (`DRAG_SCALE`, `applyPieceShadow`), `renderBoard.ts` (sort by dragged group)

### Daily puzzle comments & reactions

- **Emoji reactions** — 👍 🎉 🔥 ✨ 💪 after daily completion; one per user per day
- **Comments** — 280 char limit; post after completion; report button for moderation
- **Tables** — `daily_comments`, `daily_reactions`, `daily_comment_reports`
- **Files** — `dailyCommentsService.ts`, `DailyReactions` component, `CompletionOverlay.tsx` (when `isDaily`)

### Win screen & Share Result

- **Removed New Puzzle** — From completion overlay; users go to Menu to start new
- **Share Result popup** — Single button opens modal with Share Card PNG, Seasonal frame checkbox, Download; modal has X close
- **Piece Shape submenu** — Settings → Gameplay → Piece Shape (Classic/Irregular/Hard) with heading and "Applies to next puzzle" hint
- **Submenu headings** — Section headings with underline under each submenu for orientation

### Supabase migrations

- **Two migrations** — `20260225120000_tables.sql` (tables, indexes, realtime, server-time RPC), `20260225120001_rls.sql` (RLS + policies)
- **Idempotent** — Both skip existing objects; run via `npx supabase db push` or SQL Editor
- **File structure** — Migrations in `supabase/migrations/` with timestamp prefixes

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
