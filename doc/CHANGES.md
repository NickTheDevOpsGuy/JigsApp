# Phuzzle - Full Feature List

Detailed list of features. See [README](../README.md) for a quick overview.

---

## Recent: Home bar, leaderboard filters, docs

- **Home bar** — Top bar now shows "Phuzzle" (center) with date above the card; Feedback (megaphone) and Help (?) in the bar. No "Daily Phuzzle" label in the bar.
- **Leaderboard** — Week view has the same filters as Today (shape, modifier, source); All-time also has grid size. Share button removed from Stats/leaderboard header. See Layout and FEATURES_IMPLEMENTED.

## Recent: Share card, puzzle folders, Start over

- **Share card** — Challenge card is **image-only** (gradient background + centered puzzle image with gold border; no text on the image). Result card: time, moves, pieces, accuracy, full URL. Share **message** (copy/native share): "🧩 Phuzzle Challenge" plus a **random taunt phrase** (e.g. "BOOM! I just crushed that puzzle! 😎", "Another one in the books! 💪", "Puzzle demolished. Your turn. 🧩") plus "I did it in [time] and [N] moves.", largest merge, "Think you can beat me? Let me know if you need lessons! 😉", then "Same puzzle, same difficulty" + full URL. Share title is "Phuzzle" (not "Phuzzle Challenge") to avoid duplicate heading. Files: `src/app/screens/Play/core/share/shareMessages.ts`, `src/app/screens/Play/hooks/share/useShareCardImageCore.ts`, `shareCardImageShare.ts`, `shareCardImageHelpers.ts`.

- **Puzzle folder reorg** — One folder per pack; no aliases. Folders under `src/app/assets/puzzles/`: `nature/`, `animals/`, `food/`, `cozy/`, `space/`, `retro/`, `art/`, `gaming/`, `seasonal/`, `cute/`. Previous `flowers/` → `nature/`, `cozy-food/` → `food/`, `tech/` → `gaming/`. Config: `src/app/data/packs/samplePuzzles.ts`, `packMetadata.ts`, `puzzlePacks.ts`. See README "Adding Sample Puzzles".
- **Start over** — Menu → Navigation → **Start over** restarts the current puzzle from scratch (same image and grid). Files: `usePlayScreenSceneState.ts`, `usePlayScreenManagerCore.ts`, `headerMenuItemsNavModes.ts`, top bar props and layout.

---

## Recent: Replay polish, Back to Results, win screen (6 Mar 2025)

- **Replay controls width** — Playback controls (seek bar, control row, nav) in the Replay Solve modal are now only as wide as the outer board/canvas and aligned under it; min/max width (280px / viewport−32) with centering when clamped.
- **Back to Results** — "Back to Results" now fully stops replay, closes the modal, shows the completion overlay, and restores focus to the completion close button; button calls `onBackToResults` when provided (else `onClose`).
- **Focus return** — When leaving replay, focus moves to the completion overlay close button (`completionFocusRef` wired through scene, completion props, and overlay components).
- **Target slot glow** — Snap-target indicator is now a soft radial glow only (circle stroke removed) so it reads as a glow on the piece.
- **Replay final frame** — One extra snapshot is recorded when the puzzle becomes complete so the last replay frame always shows the fully assembled puzzle.
- **Pause vs win screen** — Pause overlay is hidden when the puzzle is complete so "Back to Results" shows the win screen instead of the pause overlay (`!board.isComplete` in PauseOverlay condition in `PlayScreenLayout.tsx`).
- **Tests** — `ReplaySolveModal.test.tsx`: Back to Results calls `onBackToResults` when provided, and calls `onClose` when not.

---

## Recent: Replay modal, snap feedback, tests

