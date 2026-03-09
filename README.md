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
- **Polish** — Snap proximity glow, reference preview (full or progressive reveal), snap combo meter, alternate piece shapes (Classic/Irregular/Hard via submenu), percentile badges (Top 10% / 25% / 50%), six themes; **Start over** (menu → Navigation) restarts the current puzzle from scratch so you can escape an unwinnable state after resume; **fog modifier** (pieces gradually gain clarity when placed); **streak flame** animation when placement streak increases; hint and onboarding toasts auto-dismiss after 3 seconds; **piece draw order** (locked/placed pieces draw underneath so movable pieces never get stuck behind); **pixel-aligned seams** (integer target positions so pieces line up 100% at boundaries). **Bug report** (Settings → About → Feedback → Report a bug, or Help → Feedback on home): form with optional email, description, optional screenshots; opens mailto so user can attach files and send. See [doc/BUG_REPORT.md](doc/BUG_REPORT.md).
- **Play modes** (Settings → Modes) — **Zen Ambient** (no timer/rankings, subtle animated background, soft transitions); **Mystery Mode** (hide full reference, reveal sections only after correct placements); **Precision Mode** (score snap distance; completion shows avg precision and bonus points); **Dynamic Difficulty** (snap tolerance adjusts from completion history — tighter when you’re fast, more forgiving when slower); **Adaptive Personality** (UI tone follows pace: fast play → competitive microcopy/animations, slow play → calm); **Magnetic Snap** toggle (gentle near-snap pull when dragging); **Snap Glow** toggle (proximity/lock glow feedback)
- **Social** — Stats, leaderboards (Today / Week / All-time; Week and Today support filters: shape, modifier, source; no share in leaderboard header), profile, anonymous mode (raccoon names), share puzzle image; win overlay **share screen** (inline, no modal): **Share Result** and **Share with People** with native share/copy plus **Share Card** + Download options; **Share Card** PNG: challenge card is **image-only** (gradient + puzzle image with gold border); result card has time, moves, pieces, accuracy, full URL; share message uses **random taunt phrases** (e.g. “BOOM! I just crushed that puzzle!”, “Another one in the books!”, “Puzzle demolished. Your turn.”) plus time/moves and “Same puzzle, same difficulty” with full URL; **Replay** — after completing a puzzle you can **Watch Replay** from the win screen; **Replay Solve** modal shows the live puzzle (board cutout) with play/pause, seek bar, and 1×–3× speed; co-op (Play with Friend via link); **weekly album** (Stats → Leaderboard → Week → Album): 7-slot page with daily puzzle thumbnails and mastery badges (⚡ = completed with no hints, no undo)
- **Analytics** — Live completion counter, percentile ranking (Top X%); **mastery** completions (daily with no hints and no undo) tracked for weekly album and mastery streak

Full feature list → [CHANGES.md](doc/CHANGES.md). In-app **What’s New** popup → `src/app/data/content/changelog.ts`.

---

## Roadmap

### Planned

- Import puzzle from URL
- Full offline-first gameplay (app shells and assets cache today; puzzle images still need network on first load)

---

## Mobile layout

- **Board** — 94vw width, max 520px on mobile; 65–70% viewport height. The complete puzzle is **centered and scaled to fit** the canvas so it never clips. `touch-action: manipulation` to prevent double-tap zoom. Snap detection runs during drag as well as on release, so fast touch drags still snap when passing through the target.
- **Piece tray** — Compact height below board; horizontal scroll (scrollbar hidden; tray still scrolls). No collapse. Undo/redo and tray get extra spacing on very small screens (≤380px).
- **Touch input hardening** — Tap-vs-drag threshold is device-aware (coarse pointer + high-DPI tuning) to reduce accidental drags. Touch move updates are throttled slightly more on high-DPI coarse devices to reduce jitter without changing drag semantics.
- **Minimap behavior** — Minimap auto-hides while actively dragging on touch devices so it does not obstruct piece movement.
- **Orientation recovery** — On rotate, board size is re-measured and viewport recenters after orientation settles; piece state is unchanged.
- **Safe-area handling** — Play and setup layouts apply safe-area insets for notch/home-indicator devices (top, left/right, bottom).
- **Piece scaling** — Min 42px on mobile; zoom scales if needed.
- **Snap** — 120ms pop + glow animation.
- **Header** — 48px on mobile.
- **Screens** — Menu, Setup, Stats, Packs fit in viewport (no page scroll); content scrolls inside cards where needed. Loading spinners on Stats and Packs. Stats → Leaderboard → Week → Album shows the 7-slot weekly album with daily thumbnails.
- **Win screen** — Completion overlay: starry celebratory background, **Puzzle complete!** header, solved image preview, 4 stat columns (Time, Moves, Pieces/min, Largest Merge), stacked action rows, and a primary **Next Puzzle** CTA. On mobile the overlay panel is aligned to the top of the screen. Progress ring (green) only fills when pieces actually snap (locked), not when merely nudged. Piece tray horizontal scrollbar is hidden (tray still scrolls). Puzzle URL is included in the share message text.

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

