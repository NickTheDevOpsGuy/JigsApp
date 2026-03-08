# Mobile QA Checklist

Quick manual pass for real devices before release.

## Devices

- iPhone SE (or smallest iPhone you support), Safari
- iPhone 13/14/15 class device, Safari
- Pixel-class Android phone, Chrome

## Setup

1. Deploy preview build (or run local build on same network).
2. Open in browser (not desktop emulation).
3. Clear site data once, then retest with warm cache.

## Core checks

### Home (`/`)

- No unwanted page scroll on load.
- Top actions/buttons are fully visible and tappable.
- Long-press does **not** open browser context menu.
- Help/Stats open and close correctly.

### Setup (`/new`)

- Puzzle preview fits screen without excessive empty space.
- Difficulty + controls are reachable without layout break.
- Long-press does **not** open browser context menu.
- Upload/gallery tabs and buttons remain responsive.

### Play (`/play`)

- Board remains within viewport on first load.
- Tray remains visible and usable on small screens.
- Drag/snap feels smooth (no stuck pieces, no hidden-behind bug).
- Piece locking remains reliable across all piece groups (no side-specific lock failure).
- Fast touch drags still snap correctly (during drag and on release).
- Long-press on board/pieces does **not** open browser context menu.
- Inputs/modals (where text is entered) still allow normal interaction.
- While dragging on touch devices, minimap does not block interaction.

### Win/Share flow

- Share buttons are visible and tappable on small phones.
- No clipped buttons near bottom safe-area.
- “Challenge” link opens expected route with puzzle + difficulty.

## Safe-area checks

- Bottom controls do not overlap iOS home indicator.
- Top controls do not overlap notch/dynamic island.
- Rotation to landscape does not hide critical actions.
- After rotate, board recenters and remains draggable/snappable without reloading.

## Accessibility smoke

- Tap targets for primary actions are >= 44px.
- Focus indicators visible when using external keyboard (if available).
- Text remains readable at OS text-size + one step.

## Debug/log noise checks

- No repeated lock debug flood while idle drag loops.
- Console has no persistent `overlap-block` spam during normal play.

## Regression gate

Run before merge:

```bash
npm run guard:quality
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```
