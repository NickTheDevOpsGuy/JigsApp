# Phuzzle - Full Feature List

Detailed list of features. See [README](../README.md) for a quick overview.

---

## Core gameplay

- Drag and drop pieces with rotation (tap to rotate on mobile)
- Board snap and neighbor snap (with near-snap nudge when pieces are close)
- Group merging so connected pieces move together
- Multiple grid sizes (3×3 to 9×9 presets; custom up to 12×12)
- Image sources: gallery, file upload, camera capture
- Puzzle packs – curated sets grouped by theme; folder = category (e.g. `puzzles/animals/` → Cozy Animals). Seasonal packs surface as "Season's pick" (spring, summer, fall, winter).
- **Tray filters** – All, Edges, Color (Filter dropdown in Piece Drawer; pop-up menu)
- Zoom and pan (animated, persistent per grid size, soft board clamp)
  - Desktop: scroll to zoom, middle mouse drag to pan
  - Mobile: two-finger pinch zoom and pan, plus single-finger pan on empty space when zoomed

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
- Completion confetti and dynamic badges (Speed Demon, Chill Mode, etc.)
- **Completion screen** - Share Result button opens popup (Share Card PNG, Seasonal frame, Download); Menu button; removed New Puzzle
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
- Keyboard navigation in hamburger menu (Arrow keys, Escape)
- Haptic feedback (tap, snap, place, rotate)
- Sound effects (toggle in Audio)
- `prefers-reduced-motion` support

## Social and progress

- **Daily puzzle comments & reactions** – After completing today's puzzle: emoji reactions (👍 🎉 🔥 ✨ 💪), 280-char comments, report for moderation
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
- **Percentile ranking** – "Top X%" on completion overlay, per grid size
- PostHog integration (optional; events like `puzzle_started`, `puzzle_completed`)
