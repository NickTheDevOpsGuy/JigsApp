# Phuzzle - Full Feature List

Detailed list of features. See [README](../README.md) for a quick overview.

---

## Recent: Win screen refresh, replay, share cards

- **Win screen** — Redesigned: starry celebratory background, “PUZZLE COMPLETE!” banner (golden-orange with puzzle icon), completed puzzle image, two stat cards (Time | Moves), **Watch Replay** (when available), and **Next Puzzle** as primary CTA. On mobile the completion panel is aligned to the top.
- **Replay** — After completing a puzzle you can **Watch Replay** from the win screen; progress is recorded as snapshots and played back at 1×–10× speed (play/pause, progress bar, close). Playback uses requestAnimationFrame for smooth updates on desktop and mobile.
- **Share cards** — Challenge card (“PUZZLE CHALLENGE”) and result card (“PHUZZLE RESULT”) have distinct layouts; result card is informational (Time, Accuracy, no taunt copy). Full puzzle image on cards (no missing-piece cutout).

## Recent: Mobile/touch hardening + architecture split

- **Touch drag hardening** — Dynamic tap-vs-drag threshold for coarse/high-DPI devices; touch move throttle tuned by device class to reduce jitter without changing behavior.
- **Drag UI safety** — Minimap suppression while active drag on coarse pointers; safe-area guardrails for top/bottom controls; 44px minimum touch targets for key actions.
- **Orientation recovery** — Rotation triggers board re-measure + viewport reset/recenter flow to avoid off-screen board issues.
- **Piece lock diagnostics** — Lock-debug paths are isolated (`puzzleLockDebug.ts`) with tests and overlap tracing to validate lock behavior regressions safely.
- **Play screen split** — `PlayScreen.tsx` delegates through `PlayScreenController.tsx`, `PlayScreenMain.tsx`, and scene/layout modules with focused hooks (`usePlayScreenLifecycleEffects.ts`, `usePlayScreenBoardInteractions.ts`, `usePlayScreenSceneState.ts`, `usePlayScreenTrayPieces.ts`).
- **Puzzle manager split** — Core logic split into operation modules (`puzzleManagerPointerOps.ts`, `puzzleManagerSnapOps.ts`, `puzzleManagerActionsOps.ts`, `puzzleManagerNeighborSnapOps.ts`, `puzzleManagerBoardOps.ts`) plus engine/runtime/core files.
- **CSS split** — Large CSS files split into base/layout/responsive modules across play/setup/stats/menu/components for safer mobile iteration.

---

## Recent: Share flow, draw order, seams, unwinnable fix, grid minimum

- **Completion share actions** — Win overlay now uses direct actions: **Share Result** and **Share with People**. Copy/native share text is neutral (no taunts), and share card generation uses a cleaner message-style layout for mobile sharing.
- **Piece draw order** — Locked or placed pieces draw first (bottom); movable pieces always draw on top and are hit-tested first, so pieces never get stuck behind locked sections.
- **Unwinnable state fixed** — Drag clamp uses overlap with the playable area (not full containment), so a group partly off the bottom can always be dragged back up; tall groups no longer get an empty allowed range.
- **Seam alignment** — Target positions use an integer pixel grid (rounded board origin; snapped positions rounded). Piece boundaries line up 100% at seams (e.g. eyes at piece edges).
- **Grid minimum** — Smallest grid is 3×3 (2×2 removed). Presets start at Starter (3×3); custom and share links clamp to minimum 3 rows/cols.

---

## Recent: Play modes (Zen, Mystery, Precision, Dynamic Difficulty, Adaptive Personality)

- **Zen Ambient** — Toggle in Settings → Modes. Hides timer and rankings; adds a subtle animated gradient background and softer transitions. Persisted.
- **Mystery Mode** — Full reference image hidden; sections reveal only after correct placements (progressive reveal).
- **Precision Mode** — Snap distance (px) is recorded per snap; completion overlay shows average precision and bonus points for tight snaps.
- **Dynamic Difficulty** — Snap tolerance adjusts from completion history (same grid size): slightly tighter when you complete fast, more forgiving when slower.
- **Adaptive Personality** — UI tone follows pace: fast play (≥6 moves/min) gets competitive microcopy and snappier HUD transitions; slow play gets calm copy and gentler animations. Completion message set varies by tone.

