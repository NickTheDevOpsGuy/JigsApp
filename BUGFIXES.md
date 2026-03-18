# Bug Fixes

A complete record of every bug found and fixed during the March 2026 audit. Organised by file. All fixes are included in the codebase.

---

## Puzzle Engine

### `renderBoardDrawPieceHelpers.ts`

- **Double-rotation bug** — `toPieceSpace` re-applied `p.rotation` on cached pieces where rotation was already baked in. Shadows and outlines were misaligned on all rotated pieces. Fixed with separate `toPieceSpaceCached` vs `toPieceSpaceLive` paths.

### `puzzleSnap.ts`

- **Wrong delta used for all pieces in a group** — `computeMergedGroupBoardSnapResult` used the reference delta from the first piece for every piece in the group. Pieces far from the reference snapped to the wrong position. Fixed to compute a per-piece delta.

### `puzzleManagerPointerOps.ts`

- **Performance timeline leak** — 8 `performance.mark/measure` calls fired on every `pointerUp`, accumulating thousands of entries over a session. Removed from production path.
- **Touch drag not counted** — `dragCount` was not incremented for touch drags, only mouse drags. Fixed.

### `puzzleManagerRestore.ts`

- **Lock validity epsilon too tight** — Epsilon was 4px. Responsive layout changes between sessions (different screen size or orientation) could invalidate legitimate saves. Raised to 8px.

### `puzzleStorage.ts`

- **Saved game not found after deploy** — `hasSavedGame` used exact image URL matching. Vite content-hash suffixes change on every deploy, orphaning all in-progress saves. Fixed with `imageIdentity()` hash-stripping for stable matching.

### `PuzzleManagerEngineActions.ts`

- **Locked pieces not clamped after unlock** — `setPieceLockingEnabled(false)` left previously-locked pieces outside the board interior. Added `clampAllBoardGroupsInsideBoardInterior()` after unlock.

### `renderBoard.ts`

- **Fog overlay bled into transparent padding** — Fog used `fillRect` over the full bounding box including piece tab padding. Fixed to clip to `shapePath` before filling.

### `pickPiece.ts`

- **Hit slop made all pieces rectangular on mobile** — `hitSlopPx` fallback fired on any `isPointInPath` miss, treating every piece as a rectangle. Fixed to only accept slop when the pointer is near an actual edge.

### `shape.ts`

- **Bezier control points overshooting crown apex** — `buildHorizontalConnector` and `buildVerticalConnector` produced diamond shapes instead of round knobs. Fixed by lerping control points at 60% toward `crownY`.

---

## Play Screen — Lifecycle

### `usePlayScreenManagerCore.ts`

- **Stale completion ref blocked re-init** — `stateRef?.current?.isComplete` guard prevented the manager from re-initialising after completing a puzzle. Fixed to check `managerResult.getState()?.isComplete` live.
- **Same-route navigation didn't re-init** — Navigating `/play → /play` with a new puzzle didn't trigger re-init because the pathname didn't change. Added `useLocation()` + `locationPuzzleKey` dep.

### `usePlayScreenLifecycleEffects.ts`

- **`completionImageUrl` in `toDataURL` effect deps** — Including it caused infinite loop potential on completion. Removed from deps.

### `usePlayScreenPersistence.ts`

- **Save fired every elapsed second** — Save effect had `elapsedSeconds` in its deps, writing to localStorage 60 times a minute during active play. Added `lastSavedStateRef` to skip saves when state is unchanged.

### `usePuzzleLifecycle.ts`

- **Dead code never imported** — Marked `@deprecated DEAD CODE` with JSDoc listing known bugs inside it so it's never accidentally wired up.

### `usePlayScreenSecondaryEffects.ts`

- **`recordCompletion` and `recordAdaptiveCompletion` name collision** — Both `statsService` and `adaptiveDifficultyService` exported `recordCompletion`. Import sites used aliases but any future file importing both without aliasing would silently call the wrong one. Renamed adaptive service export to `recordAdaptiveCompletion`.