| Doc                                                    | Description                                                                                                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md)             | Supabase setup: leaderboards, stats, achievements, co-op share, daily comments. Schema: two migrations — `20260225120000_tables.sql`, `20260225120001_rls.sql` |
| [SHARING.md](doc/SHARING.md)                           | Completion share (image, social) and co-op (Play with Friend)                                                                                                  |
| [STREAK-FREEZE.md](doc/STREAK-FREEZE.md)               | Streak freeze: earn after 5-day streak, auto-applied when day missed                                                                                           |
| [CHANGES.md](doc/CHANGES.md)                           | Full feature list                                                                                                                                              |
| [FEATURES_IMPLEMENTED.md](doc/FEATURES_IMPLEMENTED.md) | New features (countdown, streak shield, piece shapes, etc.)                                                                                                    |
| [BUG_REPORT.md](doc/BUG_REPORT.md)                     | Bug report flow (About → Report a bug; mailto, screenshots)                                                                                                    |
| [MOBILE_QA.md](doc/MOBILE_QA.md)                       | Real-device mobile validation checklist (iPhone/Android)                                                                                                       |
| [README.md](doc/README.md)                             | Index of docs                                                                                                                                                  |
| [SESSION_2025-03-06.md](doc/SESSION_2025-03-06.md)     | Session summary: replay controls width, Back to Results, focus return, target glow, completion snapshot, pause vs win                                          |

**Play modes (Zen, Mystery, Precision, Dynamic Difficulty, Adaptive Personality)** — State and toggles: `src/app/screens/Play/hooks/state/` (`playScreenUIInitial.ts`, `usePlayScreenUI.ts`, `usePlayScreenUIPersistence.ts`) plus `src/app/screens/Play/core/utils/playScreenUtils.ts` (storage keys). Menu config: `src/app/screens/Play/components/headerMenu/`. Top bar/HUD: `src/app/screens/Play/hooks/topBar/` and `src/app/screens/Play/components/hud/`. Completion/win flow: `src/app/screens/Play/components/completion/` (overlay, stats, replay/share menus). Snap/precision and manager events: `src/app/puzzle/snap/`, `src/app/puzzle/manager/`, `src/app/screens/Play/hooks/manager/playScreenManagerEvents.ts`. Dynamic difficulty: `src/app/services/player/adaptiveDifficultyService.ts`.

### Internal structure (recent split)

- Play screen internals now live under `src/app/screens/Play/core/scene/` for scene setup, behavior, interactions, layout, and overlay wiring.
- Play hooks are grouped by role: `animation/`, `gameplay/`, `input/`, `lifecycle/`, `manager/`, `share/`, `state/`, `system/`, `topBar/`, and `viewport/`.
- Play components are grouped by role: `completion/`, `coop/`, `headerMenu/`, `hud/`, `layout/`, `overlay/`, and `replay/`.
- Puzzle manager internals are split into `engine/`, `ops/`, and `state/` modules under `src/app/puzzle/manager/`.
- Render helpers are grouped under `src/app/puzzle/canvas/render/` and `src/app/puzzle/canvas/utils/`.
- Audio modules are grouped under `src/app/audio/ambient/`, `core/`, `manager/`, `sfx/`, and `themes/`.
- Data/services are grouped by domain: `src/app/data/content|menu|packs/` and `src/app/services/leaderboard|player|session/`.
- Markdown linting is scoped to repo docs via `.markdownlint-cli2.jsonc` (excludes `node_modules`, `dist`, `coverage`).

### UI consistency notes

- **Design tokens** — Screens, cards, and modals use shared CSS variables so the app stays uniform and theme-aware. Use these when adding or changing UI:
  - **Radii:** `--radius-card` (16px) for main panels/cards; `--radius-btn` (10px) for buttons and inner cards.
  - **Spacing:** `--space-1` (4px) through `--space-12` (48px) for padding and gaps.
  - **Surfaces:** `--color-bg-primary`, `--color-bg-card`, `--color-bg-elevated`; `--color-border` for borders.
  - **Text:** `--color-text-primary`, `--color-text-secondary`; `--color-brand-primary` for accents.
  - **Shadows:** `--shadow-md`, `--shadow-lg`. Defined in `src/app/styles/global.base.css` and theme overrides.
