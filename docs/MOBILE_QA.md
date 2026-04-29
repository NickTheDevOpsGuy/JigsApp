# Mobile QA checklist

Manual pass on real devices before release.

---

## Devices

- iPhone SE (or smallest supported iPhone), Safari
- iPhone 13/14/15 class, Safari
- Pixel-class Android, Chrome
- iPad portrait, Safari
- iPad landscape, Safari
- Android tablet portrait or landscape, Chrome

---

## Setup

1. Use a preview build (or local build on same network).
2. Open in the browser (no desktop emulation).
3. Clear site data once, then retest with warm cache.

---

## Core checks

**Home (`/`)**

- No unwanted scroll on load.
- Top actions visible and tappable.
- Long-press does not open browser context menu.
- Help / Stats open and close correctly.

**Puzzle selection (Quick Play / Puzzle Packs modals from home)**

- Category or pack filters load; first category/pack shows content (e.g. Art).
- Preview and difficulty step visible; Start launches play.

**Play (`/play`)**

- Board in viewport on load.
- Tray visible and usable on small screens.
- Tray remains reachable on tablets; no clipping below the fold in portrait.
- Drag/snap smooth; no stuck or hidden pieces.
- While dragging near the correct spot, the target highlight and non-color
  text/icon cue are visible in light and dark themes.
- Dragged/selected pieces have clear outlines and shadows; pieces do not
  disappear into the board or tray.
- Piece locking reliable.
- Long-press on board does not open context menu.
- Minimap does not block interaction while dragging.
- Board stays square on phone, tablet, and desktop widths.
- Touch-first tray flow feels natural on phones/tablets; swipe works without depending on side arrows.
- Hamburger menu shows only Resume, New Puzzle, Settings, Leaderboard, and Help
  at the root.
- Menu panels stay inside the viewport in portrait and landscape; back/close
  controls remain reachable.
- Settings uses nested panels/bottom-sheet behavior on touch devices, not
  hover-only flyouts.

**Win / Share**

- Share buttons visible and tappable.
- No clipping near bottom safe area.
- Completion dialog stays fully on-screen on short phones (for example 360×480 and iPhone SE class).
- Replay Solve masks the full board; no solved-board leak outside the replay cutout.
- Replay controls fit on one compact mobile layout without wrapping off-screen.
- Replay playback options stay constrained to the viewport.
- Opening Replay from the win screen works on mobile, and closing it returns to play without the completion overlay flashing back in.
- “Challenge” link opens the expected route.

**Dialogs / overlays**

- Non-dismissible overlays ignore `Escape` and accidental backdrop-key dismiss paths.
- Dismissible dialogs still close with `Escape`.

---

## Safe area

- Bottom controls clear of iOS home indicator.
- Top controls clear of notch / Dynamic Island.
- After rotate, board recenters and stays usable.

---

## Accessibility

- Primary tap targets ≥ 44px.
- Focus visible with keyboard.
- Text readable at OS text size + one step.
- Light theme menu, tray, modal, tooltip, snap hint, and selected states remain
  readable on white surfaces.
- Color blind mode is checked for snap hints, piece outlines, progress, and
  success states; no critical state depends on red/green alone.

---

## Before merge

```bash
npm run doctor
npm run guard:quality
npm run lint
npm run typecheck
npm run test
npm run test:e2e:smoke
npm run test:e2e
```

Notes:

- `npm run test` uses Vitest with 4 workers.
- `npm run test:e2e` uses Playwright with 4 workers.
- Add focused responsive browser checks when working on tray, touch, or viewport behavior:

```bash
npx playwright test src/app/responsive.responsive.e2e.spec.ts --project=safari-iphone-responsive --workers=1
npx playwright test src/app/responsive.responsive.e2e.spec.ts --project=safari-ipad-responsive --workers=1
npx playwright test src/app/responsive.responsive.e2e.spec.ts --project=chrome-android-tablet-responsive --workers=1
```