- **Replay Solve modal** — **Watch Replay** opens a full-screen modal with a **board cutout**: the live puzzle canvas stays visible in the center so playback is visible. Header (Replay Solve, close), seek bar with time, play/pause, rewind/fast-forward, 1×–3× speed (tap to cycle), Back to Results / Next Puzzle. When no board rect is available the modal falls back to a centered box with completion image. See `src/app/screens/Play/components/replay/ReplaySolveModal.tsx`, `ReplaySolveModal.module.css`.
- **Snap/magnet feedback** — Stronger “magnet” feel on desktop and mobile: **target-slot glow** (subtle glow at the snap destination when in range), **proximity glow** (stronger radial glow and outline when dragging near snap; gentle pulse), **post-snap** (slightly stronger/longer glow and pop), **lock glow** (warmer, longer stroke), **snap particles** (slightly larger/longer burst). **No near-snap nudge** — only real snaps move pieces; dragging near the target no longer auto-nudges on release. See `src/app/puzzle/canvas/render/renderBoardDrawPieceCore.ts`, `src/app/puzzle/canvas/utils/renderBoardHelpersCore.ts`, `src/app/puzzle/manager/ops/puzzleManagerPointerOps.ts`.
- **Tests** — Unit tests added: `ReplaySolveModal.test.tsx` (heading, play/pause, close, seek, time), `renderBoardHelpersCore.test.ts` (snapGlowAlpha, snapPopScale). Lint: unused vars in pointer ops prefixed with `_`.

---

## Recent: 10 puzzle packs with emojis

- **Packs capped at 10** — Curated set: 🌿 Nature, 🐶 Animals, 🍔 Food, 🏠 Cozy, 🌌 Space, 🧠 Retro, 🖼 Art, 🎮 Gaming, 🌸 Seasonal, 🧁 Cute. Each pack has an emoji, name, description, and optional `season` (spring/summer/fall/winter) for "Season's pick".
- **One folder per pack** — Folder name = category id (no aliases). See “Recent: Share card, puzzle folders, Start over” for current folder list and reorg from flowers/cozy-food/tech.
- **Emoji in labels** — Category picker and pack list show emoji + name (e.g. "🌿 Nature"). `CATEGORY_LABELS` and pack `emoji` in `packMetadata.ts` / `puzzlePacks.ts`. README "Adding Sample Puzzles" updated with the 10-pack table.

---

## Recent: remove empty categories and packs

- **Categories/packs trimmed to existing assets** — Removed pack entries and category config for categories that have no puzzle images: Pets (`pets`), Illustrations (`illustrations`), Space (`space`), Food (`food`). Only categories with assets under `puzzles/` remained; later reorganized into the current 10 emoji packs (see above).

## Recent: dialog consistency pass

- **Unified dialog shell** — Completion/setup dialogs now share the same close-button treatment, frame radius, border glow, and panel spacing so transitions across screens feel cohesive.
- **Win screen layout refresh** — Completion now uses a fixed heading/subtitle, full solved-image preview frame, 4-column stat row, and stacked action rows with one clear primary CTA.
- **Action pattern standardization** — Primary and secondary dialog actions now follow one row style (icon + label + chevron) with consistent hover/focus states across desktop and mobile.
- **Docs + lint discipline** — README structure paths and UX notes were updated to match current folders, and lint remains `--max-warnings=0` to keep refactors clean.

- **Image authenticity cleanup** — Removed generated/derivative variant files (renamed/inverted style assets) from the catalog.
- **Balanced catalog target** — Active categories target **~10 unique images each** with hash-level duplicate prevention.
- **Folder cleanup** — Removed deprecated `puzzles/garden/` source folder; flowers now come only from `puzzles/flowers/`.

- **Picker/category cleanup** — Consolidated duplicate category buckets into a cleaner 9-category set: Animals, Pets, Illustrations, Food, Cozy Food, Flowers, Space, Tech, Retro. Pets = real pets; Illustrations = drawings (including drawn pets).
- **Folder normalization** — Puzzle folders map to curated picker categories; `pets/drawings` can alias to Illustrations in `samplePuzzles.ts`.
- **Pack alignment** — Pack metadata and runtime pack config now match available image categories (removed stale/empty pack categories).