---

## Recent: UX polish (hints, win screen, What's New)

- **Hint toasts** – All hint and onboarding toasts (including combo and milestone) auto-dismiss after 3 seconds.
- **Win screen** – No confetti; completion overlay shows image, stats, share section, and cycling message/badge only.
- **Piece draw order** – Newly snapped/placed pieces always draw on top of connected pieces (no pop-behind).
- **What's New** – Modal shows at most 4 items to keep the screen short.

## Recent: Controls engagement toggles

- **Magnetic Snap** (Settings → Modes) — New toggle to enable/disable gentle magnetic pull when a dragged piece is near valid snap.
- **Snap Glow** (Settings → Modes) — New toggle to enable/disable proximity glow and snap pulse visuals.
- **Persistence** — Both toggles are saved to local storage and restored on next launch.

---

## Recent: Share screen and win screen

- **Win screen messages** — Below “Puzzle Completed!” a cycling positive message (e.g. “You did it!”, “Nailed it!”, “Puzzle master!”) varies by puzzle and time. When you beat your best time, “New best time!” is shown; otherwise a performance badge (e.g. Speed Demon, Precision Pro, Chill Mode) may appear.
- **Exact puzzle link** — Share text includes a link to the same puzzle: `https://phuzzle.vercel.app/daily` for daily, or `https://phuzzle.vercel.app/play?session=…` for session play.
- **Share card** — Share Card PNG uses a large puzzle preview, clean stat chips, and neutral copy. URL stays in message text so recipients get a clickable link. See [SHARING.md](./SHARING.md).

---

## Core gameplay

- Drag and drop pieces with rotation (tap to rotate on mobile)
- Board snap and neighbor snap (including during drag for fast moves); near-snap nudge when pieces are close
- Group merging so connected pieces move together
- Multiple grid sizes (3×3 to 10×10 presets; custom 3×3 up to 12×12)
- Image sources: gallery, file upload, camera capture
- Puzzle packs – curated sets grouped by theme; folder = category (e.g. `puzzles/animals/` → Cozy Animals). Seasonal packs surface as "Season's pick" (spring, summer, fall, winter).
- **Tray filters** – All, Edges, Color (Filter dropdown in Piece Drawer; pop-up menu)
- Zoom and pan (animated, persistent per grid size, max 2.5× zoom; soft board clamp)
  - Desktop: scroll to zoom, middle mouse drag to pan
  - Mobile: two-finger pinch zoom and pan, plus single-finger pan on empty space when zoomed (touch behavior unchanged)

## Layout

- **Home** – Date above the card. Top bar: Stats (trophy) left, “Daily Phuzzle” centered, Help (?) right. Logo; under logo: streak (when present) and either “X players solved today’s puzzle” (when Supabase returns a count) or a teaser tagline from `menuTips` when Supabase data is blank. Starry background behind the card. Main actions: Today’s Puzzle (star on top, label below, same style as other buttons), Packs, Choose Photo, Snap a Picture. “Next puzzle in Xh Ym” countdown at bottom (plain text).
- **Stats** - Dashboard, Profile, Leaderboard (dropdown for views), Achievements. Anonymous mode with raccoon names.
- **Play layout** - Board on top, tray below (150px desktop, 160px mobile). HUD (timer, pieces) in top bar.
- **Piece tray** - Fixed height below board. Compact mode for 25+ pieces; horizontal scroll.

## UX and polish