### `playScreenSceneBehavior.ts`

- **Duplicate canvas snapshot effect** — `toDataURL` and `exit_before_completion` PostHog capture were both duplicated from `usePlayScreenLifecycleEffects`. Removed duplicates — both effects were running twice on completion.

---

## Play Screen — State & Setup

### `playScreenScenePrimarySetup.ts`

- **`GRID_ONCE_KEY` lost in StrictMode** — The "use grid size once" key was read in `useMemo` then deleted in `useEffect`. In StrictMode double-invoke, the first mount's effect deleted the key before the second mount's `useMemo` could read it. Fixed by capturing the value in a `useState` initializer (runs once per lifetime, before any effects).

### `usePlayScreenUIPersistence.ts`

- **22 separate `useEffect` hooks** — One per UI setting. React checked 22 dep arrays on every render. Collapsed into a single batched effect with all 24 deps.

### `playScreenUIInitial.ts`

- **Dead branches in `getPieceLockingInitial`** — `explicit === "false"` and `explicit === "0"` are conditions that can never be written by the app. Annotated as dead code.

---

## Play Screen — Animation

### `usePlayScreenAnimationCore.ts`

- **Performance timeline leak in debug mode** — `performance.mark("render-frame-end")` and `performance.measure()` ran every animation frame without cleanup, accumulating 60 entries/second. Added `clearMarks/clearMeasures` after each measure.

### `usePlayScreenAnimationHelpers.ts`

- **100 array iterations per frame** — `shouldPublishState` called `st.pieces.filter((p) => p.isPlaced).length` every frame. `st.placedCount` already tracks this. Switched to read the pre-computed value — eliminates ~360k redundant iterations per minute on a 100-piece puzzle.

---

## Play Screen — Input

### `usePointerHandlersCore.ts`

- **Pointer handlers rebuilt on every pinch frame** — `useMemo` had `viewport` in its deps. `viewport` is a state object that changes on every pan/pinch frame — rebuilding all handlers during active touch interaction caused dropped events on mobile. Fixed with `ctxRef` pattern; `viewport` removed from deps.

### `usePlayScreenBoardInteractions.ts`

- **`screenToBoard` rebuilt on every piece move** — `useCallback` deps included `state?.pieces`, a new array reference on every drag update. This rebuilt pointer handler closures mid-drag, risking dropped events. Moved all layout-derived values into `screenToBoardInputsRef`, giving `screenToBoard` a stable identity with `[]` deps.

---

## Play Screen — Viewport

### `useViewportCore.ts` (previously `useViewport.ts`)

- **`isPanningRef` and `isPinchingRef` were module-level globals** — Shared across all `useViewport` instances. StrictMode double-invoke or concurrent route transitions could corrupt the panning/pinching state. Moved inside the hook as `useRef()`.

### `viewportMath.ts`

- **Content drifted off-screen when zoomed out** — `clampPan` allowed content to slide to the top-left corner when the puzzle was smaller than the container. Fixed to centre content when `scaledW <= containerW`.

### `viewportStorage.ts`

- **60 localStorage writes per second during pinch** — `saveViewport` fired on every viewport state change with no debounce. Added 300ms debounce per puzzle key.

---

## Play Screen — Completion

### `useCompletionOverlayData.ts`

- **`recordDailyCompletion` fired every elapsed second** — `elapsedSeconds` was in the effect deps; on a completed daily puzzle the timer still ticks, triggering a localStorage write every second. Added `dailyRecordedRef` guard — fires exactly once per mount.
- **`handleShareResultCard` was a duplicate of `handleShareCard`** — Both called `shareCard()` with identical arguments and `mode: "result"`. Removed the duplicate, replaced with an alias.

### `playScreenSceneOverlays.ts`

- **Completion image priority was backwards** — `imageUrl` was `imageRefUrl ?? fallbackImageUrl ?? completionImageUrl`. The canvas `toDataURL` snapshot (the actual solved board) was last priority. Fixed to `completionImageUrl ?? imageRefUrl ?? fallbackImageUrl`.

