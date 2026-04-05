# Phuzzle — feature list and changes

High-level feature list and recent changes. For project overview see [README](../README.md). For where features live in code see [FEATURES_IMPLEMENTED.md](FEATURES_IMPLEMENTED.md).

**In-app changelog:** What's New is driven by `src/app/data/content/changelog.ts`, but it is intentionally kept to the latest release bullets only. Full historical notes stay in this document. List items in the source file are plain text (no leading bullet character).

---

## Recent (high level)

- **Mobile completion & replay fit** — Short-phone completion dialogs now stay fully on-screen, replay controls use a tighter mobile layout, replay covers the full board so the finished puzzle does not leak around the cutout, and closing replay no longer flashes the results card back in unexpectedly.
- **Completion dialog guardrails** — Shared `AppModal` now respects `closeOnEscape={false}` through both the dialog and backdrop handlers, and board-anchored win dialogs keep the action row in view on desktop instead of drifting off-screen.
- **Completion flow & piece polish** — Win screen always appears after the last piece locks (brief board glow then overlay). Placed pieces no longer show outline or edge strokes so adjacent pieces meet with no visible gaps; unplaced pieces keep a crisp jigsaw look. Lock tolerance tightened for exact placement.
- **Single puzzle flow** — New puzzle uses only the staged modals: **Quick Play** (catalog: category → puzzle → setup) and **Puzzle Packs** (pack → puzzle → setup). The full-page setup screen was removed; `/new` redirects to home. Pack detail “Play” starts the puzzle directly (storage + `/play`). “Upload your own image” links were removed from both modals.
- **Daily Share (Wordle-style)** — After completing the Daily Puzzle, a **Daily Share** button appears on the win screen (only for daily). It generates a compact, copyable text block: `Phuzzle Daily #N`, difficulty • pieces, ⏱ time, 🔁 moves, a 4-cell emoji grid (🟦/⬜ for completed, good time, efficient moves, clean solve), and a play link. Copy to clipboard or native share on mobile. See [SHARING.md](SHARING.md).
- **Puzzle Packs & Choose Puzzle parity** — Puzzle Packs dialog uses the same layout as Quick Play (filters, horizontal rail, difficulty, CTA). Breadcrumbs (Pack → Puzzle → Difficulty → Start) are clickable so you can jump to any step. One reusable modal shell for both flows.
- **Mobile touch & input** — Touch drag on the board works again: the board area uses `touch-action: none` so the browser doesn’t scroll the page while you drag pieces; pointer capture and pointer events (down/move/up) handle drag. Tray buttons (Filter, Shuffle) and all carousel/rail arrows use 48px minimum hit areas, `touch-action: manipulation`, and correct z-index so they’re tappable on mobile. Dialogs use consistent sizing (e.g. 92% width, 85vh max on mobile).
- **Play HUD & tray** — Unified pill size for timer, pause, moves, pieces (0/16). Hamburger and HUD in one board-aligned strip. Small gap between board and tray (like HUD–board). Color blind friendly option (Settings → Display or Theme & Sounds).
- **Puzzle pieces** — Organic bulb-shaped tabs/sockets, smoother silhouettes, subtle depth (shadow, bevel). Drag lift and snap polish; ~120ms snap ease. Save/continue unchanged.
- **Choose Puzzle** — Horizontal scroll with arrows and blue bar; full-width tray; mobile layout shrunk for small screens.
- **Play layout** — Bigger board (max 920px). Tray full width; Undo/Redo on the right of the tray. Timer centered in top bar; pause button in HUD. Top bar and HUD larger (52px bar, bigger fonts).
- **Home** — Compact top bar: Stats, “Phuzzle”, Help. One primary CTA for **Play Today’s Puzzle**, a lightweight momentum strip, optional resume card, secondary actions for **Puzzle Packs** and **Quick Play**, Feedback as a text action, and the countdown at the bottom.
- **Home follow-up polish** — If today’s daily is already in progress, the primary CTA now switches to **Continue Daily** and jumps straight back into play. The resume card also labels current daily progress more clearly instead of looking like a generic save.
- **Lighthouse workflow** — Added `npm run check:images` to surface the heaviest image assets and estimate WebP savings locally before a Lighthouse pass.
- **Asset optimization** — Replaced the largest shipped social image and several oversized puzzle PNGs with WebP versions to reduce production payload without changing gameplay.
- **Leaderboards** — Week has same filters as Today (shape, modifier, source); All-time also has grid size. No share button in leaderboard header.
- **Share** — Win-screen **Options** runs **Challenge Friend** / **Share Result** straight into native share or PNG download; challenge and result cards differ; share text is tightened in `shareMessages` (no rotating taunts). [SHARING.md](SHARING.md)
- **Replay** — Watch Replay from win screen; board cutout, seek bar, play/pause, speed, Back to Results. Snap feedback: target glow, proximity glow, lock glow, snap particles.
- **Packs** — 10 packs with emojis (Nature, Animals, Food, Cozy, Space, Retro, Art, Gaming, Seasonal, Cute). One folder per pack; Season’s pick when pack has a season.
- **Modes** — Zen (no timer/rankings), Mystery (progressive reveal), Precision (snap precision stats), Dynamic Difficulty, Adaptive Personality (competitive/calm tone). Magnetic Snap and Snap Glow toggles in Settings.