- **Undo snap-back animation** – Undo (button or Ctrl/Cmd+Z) animates pieces back to prior position (~280ms)
- **Drag lift** – Dragged piece: stronger shadow, 1.02× scale, guaranteed top z-order
- **Snap proximity glow** – Visual feedback while dragging: glow intensifies as you near the correct snap point
- Reference image preview (full or progressive reveal mode)
- Progress and timer modes (elapsed, countdown, active-only, relaxed, best time)
- Percentile badges (Top 10% / 25% / 50%); dynamic completion badges (Speed Demon, Chill Mode, etc.)
- **Completion screen** — Redesigned: larger puzzle image, stats (Time, Moves, Accuracy, Rank), cycling positive message below title (“You did it!”, “Nailed it!”, etc.); “New best time!” when you beat your record, or a performance badge when not. Share section is now direct actions (**Share Result**, **Share with People**) with neutral copy and no competitive taunts.
- **Smooth lock** — When pieces snap to the board they ease into place over ~100ms (desktop and mobile) instead of jumping.
- **Mobile tray** — Tray height on small screens reduced (175px / 195px for large puzzles) to give the board more space.
- Settings: **About** (Help), **Display** (Theme, piece shape, board options, effects), **Gameplay** (Controls, time), **Audio**, **Advanced**
- Optional piece borders, edge-piece highlight, immersive mode
- Edge and corner pieces display full image content (no cropping)
- Undo and redo
- Ghost hint and ghost when idle
- Optional piece locking
- **Snap combo meter** – Appears when 2+ placements within 2.5s; breaks on idle
- **Fog modifier** – Daily visual modifier “Fog”: unplaced pieces are foggy; placed pieces gain full clarity (per-piece fog on board). Preview and tray keep global fog.
- **Streak flame** – When placement streak triggers (“On fire!”), subtle flame animation (flicker + glow).
- **Hint screens** – All hint and onboarding toasts (first piece, tray tip, zoom tip, streak, share, milestone, combo) auto-dismiss after 3 seconds (user can still dismiss earlier).
- **Alternate piece shapes** – Classic, Irregular, Hard (Settings → Gameplay → Piece Shape submenu; "Applies to next puzzle")
- **Progressive reveal** – Hide full reference; reveal only regions where pieces are correctly placed
- Battery-saver detection (reduces heavy animations when low-power or data-saver)
- Six themes (Light, Dark, Space, Ocean, Forest, Sunset)
- **Skip to main content** — Link at top (visible on keyboard focus); Tab from top to jump past nav; activating the link scrolls to and focuses `<main id="main">`. See `doc/LIGHTHOUSE.md` for a11y audit notes.
- Keyboard navigation in hamburger menu (Arrow keys, Escape)
- Haptic feedback (tap, snap, place, rotate)
- Sound effects (toggle in Audio)
- `prefers-reduced-motion` support (CSS animations and tray pulse disabled)
- Loading spinners on Stats and Packs while data loads

## Social and progress

- **Weekly album** – Stats → Leaderboard → Week → Album: 7-slot page with daily puzzle thumbnails (one per day). Completed days show the puzzle image; missing/locked show overlay. Mastery (⚡) badge when the day was completed with no hints and no undo.
- **Mastery tracking** – Daily completions without hints or undo are recorded as mastery; shown in weekly album and in mastery streak (Profile / Dashboard).
- **Share Result / Share with People** – Win overlay provides both actions directly; share text includes the puzzle URL, and Share Card PNG is generated from the current solved image with a clean mobile-friendly layout.
- **Daily puzzle comments & reactions** – After completing today's puzzle: emoji reactions (👍 🎉 🔥 ✨ 💪), 280-char comments with live character counter (near-limit styling), report for moderation
- Daily puzzle and streak tracking
- **Daily countdown** – Server-synced timer to next daily unlock on Leaderboard; celebration when ready
- **Streak freeze (streak shield)** – Earn one per week after a 5-day streak; auto-applied if you miss a day. See [streak-freeze.md](./streak-freeze.md).
- Stats dashboard and leaderboards (Supabase)
- Profile with display name and anonymous mode
- Share completed puzzle image
- **Co-op** – Play with Friend: share a link, work on same puzzle (requires Supabase)
- Share app / invite testers (native share on mobile, copy link on desktop)

## Analytics

- **Live completion counter** – Real-time count of today's completions (Stats → Leaderboard → Today)
- **Percentile ranking** – "Top X%" and visual badge (Top 10% / 25% / 50%) on completion overlay, per grid size
- PostHog integration (optional; events like `puzzle_started`, `puzzle_completed`)