---

## Play Screen — Sharing

### `usePlayScreenShareSession.ts`

- **Supabase session created on every completion** — The hook auto-created a Supabase session on completion just to build a share URL, even when the user never tapped Share. The URL fallback already handles this without a server call. Removed auto-create; added `createShareSession()` called only when the user explicitly shares.

### `useShareResults.ts`

- **Copied feedback timer race** — `handleCopyResults` and `handleCopyChallenge` each set independent `setTimeout(, 2000)` timers. Rapid tapping could have the first timer clear feedback from the second copy. Added `copiedTimerRef` that cancels the previous timer before setting a new one.

---

## Play Screen — Replay

### `useReplay.ts`

- **Side effects inside a state updater** — The RAF tick called `manager.restoreFromSaved()` and `setState()` inside a `setReplayIndex()` functional updater. React functional updaters must be pure — calling another state setter inside one is undefined behaviour that re-executes in StrictMode. Refactored to `replayIndexRef` for imperative tracking; side effects moved outside the updater.
- **Ghost frame after replay end** — `cancelAnimationFrame` was called on a potentially stale RAF ID before the next frame's ID was assigned. Fixed: cancel before scheduling, and `return` immediately after.
- **`clearSnapshots` crashed during active replay** — Clearing `snapshotsRef.current` while the RAF was running caused the next tick to call `restoreFromSaved(list[-1])` = `undefined` → crash. Fixed to cancel the RAF and set `isReplaying=false` before clearing.

---

## Services — Stats & Achievements

### `statsService.ts`

- **Duplicate completion rows** — `recordCompletion` unconditionally inserted a new row on every call. StrictMode double-invoke or replay-triggered re-renders produced duplicate records. Added a 60-second dedup window check before inserting.
- **Mastery streak destroyed on replay** — If a user solved the daily with mastery then replayed without mastery, the `else` branch reset `mastery_streak` to 0 — destroying a legitimate streak. Fixed: only break the streak if there is no mastery solve for today at all.

### `achievementsService.ts`

- **N+1 Supabase inserts** — One `INSERT` per newly-unlocked achievement. On a first completion where many achievements unlock, up to 22 sequential round-trips. Changed to collect all inserts and fire a single batched `INSERT`.

### `adaptiveDifficultyService.ts`

- **Function name collision with `statsService`** — Both exported `recordCompletion`. Renamed to `recordAdaptiveCompletion` with deprecated alias for backwards compatibility.

---

## Services — Leaderboard

### `leaderboardFetchersDaily.ts`

- **Duplicate entries per user** — `getDailyLeaderboard` didn't deduplicate by user. A player who replayed could appear multiple times in the top 10. Added `bestByUser` Map dedup matching the pattern already used in `getLeastMoves` and `getCleanest`.

### `leaderboardFetchersShared.ts`

- **Unbounded `getPercentileRank` query** — Fetched every completion row for a grid size with no date filter or limit. On a popular size this could return tens of thousands of rows. Added 90-day cutoff and `limit(5000)`.

### `leaderboardFetchersPeriod.ts`

- **Local timezone in date range** — `getDateRange()` used `new Date()` with local timezone arithmetic. A UTC+12 user at 11pm could get tomorrow's date as the range end. Fixed to use `Date.now()` and UTC ISO strings.
- **`getMonthlyTotalsLeaderboard` not cached** — Every other leaderboard fetcher wraps with `withLeaderboardCache()`. This one was missed, firing a fresh DB query on every render. Added the cache wrapper.
- **`getWeeklyTotalsLeaderboard` had no row limit** — Query had no `LIMIT`, potentially fetching thousands of rows in a busy week. Added `.limit(50000)`.

---

## Services — Auth & Profile

### `auth.ts`

