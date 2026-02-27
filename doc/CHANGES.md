# Phuzzle - Full Feature List

Detailed list of features. See [README](../README.md) for a quick overview.

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

- **Home** - Corner buttons: Stats (trophy) left, Help (?) right. Main actions: Today's Puzzle, Packs, Choose Photo, Snap a Picture.
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
- **Completion screen** — Redesigned: larger puzzle image, stats (Time, Moves, Accuracy, Rank), “Can you beat my run?”, vertical menu (Continue, Play again, Back to home, Share Result). Confetti on win (theme-colored; respects reduced motion and battery saver). Share Result opens popup (Share Card PNG, Seasonal frame, Download).
- **Smooth lock** — When pieces snap to the board they ease into place over ~100ms (desktop and mobile) instead of jumping.
- **Mobile tray** — Tray height on small screens reduced (175px / 195px for large puzzles) to give the board more space.
- Settings: **About** (Help), **Display** (Theme, piece shape, board options, effects), **Gameplay** (Controls, time), **Audio**, **Advanced**
- Optional piece borders, edge-piece highlight, immersive mode
- Edge and corner pieces display full image content (no cropping)
- Undo and redo
- Ghost hint and ghost when idle
- Optional piece locking
- **Snap combo meter** – Appears when 2+ placements within 2.5s; breaks on idle
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

- **Play screen** – `screens/Play/PlayScreen.tsx` composes `PlayScreenTopBar`, `PlayScreenModals`, `PlayScreenOverlays` (preview, tutorial, shortcuts, toasts, profiler, coop debug), board, tray, and completion overlay. Hooks in `screens/Play/hooks/` (e.g. `usePlayScreenManager`, `useSnapComboAnnouncer`, `usePlayScreenUIPersistence`, `usePointerHandlers`, `useViewport`, `viewportStorage.ts`, `useReferenceTapHighlight`, `playScreenManagerEvents.ts`, `playScreenAnimationOverrides.ts`, `pointerHandlers/` with types in `types.ts`). Header menu items: `headerMenuItemsDisplay.ts`, `headerMenuItemsRest.ts`, `headerMenuItemsDisplayRest.ts`. UI initial state from `playScreenUIInitial.ts`.
- **Puzzle logic** – `puzzle/PuzzleManager.ts` (drag, snap, groups, undo); helpers in `puzzle/puzzleManagerUtils.ts` (clamp, getUndoLimit, getEffectiveTolerance). Board drawing in `puzzle/canvas/`: `renderBoardDraw.ts`, `renderBoardDrawPiece.ts`, `renderBoardDrawOverlays.ts` (wrong-rotation, lock glow).
- **Audio** – `audio/sounds.ts` (SoundEngine, prefs, ambient); theme-aware SFX in `soundsSfx.ts` (barrel); implementations in `soundsSfxTypes.ts`, `soundsSfxSnap.ts`, `soundsSfxMisc.ts`, `soundsSfxComplete.ts`. Ambient music: `soundsAmbient.ts` re-exports theme loops; types in `soundsAmbientTypes.ts`; one file per theme.
- **Setup** – `screens/Setup/SetupScreen.tsx`; hooks in `hooks/` (`useGridConfig`, `useImagePicker`, `useSetupScreenGalleryScroll`); image source (gallery/upload/camera) in `components/SetupImageSourcePanel.tsx`.
- **Data / menu** – `data/menuConfig.ts` (getMenuTree); constants and types in `menuConfigConstants.ts` (TIME_MODE_LABELS, MenuNode).
- **Stats** – `screens/Stats/StatsScreen.tsx`; state and data in `hooks/useStatsScreenState.ts`, `hooks/useStatsScreenData.ts`; header in `components/StatsScreenHeader.tsx`; tabs in `tabs/`; list rendering in `LeaderboardTabLists.tsx`.
- **Completion overlay** – Share popup content in `CompletionSharePopup.tsx`; stats block in `CompletionStatsBlock.tsx`. **Piece tray** – `PieceTrayHeader.tsx`; display/scroll/thumbs in `usePieceTrayDisplay.ts`, `usePieceTrayScroll.ts`, `usePieceTrayThumbs.ts`.