## Code structure (reference)

- **Play screen** – Entry split: `screens/Play/PlayScreen.tsx` → `PlayScreenController.tsx` → `PlayScreenMain.tsx` → `PlayScreenScene.tsx` / `PlayScreenSceneImpl.tsx` with `components/PlayScreenLayout.tsx`. Hooks are split by concern in `screens/Play/hooks/` (scene state, lifecycle, board interactions, UI persistence, share session, top bar builders, pointer handling, viewport, replay).
- **Pointer handling** – `screens/Play/hooks/pointerHandlers/` split into `pointerHandlersFactoryCore.ts`, `touchHandlers.ts`, `mouseHandlers.ts`, and shared helpers/types.
- **Puzzle logic** – `puzzle/PuzzleManager.ts` delegates to split modules (`PuzzleManagerCore.ts`, `PuzzleManagerEngine.ts`, `PuzzleManagerRuntime.ts`, `puzzleManager*Ops.ts`, `puzzleManager*Helpers.ts`) while `puzzleSnap.ts`, `puzzleManagerRestore.ts`, and `puzzleManagerUtils.ts` keep reusable pure logic.
- **Canvas draw** – Drawing helpers are split into core modules (`renderBoardDrawPieceCore.ts`, `renderBoardHelpersCore.ts`) plus existing higher-level draw files.
- **Audio** – `audio/sounds.ts` (SoundEngine, ambient); `soundsPreferences.ts` (load/save prefs from localStorage); theme-aware SFX in `soundsSfx.ts` (barrel); implementations in `soundsSfxTypes.ts`, `soundsSfxSnap.ts`, `soundsSfxMisc.ts`, `soundsSfxComplete.ts`. Ambient music: `soundsAmbient.ts` re-exports theme loops; types in `soundsAmbientTypes.ts`; one file per theme.
- **Setup** – `screens/Setup/SetupScreen.tsx`; hooks in `hooks/` (`useGridConfig`, `useImagePicker`, `useSetupScreenGalleryScroll`); `SetupConfigSection.tsx` (difficulty, time, custom grid, remember); image source (gallery/upload/camera) in `components/SetupImageSourcePanel.tsx`.
- **Data / menu** – `data/menuConfig.ts` (getMenuTree); sections in `menuConfigPlay.ts`, `menuConfigAppearance.ts`, `menuConfigRest.ts`; constants and types in `menuConfigConstants.ts` (TIME_MODE_LABELS, MenuNode).
- **Stats** – `screens/Stats/StatsScreen.tsx`; state and data in `hooks/useStatsScreenState.ts`, `hooks/useStatsScreenData.ts`; header in `components/StatsScreenHeader.tsx`; tabs in `tabs/`; list rendering in `LeaderboardTabLists.tsx`.
- **Completion overlay** – `CompletionOverlay.tsx`, `CompletionOverlayActions.tsx` (Continue dropdown opens upward, Share Result button); `useCompletionConfetti.ts`, `useCompletionOverlayData.ts` (confetti, percentile, recordCompletion, share); share popup in `CompletionSharePopup.tsx` (Share Card PNG with game link in image footer, Seasonal frame, Download); stats block in `CompletionStatsBlock.tsx`. Share card image built in `useShareCardImage.ts` (includes phuzzle.vercel.app on card). **Piece tray** – `PieceTrayHeader.tsx`; display/scroll/thumbs in `usePieceTrayDisplay.ts`, `usePieceTrayScroll.ts`, `usePieceTrayThumbs.ts`.
- **Weekly album** – `LeaderboardTab.tsx` (Week → Album: 7-slot grid); `useStatsScreenData.ts` (`loadWeeklyAlbum`, `getMyWeeklyAlbumCompletions`); `leaderboardFetchersShared.ts` (`getMyWeeklyAlbumCompletions`). **Fog modifier** – `usePlayScreenAnimation.ts` (`fogAlphaForUnplaced`); `renderBoard.ts` (fog overlay per unplaced piece); `renderBoardTypes.ts` (`AnimationState.fogAlphaForUnplaced`).