- **`ensureSignedIn` called on every Supabase operation** — Each service call (stats, achievements, leaderboard, profile) called `supabase.auth.getSession()` independently — up to 5+ sequential auth round-trips on puzzle completion. Added module-level `cachedUserId` — returns immediately after first sign-in.

### `profileService.ts`

- **SELECT before upsert** — `updateMyProfile` did a `SELECT` to decide between `INSERT` and `UPDATE`. Two round-trips per call. Replaced with a single `.upsert({ onConflict: "user_id" })`.

---

## System Hooks

### `useBoardRefsReady.ts`

- **`useLayoutEffect` ran on every render** — Missing `[]` dependency array. The RAF was scheduled and immediately cancelled on every re-render of the parent component. Added `[]`.

### `useHaptics.ts`

- **`enabled` value was stale** — Read once at render time with no reactivity. Toggling haptics from a keyboard shortcut wouldn't update toggle UI until something else caused a re-render. Changed to `useState`.

### `useAutoBatterySaver.ts`

- **Inconsistent CPU threshold** — Used `<= 4` cores while `usePlayScreenSceneState` used `<= 6`. A 5–6 core device triggered battery saver in scene state but not here. Aligned to `<= 6`.

### `useSnapComboAnnouncer.ts`

- **"Nice!" threshold too low** — Fired at 2 combos within 2.5s, which happened constantly during normal play, making it meaningless. Raised to 3 / "Nice!", 5 / "Combo!", 8 / "Unstoppable!".

---

## Components

### `App.tsx`

- **`PlayScreen` never fully remounted on same-route navigation** — `/play → /play` with a new puzzle didn't unmount the component tree. Only the manager re-initted; timer state, completion state, and other hooks kept stale values. Extracted `AppRoutes` component with `useLocation()`, added `key={playKey}` to `ErrorBoundary` wrapping `PlayScreen`.

### `DailyDifficultyModal.tsx`

- **`navigate("/play")` didn't force remount** — Same same-route bug as `ChoosePuzzleModal` and `PackDetailScreen`. Fixed to `navigate("/play", { replace: true, state: { puzzleKey: Date.now() } })`.
- **Streak not shown before starting** — Users had no idea what their current streak was when opening the daily modal. Added streak badge.

### `MenuScreen.tsx`

- **Streak value was stale** — `useState(() => getCurrentStreak())` ran once at mount. If the user completed the daily in another tab or the date rolled over while backgrounded, the streak shown was stale. Added `focus` and `visibilitychange` listeners to refresh.
- **Social proof threshold too high** — "X players solved today" only appeared when X ≥ 10. Lowered to 3.

### `Minimap.tsx`

- **Tap-to-pan could push pieces off-screen** — `handlePointerDown` computed new pan values without clamping. Tapping the minimap edge could viewport-pan all pieces out of view. Added `clampPan()`.
- **Canvas redrawn on every drag frame** — `draw` depended on `pieces` directly. `pieces` is a new array reference on every piece move, causing 60fps minimap repaints during drag. Replaced `pieces` dep with `placedByCell` (the `useMemo` derived value) — redraws only on actual placement changes.

### `useOnboarding.ts`

- **Auto-dismiss raced with first-snap detection** — The "start" tip auto-dismissed at 3s via `setStep("done")`. If the user snapped their first piece at 2.5s, the first-snap effect set `step = "firstSnapDone"`, then the 3s timer overrode it to `"done"` — permanently skipping the tray tip and zoom tip. Fixed with a functional state updater that only dismisses if still on `"start"`.

### `safeLocalStorage.ts`

- **`QuotaExceededError` swallowed silently** — `setItem` caught all errors including storage quota errors. On mobile when storage is full, puzzle saves silently failed with no feedback. Added `console.warn` for quota errors.

### `prestigeService.ts`

- **Prestige threshold too low** — `PRESTIGE_MIN_LEVEL = 5` was reachable in roughly 2 puzzles, making prestige meaningless. Raised to 10.

---

_51 bugs fixed across 40 files. See [README.md](./README.md) for project overview._
