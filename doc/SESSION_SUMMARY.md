# Session Summary – [Date]

Summary of all changes on `bugfix/layout` and related work. Includes piece drawer, touch/input, layout polish, leaderboards, co-op, packs, onboarding, testing, PWA, and docs.

---

## Grid Presets, Piece Counts & Undo (Latest)

- **Extreme 9×9** – New 81-piece preset between Legend and Custom (Setup, Today's Puzzle)
- **Piece counts in labels** – All difficulty dropdowns show count: "🌱 3×3 (9 pieces)", "Custom 5×5 (25 pieces)" (mobile & desktop)
- **Suggested difficulty** – "Based on your progress, try X×Y next" includes 9×9 when 8×8 completed
- **Custom grid hint** – "Larger puzzles may run slower on some devices" when choosing 81+ pieces
- **Undo cap** – 50 steps for ≤64 pieces, 25 for 81+ (reduces memory on large puzzles)
- **Stats/leaderboard mobile** – `cardContent` flex/scroll layout; content fits and scrolls inside card; `data-testid="stats-card-content"`
- **E2E** – Stats mobile viewport test; Setup and Daily 9×9 preset tests; changelog v7 in all specs; Playwright 4 workers
- **Docs** – `changelog.ts` v7, README grid section, CHANGELOG_UPDATE, E2E coverage note

---

## Piece Drawer (Mobile & Desktop)

- **Compact mode** – Default on for 25+ pieces (mobile and desktop); user can toggle via expand/collapse button
- **Sticky filter row** – Header with All/Edges/Center/Corners and Grid/Color sort stays visible when scrolling thumbnails
- **Scroll snapping** – `scroll-snap-stop: always`, `scroll-behavior: smooth` for quicker piece selection
- **Visual “you are here” indicator** – Scroll progress bar (6px height)
- **Tray height** – Desktop: 120px → 150px; mobile: 92px → 130px; tablet: 160px → 180px
- **Filters wrap** – On small screens, filter buttons wrap cleanly

---

## Input: Multi-Touch & Tap-to-Rotate

- **Pointer filtering** – Ignore a second touch on a piece when another touch is already dragging; only one piece moves per interaction (`setPointerCapture`, `activePointerIdRef`)
- **Tap-to-rotate** – Single tap on piece rotates 90°. Distance threshold 6px → 8px, time 400ms → 350ms to reduce accidental rotate while dragging
- **Double-trigger guard** – Avoids duplicate rotate when both click and touch/pointer fire on some devices
- **Pinch zoom unchanged** – Two-finger pinch on empty space zooms only; never rotates pieces

---

## Play Screen & Mobile Polish

- **Completion overlay (mobile)** – Text stays in container: padding, scroll, responsive font sizes (smaller heading/body on narrow screens), word-wrap
- **Piece selection** – Blue border 1.5px; auto-clears after 1s; tapping empty board clears immediately
- **Board size by piece count** – Mobile: 16+ pieces → 96% fill, 25+ → 98% so bigger puzzles get more screen space
- **Smooth scrolling** – Completion overlay `-webkit-overflow-scrolling: touch` for better iOS scroll
- **PZ-045** – Prevent text selection and Safari callouts on touch (`user-select: none`, `-webkit-touch-callout: none`)

---

## Image Validation

- **Grid-based resolution rules**
  - 3×3–4×4: min 160px (shortest side)
  - 5×5–6×6: min 280px or 45px per piece
  - 7×7+: min 400px or 45px per piece; suggest smaller grid
- **`validateBeforeStart`** – Runs when user clicks “Start Puzzle”
- **Error handling** – Clear messages for corrupted or failed loads; checks `naturalWidth`/`naturalHeight`

---

## Milestone Progress & Undo/Redo

- **`placedCount`** – Counts only correctly placed pieces (at target position with correct rotation), not largest group
- **Undo/redo safe** – `recomputeDerivedState` recalculates from piece positions; milestones behave correctly after undo/redo
- **PostHog** – Events for milestone popups, streak moments, time to first snap

---

## Leaderboards & Anonymous Mode

- **Leaderboard views** – Daily (today’s daily by time), Weekly (7 days), Monthly (30 days), All-time completions, Streaks, All-time best by grid. Supabase-backed.
- **Anonymous mode** – Toggle in Profile (Stats): “Show my name on leaderboards.” When off, display as raccoon-style name (e.g. “Trash Eater 42”), still tracked.
- **PZ-041** – Very narrow screens (e.g. 320px): compact leaderboard layout, tabs in single scrollable row

---

## Stats / Leaderboard on Mobile

- **Layout** – Tighter padding, scrollable main and leaderboard sub-tabs, touch-friendly rows (min height 52px)
- **List** – Bordered container, player names truncate with ellipsis, rank/time don’t shrink
- **Header stacks** – Tabs → grid selector → Share on small screens

---

## Performance (100+ piece puzzles)

- **Canvas redraw** – Idle redraw throttled to 30fps for 50+ pieces; full rate during drag and completion
- **Snap** – Single (row, col) → piece map, O(1) neighbor lookups; only boundary pieces considered for neighbor snap
- **Overlap** – Bounding boxes first; piece-by-piece only for groups that intersect

---

## Time Modes

- **Elapsed** – Timer counts up from zero (default)
- **Countdown** – Race against the clock; options 5/10/15/20/30 min
- **Active-only** – Timer pauses when not interacting
- **Relaxed** – Timer hidden
- **Best time** – Compare against personal best

---

## Share, Co-op & Puzzle Sessions

- **Share button removed** – Removed from top bar center; sharing via Menu → Share → “Play with friend?”
- **Puzzle sessions** – Real-time collaborative play; `puzzle_sessions` table, Supabase Realtime publication
- **Share verification docs** – “Verifying Share / Co-op” in `doc/SUPABASE_SETUP.md`

---

## Help Flow & Menu

- **HelpChoiceModal** – Menu “Help” and ? key open modal: How to Play or Keyboard & Controls (no submenu)
- **About** – Moved to top-level menu item
- **Keyboard & Controls** – Renamed from “Keyboard shortcuts”; no duplicate content with How to Play
- **Menu tip** – “Use the tray to hold pieces and free up space on the board.”

---

## Mobile Modals (Help, How to Play, Shortcuts)

- **Sticky dismiss** – “Got it!” / “Start Puzzling!” fixed at bottom
- **Sticky close** – Shortcuts modal header with × stays at top
- **Condensed content** – How to Play hides Time Modes, Menu Options, Tips, second Piece Drawer paragraph on mobile
- **Modal size** – 70vh (How to Play), 75vh (Shortcuts) on mobile
- **Shortcuts layout** – Stacked key + action; scrollable middle
- **Flex layout** – Header/footer fixed; content scrolls

---

## Help Screen Content

- Piece Drawer section: filters (All, Edges, Center, Corners), compact mode for 25+ pieces, sort by grid/color

---

## Puzzle Packs

- **Pack list** – Curated themes; progress tracked per pack
- **Pack detail** – Grid of puzzles; completed/total per pack
- **Pack completion** – `packCompletion.ts`, `puzzlePacks.ts`

---

## Onboarding

- **Steps** – start → firstSnapDone → trayTipSeen → done
- **First snap toast** – Celebration on first piece placed
- **OnboardingTooltip** – “Drag a piece”, tray tip, zoom tip
- **Persistence** – `phuzzle:onboarding` in localStorage

---

## Testing

- **Vitest** – Unit tests in `vite.config.ts`; e.g. `playScreenUtils.test.ts`
- **Playwright** – E2E in `e2e/`; `home.spec.ts` (menu, buttons); Stats mobile, Setup/Daily 9×9; 4 workers
- **CI** – Lint, typecheck, format, build, unit tests, E2E (Chromium) on PRs
- **Pre-push** – Husky: Prettier, ESLint, TypeScript, unit tests
- **Manual** – Before release: verify Stats scrolling and 9×9 preset on a real device

---

## PWA

- **Installable** – “Install” / “Add to Home Screen” from live site
- **Manifest** – Icons 192×192, 512×512; `display: standalone`
- **Service worker** – `vite-plugin-pwa` (Workbox); `registerType: "autoUpdate"`
- **Apple** – `apple-mobile-web-app-capable`, `apple-touch-icon`

---

## Documentation

- **`doc/`** – `SUPABASE_SETUP.md`, `README.md` index, `SESSION_SUMMARY.md`
- **README** – Tap-to-rotate, piece tray, sample puzzles path, Supabase link, doc structure
- **Supabase Realtime** – `ALTER PUBLICATION supabase_realtime ADD TABLE puzzle_sessions` (SQL Editor)
- **PR template** – Testing checklist
- **CONTRIBUTORS** – “ClocksAbound” → “Phuzzle”
- **.gitignore** – `test-results/`, `playwright-report/`, `.vitest/`

---

## Changelog

- **v7** – Extreme 9×9, piece counts in labels, Stats mobile fix, undo cap, custom hint, E2E coverage
- **v4** – Piece drawer, touch fixes, image validation, milestone progress, help menu
- Time modes, Stats & Leaderboards, Undo/Redo, ghost hint, lock pieces

---

## Lint & Cleanup

- Removed unused `isCoarsePointer` from `PieceTray`
- Removed `connectedCount`, `shareCopied` from PlayScreen
- Removed unused imports

---

## Merged PRs (bugfix/layout lineage)

- #313 Bugfix/game
- #299 Feature/updates
- #298–#297 Feature/leadership
- #296 Bugfix/precentagedone
- #295 Features/addinstuff

---

## Files Changed (Representative)

| Area           | Files                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Piece Drawer   | `PieceTray.tsx`, `PieceTray.module.css`                                                                                                          |
| Input          | `usePointerHandlers.ts`, `touchHandlers.ts`, `types.ts`                                                                                          |
| Image          | `useImagePicker.ts`, `SetupScreen.tsx`                                                                                                           |
| Game logic     | `PuzzleManager.ts`, `createInitialPieces.ts`, `renderBoard.ts`                                                                                   |
| Play screen    | `PlayScreen.tsx`, `PlayScreen.module.css`, `CompletionOverlay.tsx`, `HeaderMenu.tsx`, `PlayHUD.tsx`, `TopBarButtons.tsx`, `headerMenuConfig.tsx` |
| Help/Modals    | `Modal.module.css`, `TutorialOverlay.tsx`, `ShortcutsModal.module.css`, `HelpChoiceModal.tsx`                                                    |
| Packs          | `PackListScreen.tsx`, `PackDetailScreen.tsx`, `packCompletion.ts`, `puzzlePacks.ts`                                                              |
| Sessions/Co-op | `usePuzzleSession.ts`, `puzzleSessionService.ts`, `003_puzzle_sessions.sql`                                                                      |
| Onboarding     | `useOnboarding.ts`, `OnboardingTooltip.tsx`                                                                                                      |
| Stats          | `StatsScreen.tsx`, `StatsScreen.module.css`                                                                                                      |
| Time           | `timeMode.ts`, `useTimeModeConfig.ts`, `usePlayScreenTimer.ts`, `PlayHUD.tsx`                                                                    |
| Docs           | `doc/`, `README.md`, `CHANGELOG_UPDATE.md`                                                                                                       |
| Changelog      | `changelog.ts`                                                                                                                                   |
