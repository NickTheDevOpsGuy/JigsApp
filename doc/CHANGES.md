# Phuzzle - Full Feature List

Detailed list of features. See [README](../README.md) for a quick overview.

---

## Recent: Share screen (completion card + exact puzzle link)

- **Nag message with time** — Completion overlay and share card show "Can you beat my run of X:XX seconds?" using your actual completion time.
- **Exact puzzle link** — Share text and card include a link to the same puzzle: `https://phuzzle.vercel.app/daily` for daily, or `https://phuzzle.vercel.app/play?session=…` for co-op. Copy, native share, and Share Card PNG all use this URL.
- **Share modal** — Share Result modal shows the nag message and a clickable "Play at {url}" link, plus Share Card PNG and Download. Card image includes the nag line and full play URL. See [SHARING.md](./SHARING.md).

---

## Core gameplay

- Drag and drop pieces with rotation (tap to rotate on mobile)
- Board snap and neighbor snap (including during drag for fast moves); near-snap nudge when pieces are close
- Group merging so connected pieces move together
- Multiple grid sizes (2×2 to 10×10 presets; custom up to 12×12)
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
- Completion confetti (layered bursts) and percentile badges (Top 10% / 25% / 50%); dynamic completion badges (Speed Demon, Chill Mode, etc.)
- **Completion screen** — Redesigned: larger puzzle image, stats (Time, Moves, Accuracy, Rank), “Can you beat my run?”, share section (Continue dropdown opens upward; Share Result button only; no URL on the overlay). Puzzle URL (phuzzle.vercel.app) is on the **share card** image (Share Result → Share Card PNG). Confetti on win (theme-colored; respects reduced motion and battery saver). Share Result opens popup (Share Card PNG, Seasonal frame, Download).
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
- **Hint screens** – All hint and onboarding toasts (first piece, tray tip, zoom tip, streak, share, milestone, combo) auto-dismiss after 10 seconds (user can still dismiss earlier).
- **Alternate piece shapes** – Classic, Irregular, Hard (Settings → Gameplay → Piece Shape submenu; "Applies to next puzzle")
- **Progressive reveal** – Hide full reference; reveal only regions where pieces are correctly placed
- Battery-saver detection (reduces confetti when low-power or data-saver)
- Six themes (Light, Dark, Space, Ocean, Forest, Sunset)
- **Skip to main content** — Link at top (visible on keyboard focus); Tab from top to jump past nav; activating the link scrolls to and focuses `<main id="main">`. See `doc/LIGHTHOUSE.md` for a11y audit notes.
- Keyboard navigation in hamburger menu (Arrow keys, Escape)
- Haptic feedback (tap, snap, place, rotate)
- Sound effects (toggle in Audio)
- `prefers-reduced-motion` support (CSS animations and confetti/tray pulse disabled)
- Loading spinners on Stats and Packs while data loads

## Social and progress

- **Weekly album** – Stats → Leaderboard → Week → Album: 7-slot page with daily puzzle thumbnails (one per day). Completed days show the puzzle image; missing/locked show overlay. Mastery (⚡) badge when the day was completed with no hints and no undo.
- **Mastery tracking** – Daily completions without hints or undo are recorded as mastery; shown in weekly album and in mastery streak (Profile / Dashboard).
- **Share Result** – Win overlay has Share Result button only; puzzle URL is on the share card image (phuzzle.vercel.app in footer). Share Result opens popup with Share Card PNG (branded footer with game link), Seasonal frame, and Download. “Challenge a friend” CTA in popup.
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