- Dialog panels share one visual language: starry backdrop (where used), theme backgrounds, and the same close-button treatment.
- Action areas use consistent stacked rows with left icon + label + right chevron, with one primary CTA at the bottom.
- Stat rows use the same divider/column rhythm so completion and setup flows feel related on desktop and mobile.
- Linting remains strict (`npm run lint` uses `--max-warnings=0`) so no-console and unused-variable drift is caught during UI refactors.

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

Drop images into `src/app/assets/puzzles/`. Images are auto-discovered at build time (no import config needed).

**File/folder layout** — One folder per pack; folder name = category id. Existing folders: `nature/`, `animals/`, `food/`, `cozy/`, `space/`, `retro/`, `art/`, `gaming/`, `seasonal/`, `cute/`. Config: `src/app/data/packs/samplePuzzles.ts` (categories), `src/app/data/packs/packMetadata.ts`, `src/app/data/packs/puzzlePacks.ts` (pack list). Share: `src/app/screens/Play/core/share/shareMessages.ts` (share text), `src/app/screens/Play/hooks/share/useShareCardImageCore.ts` (card PNG), `shareCardImageShare.ts`, `shareCardImageHelpers.ts`.

Current catalog rules:

- **10 packs max**, each with an emoji and category. Categories with puzzle images under `puzzles/` appear in the pack list; empty packs are hidden from the main flow but remain in config.
- **Target ~10 images per category**; unique assets only (no renamed/inverted/filtered duplicates).
- **One folder per pack** – Folder name = category id. Put images in the matching folder (e.g. `puzzles/nature/`, `puzzles/food/`).

| Pack (emoji) | Category ID | Folder              |
| ------------ | ----------- | ------------------- |
| 🌿 Nature    | `nature`    | `puzzles/nature/`   |
| 🐶 Animals   | `animals`   | `puzzles/animals/`  |
| 🍔 Food      | `food`      | `puzzles/food/`     |
| 🏠 Cozy      | `cozy`      | `puzzles/cozy/`     |
| 🌌 Space     | `space`     | `puzzles/space/`    |
| 🧠 Retro     | `retro`     | `puzzles/retro/`    |
| 🖼 Art       | `art`       | `puzzles/art/`      |
| 🎮 Gaming    | `gaming`    | `puzzles/gaming/`   |
| 🌸 Seasonal  | `seasonal`  | `puzzles/seasonal/` |
| 🧁 Cute      | `cute`      | `puzzles/cute/`     |

Example:

```
src/app/assets/puzzles/
  nature/    animals/   food/   cozy/   space/
  retro/     art/       gaming/ seasonal/  cute/
```

- **Category** = folder name under `puzzles/`. Category labels include emojis (e.g. "🌿 Nature"). When adding a new category, update `CATEGORY_ALIAS`, `CATEGORY_LABELS`, `CATEGORY_ORDER` in `samplePuzzles.ts` and add the pack in `packMetadata.ts` and `puzzlePacks.ts` (keep to 10 packs or adjust the cap).
- **Puzzle name** = filename (kebab-case → Title Case)
- **Formats** = jpg, jpeg, png, webp

**Seasonal packs** – Packs can have a `season` (spring, summer, fall, winter). The matching pack is shown as "Season's pick" at the top of the pack list.

---

<details>
<summary>Click to expand current project structure (high-level)</summary>

```plaintext
.
├── doc/
├── e2e/
├── public/
├── scripts/
├── src/
│   ├── app/
│   │   ├── assets/puzzles/   (one folder per pack: nature, animals, food, cozy, space, retro, art, gaming, seasonal, cute)
│   │   ├── audio/{ambient,core,manager,sfx,themes}/
│   │   ├── components/
│   │   ├── data/{content,menu,packs}/
│   │   ├── puzzle/
│   │   │   ├── canvas/{render,utils}/
│   │   │   ├── manager/{engine,ops,state}/
│   │   │   └── {core,groups,snap,storage}/
│   │   ├── screens/
│   │   │   ├── Menu/
│   │   │   ├── Packs/
│   │   │   ├── Play/
│   │   │   │   ├── core/{scene,share,time,utils}/
│   │   │   │   ├── components/{completion,coop,headerMenu,hud,layout,overlay,replay}/
│   │   │   │   ├── hooks/{animation,gameplay,input,lifecycle,manager,pointerHandlers,share,state,system,topBar,viewport}/
│   │   │   │   └── styles/
│   │   │   ├── Setup/{components,hooks,styles}/
│   │   │   └── Stats/
│   │   ├── services/{leaderboard,player,session}/
│   │   └── styles/
│   ├── test/
│   └── types/
├── supabase/
│   └── migrations/
│       ├── 20260225120000_tables.sql   # tables, indexes, realtime, get_server_utc_now
│       └── 20260225120001_rls.sql     # RLS enable + policies
├── README.md
└── package.json
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