---

## Recent: layout consistency + restore safety

- **Pack screens** — Removed extra whitespace and reduced nested scrolling behavior so image-preview sections stay tighter on desktop and mobile.
- **Win image fit** — Completion overlay puzzle preview now favors full-image fit behavior (`contain`) to avoid visual cut-off.
- **Restore lock normalization** — Restored snapshots now invalidate impossible lock states (`locked` while `isPlaced` is false), preventing false completion/locking states after resume.
- **Docs alignment** — README architecture paths now match current folders (`Play/core`, `Play/components/*`, `Play/hooks/*`, manager `engine/ops/state` split).

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
- Board snap and neighbor snap (including during drag for fast moves); only real snaps place pieces (no auto-nudge on release)
- Group merging so connected pieces move together
- Multiple grid sizes (3×3 to 10×10 presets; custom 3×3 up to 12×12)
- Image sources: gallery, file upload, camera capture
- Puzzle packs – up to 10 curated packs with emojis (Nature, Animals, Food, Cozy, Space, Retro, Art, Gaming, Seasonal, Cute). Folder = category, with optional aliases in `samplePuzzles.ts` (e.g. `flowers/` → nature, `tech/` → gaming). Seasonal packs surface as "Season's pick" (spring, summer, fall, winter).
- **Tray filters** – All, Edges, Color (Filter dropdown in Piece Drawer; pop-up menu)
- Zoom and pan (animated, persistent per grid size, max 2.5× zoom; soft board clamp)
  - Desktop: scroll to zoom, middle mouse drag to pan
  - Mobile: two-finger pinch zoom and pan, plus single-finger pan on empty space when zoomed (touch behavior unchanged)

## Layout

- **Home** – Date above the card. Top bar: Stats (trophy) left, “Phuzzle” centered, Feedback (megaphone), Help (?) right. Logo; under logo: streak (when present) and either “X players solved today’s puzzle” (when Supabase returns a count) or a teaser tagline from `menuTips` when Supabase data is blank. Starry background behind the card. Main actions: Today’s Puzzle (star on top, label below, same style as other buttons), Packs, Choose Photo, Snap a Picture. “Next puzzle in Xh Ym” countdown at bottom (plain text).
- **Stats** – Dashboard, Profile, Leaderboard (Today / Week / All-time with filters: shape, modifier, source; All-time also has grid size). No share button in the leaderboard header. Achievements. Anonymous mode with raccoon names.
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
- **Completion overlay** – `CompletionOverlay.tsx`, `CompletionOverlayActions.tsx` (Continue dropdown opens upward, Share Result button); `useCompletionConfetti.ts`, `useCompletionOverlayData.ts` (confetti, percentile, recordCompletion, share); share popup in `CompletionSharePopup.tsx` (Share Card PNG with game link in image footer, Seasonal frame, Download); stats block in `CompletionStatsBlock.tsx`. Share card image built in `useShareCardImage.ts` (includes phuzzle.vercel.app on card). **Replay modal** – `components/replay/ReplaySolveModal.tsx` (board cutout so live canvas visible, play/pause, seek, 1×–3× speed); replay state in `hooks/gameplay/useReplay.ts`. **Piece tray** – `PieceTrayHeader.tsx`; display/scroll/thumbs in `usePieceTrayDisplay.ts`, `usePieceTrayScroll.ts`, `usePieceTrayThumbs.ts`.
- **Weekly album** – `LeaderboardTab.tsx` (Week → Album: 7-slot grid); `useStatsScreenData.ts` (`loadWeeklyAlbum`, `getMyWeeklyAlbumCompletions`); `leaderboardFetchersShared.ts` (`getMyWeeklyAlbumCompletions`). **Fog modifier** – `usePlayScreenAnimation.ts` (`fogAlphaForUnplaced`); `renderBoard.ts` (fog overlay per unplaced piece); `renderBoardTypes.ts` (`AnimationState.fogAlphaForUnplaced`).