- **Play screen** – `screens/Play/PlayScreen.tsx` composes `PlayScreenTopBar`, `PlayScreenModals`, `PlayScreenOverlays` (preview, tutorial, shortcuts, toasts, profiler, coop debug), board, tray, and completion overlay. Hooks in `screens/Play/hooks/` (e.g. `usePlayScreenManager`, `usePlayScreenTopBarProps`, `useSnapComboAnnouncer`, `usePlayScreenUIPersistence`, `usePointerHandlers`, `useViewport`, `viewportStorage.ts`, `useReferenceTapHighlight`, `playScreenManagerEvents.ts`, `pointerHandlers/` with types in `types.ts`). Header menu items: `headerMenuItemsDisplay.ts`, `headerMenuItemsRest.ts`, `headerMenuItemsDisplayRest.ts`. UI initial state from `playScreenUIInitial.ts`.
- **Puzzle logic** – `puzzle/PuzzleManager.ts` (drag, snap, groups, undo). Snapping runs on pointerUp only (no mid-drag snap) to avoid jerky lock; lock uses a single `setGroupToExactTargetPositions` update. Helpers: `puzzleManagerUtils.ts` (clamp, getUndoLimit, getEffectiveTolerance, findPlacementFromTray), `puzzleManagerRestore.ts` (applySavedPieces for undo/redo), `puzzleSnap.ts` (computeBoardSnapResult, computeNeighborSnapResult, computeNearSnapNudge, computeMergedGroupBoardSnapResult, rotateGroupToZeroPieces). Board drawing in `puzzle/canvas/`: `renderBoardDraw.ts`, `renderBoardDrawPiece.ts`, `renderBoardDrawPieceHelpers.ts` (stroke, cached piece), `renderBoardDrawOverlays.ts` (wrong-rotation, lock glow).
- **Audio** – `audio/sounds.ts` (SoundEngine, ambient); `soundsPreferences.ts` (load/save prefs from localStorage); theme-aware SFX in `soundsSfx.ts` (barrel); implementations in `soundsSfxTypes.ts`, `soundsSfxSnap.ts`, `soundsSfxMisc.ts`, `soundsSfxComplete.ts`. Ambient music: `soundsAmbient.ts` re-exports theme loops; types in `soundsAmbientTypes.ts`; one file per theme.
- **Setup** – `screens/Setup/SetupScreen.tsx`; hooks in `hooks/` (`useGridConfig`, `useImagePicker`, `useSetupScreenGalleryScroll`); `SetupConfigSection.tsx` (difficulty, time, custom grid, remember); image source (gallery/upload/camera) in `components/SetupImageSourcePanel.tsx`.
- **Data / menu** – `data/menuConfig.ts` (getMenuTree); sections in `menuConfigPlay.ts`, `menuConfigAppearance.ts`, `menuConfigRest.ts`; constants and types in `menuConfigConstants.ts` (TIME_MODE_LABELS, MenuNode).
- **Stats** – `screens/Stats/StatsScreen.tsx`; state and data in `hooks/useStatsScreenState.ts`, `hooks/useStatsScreenData.ts`; header in `components/StatsScreenHeader.tsx`; tabs in `tabs/`; list rendering in `LeaderboardTabLists.tsx`.
- **Completion overlay** – `CompletionOverlay.tsx`, `CompletionOverlayActions.tsx` (Continue dropdown opens upward, Share Result button); `useCompletionConfetti.ts`, `useCompletionOverlayData.ts` (confetti, percentile, recordCompletion, share); share popup in `CompletionSharePopup.tsx` (Share Card PNG with game link in image footer, Seasonal frame, Download); stats block in `CompletionStatsBlock.tsx`. Share card image built in `useShareCardImage.ts` (includes phuzzle.vercel.app on card). **Piece tray** – `PieceTrayHeader.tsx`; display/scroll/thumbs in `usePieceTrayDisplay.ts`, `usePieceTrayScroll.ts`, `usePieceTrayThumbs.ts`.
- **Weekly album** – `LeaderboardTab.tsx` (Week → Album: 7-slot grid); `useStatsScreenData.ts` (`loadWeeklyAlbum`, `getMyWeeklyAlbumCompletions`); `leaderboardFetchersShared.ts` (`getMyWeeklyAlbumCompletions`). **Fog modifier** – `usePlayScreenAnimation.ts` (`fogAlphaForUnplaced`); `renderBoard.ts` (fog overlay per unplaced piece); `renderBoardTypes.ts` (`AnimationState.fogAlphaForUnplaced`).