---

## Core gameplay

- Drag and drop (mouse and touch); tap to rotate on mobile. The board area disables browser touch scrolling so piece drag works; pointer capture keeps drag events on the canvas. Board snap and neighbor snap; groups move together. No auto-nudge on release.
- Grid sizes 3×3–10×10 presets; custom up to 12×12. Puzzle source: catalog or packs via staged modals (Quick Play, Puzzle Packs) only.
- Tray: full width, horizontal scroll, Undo/Redo on the right. Filters (All, Edges, Color). Zoom/pan (scroll or pinch); viewport persists.
- Timer modes: elapsed, countdown, relaxed, best time. Percentile badges; completion badges (Speed Demon, Chill Mode, etc.).
- Piece shapes: Classic, Irregular, Hard (Settings). Optional piece locking, ghost hints, reference preview (full or progressive).
- Completion: image, stats, single celebration line, **Options** (Share Result, Challenge Friend, Daily Share when daily, replay, next puzzle). Six themes; battery-saver and reduced-motion support.

---

## Layout (short)

- **Home** — Compact card with Play Today’s Puzzle, momentum strip, optional resume state, Puzzle Packs, Quick Play, and countdown.
- **Stats** — Dashboard, Profile, Leaderboard (Today/Week/All-time + filters), Achievements. Anonymous mode with raccoon names.
- **Play** — Board on top, tray below (full width, Undo/Redo right). HUD in top bar (timer centered, pause, moves, pieces).

---

## Social and progress

- Daily puzzle and streak; streak freeze ([STREAK-FREEZE.md](STREAK-FREEZE.md)). **Daily Share** — Wordle-style result block for the daily only (daily #, stats, emoji grid, play link); copy or native share. Weekly album (7 days, mastery badge). Share result, **Challenge Friend**, or co-op link ([SHARING.md](SHARING.md)).
- Daily comments and reactions after completion. Co-op: share link, real-time sync (Supabase).
- Leaderboards and live completion counter; percentile ranking on completion overlay.

---

## Code structure (reference)

- **Play** — `PlayScreen.tsx` → Controller → Main → Scene; hooks in `screens/Play/hooks/` (lifecycle, board, pointer, viewport, replay). Layout: `PlayScreenLayout.tsx`.
- **Puzzle** — `PuzzleManager` + split modules (`*Ops`, engine, runtime). Snap/restore in `puzzleSnap.ts`, `puzzleManagerRestore.ts`. Shape in `puzzle/core/shape.ts`; piece draw in `renderBoardDrawPieceCore.ts`, `renderBoardDrawPieceHelpers.ts`.
- **Puzzle selection** — `ChoosePuzzleModal` (catalog) and `PackChoiceModal` (packs); staged flows only. The former full-page Setup screen is no longer used; `/new` redirects to `/`.
- **Stats** — `StatsScreen`; state and data hooks; tabs for Profile, Board, Badges. Leaderboard fetchers and weekly album.
- **Completion** — `CompletionOverlay`, Options-menu share (card + toasts), replay modal. Tray: `PieceTray`, scroll and thumbs hooks.
