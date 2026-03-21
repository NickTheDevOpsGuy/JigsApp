# Mobile QA checklist

Manual pass on real devices before release.

---

## Devices

- iPhone SE (or smallest supported iPhone), Safari
- iPhone 13/14/15 class, Safari
- Pixel-class Android, Chrome

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
- Drag/snap smooth; no stuck or hidden pieces.
- Piece locking reliable.
- Long-press on board does not open context menu.
- Minimap does not block interaction while dragging.

**Win / Share**

- Share buttons visible and tappable.
- No clipping near bottom safe area.
- “Challenge” link opens the expected route.

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

---

## Before merge

```bash
npm run guard:quality
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Notes:

- `npm run test` uses Vitest with 4 workers.
- `npm run test:e2e` uses Playwright with 4 workers.
