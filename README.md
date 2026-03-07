[![CI](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml/badge.svg)](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml)
![Last Commit](https://img.shields.io/github/last-commit/NickTheDevOpsGuy/phuzzle)
![License](https://img.shields.io/github/license/NickTheDevOpsGuy/phuzzle)

![Built with React](https://img.shields.io/badge/Built%20with-React-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38bdf8?logo=tailwind-css&logoColor=white)

# Phuzzle

A cozy, modern jigsaw puzzle game built with React.  
Upload an image, break it into pieces, and snap them together piece by piece.

---

## Table of Contents

- [Preview](#preview)
- [What is Phuzzle?](#-what-is-phuzzle)
- [User Stories](#user-stories)
- [Features](#-features)
- [Roadmap](#-roadmap)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Documentation](#documentation)
- [Testing](#testing)
- [PWA](#pwa)
- [Adding Sample Puzzles](#-adding-sample-puzzles)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## Preview

### Gameplay Demo

If the GIF link below is broken, check the folder name casing. GitHub is case-sensitive.  
Common fixes:

- `./assets/...` vs `./Assets/...`
- `preview.gif` vs `Preview.gif`

[![Play Phuzzle](./Assets/Preview/preview.gif)](https://phuzzle.vercel.app/)

---

## What is Phuzzle?

Phuzzle is a fully interactive jigsaw puzzle experience focused on:

- Smooth snapping and merging
- Satisfying interactions
- Mobile-first usability
- Clean, maintainable game logic

Purpose:  
A calm, cozy puzzle you can open anytime, part mindfulness, part challenge.

---

## User Stories

**Players** want to create puzzles from gallery, upload, or camera; enjoy smooth drag-and-drop with satisfying snaps; peek at a reference image when stuck; and relax in a clutter-free experience. They can compete on daily puzzles, track streaks, and share completed puzzles.

**Developers** want predictable puzzle-generation logic, a structure that supports expansion, and a roadmap that welcomes contribution.

---

## Features

- **Gameplay** — Drag, drop, rotate pieces; board and neighbor snap (including during fast drags); group merging; 3×3 to 10×10 grids; gallery, upload, camera; puzzle packs; tray filters (All, Edges, Color); zoom and pan (capped to avoid excessive zoom); undo/redo with snap-back animation (Ctrl/Cmd+Z); drag lift (stronger shadow, scale)
- **Daily** — Today's puzzle, streak tracking, countdown to next unlock, streak shield (earn after 5-day streak); comments and emoji reactions after completion (280 chars, report support). See [doc/STREAK-FREEZE.md](doc/STREAK-FREEZE.md)
- **Polish** — Snap proximity glow, reference preview (full or progressive reveal), snap combo meter, alternate piece shapes (Classic/Irregular/Hard via submenu), percentile badges (Top 10% / 25% / 50%), six themes; **fog modifier** (pieces gradually gain clarity when placed); **streak flame** animation when placement streak increases; hint and onboarding toasts auto-dismiss after 3 seconds; **piece draw order** (locked/placed pieces draw underneath so movable pieces never get stuck behind); **pixel-aligned seams** (integer target positions so pieces line up 100% at boundaries). **Bug report** (Settings → About → Feedback → Report a bug, or Help → Feedback on home): form with optional email, description, optional screenshots; opens mailto so user can attach files and send. See [doc/BUG_REPORT.md](doc/BUG_REPORT.md).
- **Play modes** (Settings → Modes) — **Zen Ambient** (no timer/rankings, subtle animated background, soft transitions); **Mystery Mode** (hide full reference, reveal sections only after correct placements); **Precision Mode** (score snap distance; completion shows avg precision and bonus points); **Dynamic Difficulty** (snap tolerance adjusts from completion history — tighter when you’re fast, more forgiving when slower); **Adaptive Personality** (UI tone follows pace: fast play → competitive microcopy/animations, slow play → calm)
- **Social** — Stats, leaderboards, profile, anonymous mode (raccoon names), share puzzle image; win overlay **share screen** (inline, no modal): **Share Result** and **Share with People** with native share/copy plus **Share Card** + Download options; **Share Card** PNG matches iMessage-style layout (starry background, header, puzzle image, gold line, centered time/pieces/accuracy, Play Phuzzle CTA); **Replay** — after completing a puzzle you can **Watch Replay** from the win screen; progress is recorded as snapshots and played back at 1×–10× speed (play/pause, progress bar, close); co-op (Play with Friend via link); **weekly album** (Stats → Leaderboard → Week → Album): 7-slot page with daily puzzle thumbnails and mastery badges (⚡ = completed with no hints, no undo)
- **Analytics** — Live completion counter, percentile ranking (Top X%); **mastery** completions (daily with no hints and no undo) tracked for weekly album and mastery streak

Full feature list → [CHANGES.md](doc/CHANGES.md). In-app **What’s New** popup → `src/app/data/changelog.ts`.

---

## Roadmap

### Planned

- Import puzzle from URL
- Full offline-first gameplay (app shells and assets cache today; puzzle images still need network on first load)

---

## Mobile layout

- **Board** — 94vw width, max 520px on mobile; 65–70% viewport height. The complete puzzle is **centered and scaled to fit** the canvas so it never clips. `touch-action: manipulation` to prevent double-tap zoom. Snap detection runs during drag as well as on release, so fast touch drags still snap when passing through the target.
- **Piece tray** — Compact height below board; horizontal scroll (scrollbar hidden; tray still scrolls). No collapse. Undo/redo and tray get extra spacing on very small screens (≤380px).
- **Piece scaling** — Min 42px on mobile; zoom scales if needed.
- **Snap** — 120ms pop + glow animation.
- **Header** — 48px on mobile.
- **Screens** — Menu, Setup, Stats, Packs fit in viewport (no page scroll); content scrolls inside cards where needed. Loading spinners on Stats and Packs. Stats → Leaderboard → Week → Album shows the 7-slot weekly album with daily thumbnails.
- **Win screen** — Completion overlay: starry celebratory background, **PUZZLE COMPLETE!** banner (golden-orange with puzzle icon), completed puzzle image, two stat cards (**Time** and **Moves**), **Watch Replay** (accelerated playback of your solve when available), and **Next Puzzle** (primary CTA). On mobile the overlay panel is aligned to the top of the screen. Progress ring (green) only fills when pieces actually snap (locked), not when merely nudged. Piece tray horizontal scrollbar is hidden (tray still scrolls). Puzzle URL is included in the share message text.

---

## Grid sizes & difficulty

Presets: Starter (3×3) → Easy (3×3) → Medium (4×4) → Hard (5×5) → Expert (6×6) → Master (7×7) → Legend (8×8) → Extreme (9×9) → Epic (10×10). Custom grids 3×3 to 12×12. Difficulty dropdowns show piece count (e.g. "🌱 3×3 (9 pieces)"). "Based on your progress" suggests the next preset when you've completed smaller grids. Custom grids 81+ pieces show a hint that larger puzzles may run slower on some devices.

**Undo cap** – 50 steps for puzzles ≤64 pieces, 25 for 81+ to reduce memory use on large puzzles.

---

## Performance (100+ piece puzzles)

Rendering and interaction are tuned for large puzzles:

- **Canvas redraw** – When idle (no drag, no completion animation), the board redraw is throttled to 30fps for puzzles with 50+ pieces to reduce CPU/GPU load. During drag or completion flourish, it runs at full frame rate.
- **Snap calculations** – A single (row, col) → piece map is built per snap check so neighbor lookups are O(1). Only _boundary_ pieces of the dragged group (those with a neighbor outside the group) are considered for neighbor snap, cutting work for large groups.
- **Overlap checks** – Before testing piece-vs-piece overlap, group bounds are compared; only groups whose bounding boxes intersect the moved group are checked in detail.

---

## Tech Stack

**Frontend**

- React
- TypeScript
- HTML Canvas

**Build & Tooling**

- Vite
- vite-plugin-pwa (Workbox)

**Testing**

- Vitest (Unit)
- Playwright (E2E)

**Infrastructure**

- GitHub Actions (CI/CD)
- Vercel (Hosting)

---

## Getting Started

```bash
git clone https://github.com/NickTheDevOpsGuy/phuzzle.git
cd phuzzle
npm install
npm run dev
```

Useful scripts:

- `npm run build` production build
- `npm run preview` preview production build locally
- `npm run test` unit tests
- `npm run test:e2e` E2E tests (run `npx playwright install` once)

**Optional: Supabase (leaderboards, stats, co-op)** – See [doc/SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md) for setup instructions.

---

## Documentation

| Doc                                                    | Description                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md)             | Supabase setup: leaderboards, stats, achievements, co-op share, daily comments; migrations (tables + RLS) |
| [SHARING.md](doc/SHARING.md)                           | Completion share (image, social) and co-op (Play with Friend)                                             |
| [STREAK-FREEZE.md](doc/STREAK-FREEZE.md)               | Streak freeze: earn after 5-day streak, auto-applied when day missed                                      |
| [CHANGES.md](doc/CHANGES.md)                           | Full feature list                                                                                         |
| [FEATURES_IMPLEMENTED.md](doc/FEATURES_IMPLEMENTED.md) | New features (countdown, streak shield, piece shapes, etc.)                                               |
| [BUG_REPORT.md](doc/BUG_REPORT.md)                     | Bug report flow (About → Report a bug; mailto, screenshots)                                               |
| [MOBILE_QA.md](doc/MOBILE_QA.md)                       | Real-device mobile validation checklist (iPhone/Android)                                                  |
| [README.md](doc/README.md)                             | Index of docs                                                                                             |

**Play modes (Zen, Mystery, Precision, Dynamic Difficulty, Adaptive Personality)** — State and toggles: `Play/playScreenUtils.ts` (storage keys), `Play/hooks/playScreenUIInitial.ts`, `usePlayScreenUI.ts`, `usePlayScreenUIPersistence.ts`. Menu: `Play/components/headerMenuConfigTypes.ts`, `headerMenuItemsNavModes.ts`. Top bar/HUD: `usePlayScreenTopBarProps.ts`, `PlayScreenTopBar.tsx`, `PlayHUD.tsx`. Zen/Mystery/Precision/Completion: `PlayScreen.tsx`, `PlayScreen.module.css` (`.zenMode`, `.hudCompetitive`, `.hudCalm`), `CompletionOverlayGate.tsx`, `CompletionOverlay.tsx`, `CompletionStatsBlock.tsx`. Snap/precision: `puzzle/puzzleSnap.ts`, `PuzzleManager.ts`, `puzzleManagerUtils.ts`; `Play/hooks/playScreenManagerEvents.ts`. Dynamic difficulty: `services/adaptiveDifficultyService.ts` (`getToleranceMultiplier`). Completion copy by tone: `data/completionMessages.ts`.

---

## Environment Variables

Copy `.env.example` to `.env.local` (or `.env.development`) and set what you need.

For Vercel:  
Project Settings → Environment Variables

| Variable                         | Required | Purpose                                                        |
| -------------------------------- | -------- | -------------------------------------------------------------- |
| `VITE_SHOW_DEBUG`                | No       | `true` to show debug overlay in play screen                    |
| `VITE_SUPABASE_URL`              | No       | Supabase project URL                                           |
| `VITE_SUPABASE_ANON_KEY`         | No       | Supabase anon key                                              |
| `VITE_POSTHOG_KEY`               | No       | PostHog project key                                            |
| `VITE_POSTHOG_HOST`              | No       | PostHog host (example: `https://us.i.posthog.com`)             |
| `VITE_FORMSPREE_BUG_FORM_ID`     | No       | Formspree form URL or ID for bug reports (else mailto)         |
| `VITE_FORMSPREE_FEATURE_FORM_ID` | No       | Formspree form URL or ID for feature suggestions (else mailto) |

PostHog UI: https://app.posthog.com/

**Vercel:** After adding or changing env vars, trigger a new deployment (Deployments → Redeploy). Supabase co-op needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Deployment Troubleshooting

- **"Failed to fetch" or blank play screen** – Stale cache; the app auto-reloads. Hard refresh (Cmd+Shift+R) or clear site data if it persists.
- **Co-op WebSocket fails** – See [doc/SHARING.md](doc/SHARING.md#troubleshooting) and [doc/SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md#troubleshooting).

---

## Testing

- Unit tests (Vitest)
  - `npm run test` single run
  - `npm run test:watch` watch mode
  - `npm run test:ui` UI runner
- Quality guards
  - `npm run guard:quality` fails if `test.skip(...)` appears in E2E specs or `console.log(...)` appears in `src/`
- E2E tests (Playwright)
  - `npm run test:e2e`
  - first run: `npx playwright install`
  - ensure port 5173 is free (or stop `npm run dev`), or Playwright will start the app in CI
  - Covers Stats mobile layout, Setup/Daily 9×9 preset, and core flows
  - Completion overlay: `play-screen.spec.ts` uses `?e2eCompletion=1` on `/play` to assert the win screen UI without solving
- Performance (Lighthouse CI)
  - `npm run lhci` — builds, then runs Lighthouse (perf, a11y, best-practices)
  - Reports in `./lhci-reports`

---

## PWA

Phuzzle is a Progressive Web App. You can install it from the browser.

- Manifest and icons live in `public/`
- Service worker generated by `vite-plugin-pwa` (Workbox) with offline caching
- Theme-color meta updates with selected theme for browser chrome
- Offline: puzzles work from cache; an indicator appears when offline (leaderboards and co-op need internet)
- Install via “Install app” or “Add to Home Screen” when visiting the deployed site

---

## Adding Sample Puzzles

Drop images into `src/app/assets/puzzles/`. Subfolders are supported. Images are auto-discovered at build time (no config needed).

**Folder name = category.** Packs filter puzzles by category:

| Pack               | Category         | Folder                    |
| ------------------ | ---------------- | ------------------------- |
| Cozy Animals       | `animals`        | `puzzles/animals/`        |
| Floral             | `flowers`        | `puzzles/flowers/`        |
| Food Photography   | `food`           | `puzzles/food/`           |
| Space Exploration  | `space`          | `puzzles/space/`          |
| Retro Tech         | `tech`           | `puzzles/tech/`           |
| Landscape Escapes  | `landscapes`     | `puzzles/landscapes/`     |
| Fantasy Realms     | `fantasy`        | `puzzles/fantasy/`        |
| Pet Portraits      | `pets`           | `puzzles/pets/`           |
| City Lights        | `cityscapes`     | `puzzles/cityscapes/`     |
| Underwater Odyssey | `underwater`     | `puzzles/underwater/`     |
| Cozy Interiors     | `cozy-interiors` | `puzzles/cozy-interiors/` |
| Adventure Trails   | `adventure`      | `puzzles/adventure/`      |

Example:

```
src/app/assets/puzzles/
  animals/
    bear.png
    fox.png
    cute/
      kitten.png
  flowers/
    daisy.png
    sunflower.png
  nature/
    mountain.jpg
```

- **Category** = path under `puzzles/` (e.g. `animals`, `animals/cute`, `flowers`)
- **Puzzle name** = filename (kebab-case → Title Case)
- **Formats** = jpg, jpeg, png, webp

Add images to an existing folder and they appear in that pack. Add a new folder and create a pack with `category: "folder-name"` in `packMetadata.ts` and `puzzlePacks.ts`.

**Seasonal packs** – Packs can have a `season` (spring, summer, fall, winter). The matching pack is shown as "Season's pick" at the top of the pack list.

---

<details>
<summary>Click to expand current project structure (high-level)</summary>

```plaintext
.
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── .husky/
├── doc/
│   ├── BUG_REPORT.md
│   ├── CHANGES.md
│   ├── FEATURES_IMPLEMENTED.md
│   ├── FUTURE.md
│   ├── LIGHTHOUSE.md
│   ├── MOBILE_QA.md
│   ├── README.md
│   ├── SESSION_SUMMARY.md
│   ├── SHARING.md
│   ├── STREAK-FREEZE.md
│   └── SUPABASE_SETUP.md
├── e2e/
│   ├── context-menu-mobile.spec.ts
│   ├── daily-modal.spec.ts
│   ├── home.spec.ts
│   ├── packs-stats.spec.ts
│   ├── play-screen.spec.ts
│   ├── setup-mobile-fit.spec.ts
│   ├── setup-play.spec.ts
│   ├── streak-freeze.spec.ts
│   └── theme.spec.ts
├── public/
├── scripts/
│   ├── check-bundle-size.sh
│   ├── guard-no-skip-and-console.sh
│   └── precheck.sh
├── src/
│   ├── app/
│   │   ├── assets/
│   │   │   └── puzzles/
│   │   ├── audio/
│   │   ├── components/
│   │   │   └── PieceTray/
│   │   │       ├── PieceTray.tsx
│   │   │       ├── PieceTray.module.css
│   │   │       ├── PieceTray.test.ts
│   │   │       └── usePieceTray*.ts
│   │   ├── daily/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── puzzle/
│   │   │   └── canvas/
│   │   ├── screens/
│   │   │   ├── Menu/
│   │   │   ├── NewGame/
│   │   │   ├── Packs/
│   │   │   ├── Play/
│   │   │   │   ├── PlayScreen.tsx
│   │   │   │   ├── PlayScreen.module.css
│   │   │   │   ├── playUtils.ts
│   │   │   │   ├── playScreenUtils.ts
│   │   │   │   ├── playScreenUtils.test.ts
│   │   │   │   ├── shareMessages.ts
│   │   │   │   ├── shareMessages.test.ts
│   │   │   │   ├── timeMode.ts
│   │   │   │   ├── timeMode.test.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── CompletionOverlay.tsx
│   │   │   │   │   ├── CompletionOverlay.module.css
│   │   │   │   │   ├── CompletionOverlayGate.tsx
│   │   │   │   │   ├── CompletionSharePopup.tsx
│   │   │   │   │   ├── CompletionStatsBlock.tsx
│   │   │   │   │   ├── ReplayBar.tsx
│   │   │   │   │   ├── ReplayBar.module.css
│   │   │   │   │   ├── useCompletionOverlayData.ts
│   │   │   │   │   ├── HeaderMenu.tsx
│   │   │   │   │   ├── headerMenuConfig.tsx
│   │   │   │   │   ├── headerMenu*.ts*
│   │   │   │   │   ├── Minimap.tsx
│   │   │   │   │   ├── PlayHUD.tsx
│   │   │   │   │   ├── PlayScreenOverlays.tsx
│   │   │   │   │   ├── PlayScreenTopBar.tsx
│   │   │   │   │   ├── SnapComboMeter.tsx
│   │   │   │   │   ├── TrayFilterButton.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── hooks/
│   │   │   │       ├── usePointerHandlers.ts
│   │   │   │       ├── usePointerHandlers.test.ts
│   │   │   │       ├── useReplay.ts
│   │   │   │       ├── useReplay.test.ts
│   │   │   │       ├── useShareCardImage.ts
│   │   │   │       ├── useShareResults.ts
│   │   │   │       ├── useDownloadImage.ts
│   │   │   │       ├── usePlayScreenManager.ts
│   │   │   │       ├── usePlayScreenAnimation.ts
│   │   │   │       ├── usePlayScreenTimer.ts
│   │   │   │       ├── usePuzzleSession.ts
│   │   │   │       └── pointerHandlers/
│   │   │   ├── Setup/
│   │   │   └── Stats/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── supabase/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── test/
│   └── types/
├── supabase/
│   ├── migrations/
│   └── README.md
├── package.json
├── README.md
└── vite.config.ts
```

</details>

---

## Contributing

We love help.

Before submitting a PR, run:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

DM us to join the Discord and get involved.

No gatekeeping. No ego. Just building something fun together.

---

Team

Built by:

| Name           | LinkedIn                                                         | GitHub                                                   |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Nick Clark     | [nicholas-a-clark](https://www.linkedin.com/in/nicholas-a-clark) | [@NickTheDevOpsGuy](https://github.com/NickTheDevOpsGuy) |
| Vinay Gajjar   | [vinaygajjar](https://www.linkedin.com/in/vinaygajjar)           | [@v-gajjar](https://github.com/v-gajjar)                 |
| Hannah Olbrich | [hannaholbrich](https://www.linkedin.com/in/hannaholbrich)       | [@hannahro15](https://github.com/hannahro15)             |

With help from the wider community ❤️  
See all contributors here → **[CONTRIBUTORS.md](./CONTRIBUTORS.md)**

Different strengths, shared ownership, great teamwork.

---

## License

MIT License. See [LICENSE.md](./LICENSE.md).
