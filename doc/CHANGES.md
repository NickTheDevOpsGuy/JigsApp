# Phuzzle — feature list and changes

High-level feature list and recent changes. For project overview see [README](../README.md). For where features live in code see [FEATURES_IMPLEMENTED.md](FEATURES_IMPLEMENTED.md).

---

## Recent (high level)

- **Play HUD & tray** — Unified pill size for timer, pause, moves, pieces (0/16). Hamburger and HUD in one board-aligned strip. Small gap between board and tray (like HUD–board). Color blind friendly option (Settings → Display or Theme & Sounds).
- **Puzzle pieces** — Organic bulb-shaped tabs/sockets, smoother silhouettes, subtle depth (shadow, bevel). Drag lift and snap polish; ~120ms snap ease. Save/continue unchanged.
- **Choose Puzzle** — Horizontal scroll with arrows and blue bar; full-width tray; mobile layout shrunk for small screens.
- **Play layout** — Bigger board (max 920px). Tray full width; Undo/Redo on the right of the tray. Timer centered in top bar; pause button in HUD. Top bar and HUD larger (52px bar, bigger fonts).
- **Home** — Date above card. Top bar: Stats, “Phuzzle”, Feedback, Help. Today’s Puzzle, Packs, Choose Photo, Snap a Picture. Countdown at bottom.
- **Leaderboards** — Week has same filters as Today (shape, modifier, source); All-time also has grid size. No share button in leaderboard header.
- **Share** — Challenge card image-only; result card has time, moves, accuracy, URL. Share message uses a random taunt phrase. [SHARING.md](SHARING.md)
- **Replay** — Watch Replay from win screen; board cutout, seek bar, play/pause, speed, Back to Results. Snap feedback: target glow, proximity glow, lock glow, snap particles.
- **Packs** — 10 packs with emojis (Nature, Animals, Food, Cozy, Space, Retro, Art, Gaming, Seasonal, Cute). One folder per pack; Season’s pick when pack has a season.
- **Modes** — Zen (no timer/rankings), Mystery (progressive reveal), Precision (snap precision stats), Dynamic Difficulty, Adaptive Personality (competitive/calm tone). Magnetic Snap and Snap Glow toggles in Settings.

---

## Core gameplay

- Drag and drop; tap to rotate on mobile. Board snap and neighbor snap; groups move together. No auto-nudge on release.
- Grid sizes 3×3–10×10 presets; custom up to 12×12. Sources: gallery, upload, camera.
- Tray: full width, horizontal scroll, Undo/Redo on the right. Filters (All, Edges, Color). Zoom/pan (scroll or pinch); viewport persists.
- Timer modes: elapsed, countdown, relaxed, best time. Percentile badges; completion badges (Speed Demon, Chill Mode, etc.).
- Piece shapes: Classic, Irregular, Hard (Settings). Optional piece locking, ghost hints, reference preview (full or progressive).
- Completion: image, stats, cycling message, Share Result / Share with People, Watch Replay. Six themes; battery-saver and reduced-motion support.

---

## Layout (short)

- **Home** — Card with Today’s Puzzle, Packs, Choose Photo, Snap a Picture. Countdown.
- **Stats** — Dashboard, Profile, Leaderboard (Today/Week/All-time + filters), Achievements. Anonymous mode with raccoon names.
- **Play** — Board on top, tray below (full width, Undo/Redo right). HUD in top bar (timer centered, pause, moves, pieces).

---

## Social and progress

- Daily puzzle and streak; streak freeze ([STREAK-FREEZE.md](STREAK-FREEZE.md)). Weekly album (7 days, mastery badge). Share result or co-op link ([SHARING.md](SHARING.md)).
- Daily comments and reactions after completion. Co-op: share link, real-time sync (Supabase).
- Leaderboards and live completion counter; percentile ranking on completion overlay.

---

## Code structure (reference)

- **Play** — `PlayScreen.tsx` → Controller → Main → Scene; hooks in `screens/Play/hooks/` (lifecycle, board, pointer, viewport, replay). Layout: `PlayScreenLayout.tsx`.
- **Puzzle** — `PuzzleManager` + split modules (`*Ops`, engine, runtime). Snap/restore in `puzzleSnap.ts`, `puzzleManagerRestore.ts`. Shape in `puzzle/core/shape.ts`; piece draw in `renderBoardDrawPieceCore.ts`, `renderBoardDrawPieceHelpers.ts`.
- **Setup** — `SetupScreen`; hooks for grid, image picker, gallery scroll. Difficulty and image source in config section and `SetupImageSourcePanel`.
- **Stats** — `StatsScreen`; state and data hooks; tabs for Profile, Board, Badges. Leaderboard fetchers and weekly album.
- **Completion** — `CompletionOverlay`, share popup, share card image, replay modal. Tray: `PieceTray`, scroll and thumbs hooks.
