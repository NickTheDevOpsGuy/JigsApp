![CI](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml/badge.svg)
![React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

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

### Core gameplay

- Drag and drop pieces with rotation
- Board snap and neighbor snap (with near-snap nudge when pieces are close)
- Group merging so connected pieces move together
- Multiple grid sizes (3×3 to 8×8)
- Image sources: gallery, file upload, camera capture
- Tray filters: All, Edges, Corners, Center (plus Grid and Color sorting)
- Zoom and pan (animated, persistent per grid size, soft board clamp)
  - Desktop: scroll to zoom, middle mouse drag to pan
  - Mobile: two-finger pinch zoom and pan, plus single-finger pan on empty space when zoomed

### UX and polish

- Reference image preview overlay
- Progress and timer modes (elapsed, countdown, active-only, relaxed, best time)
- Completion confetti and dynamic badges (Speed Demon, Chill Mode, etc.)
- Settings organized into sub-menus (About, Help, Display with Theme, Gameplay with Controls, Audio, Advanced)
- Optional piece borders and edge-piece highlight (View)
- Undo and redo
- Ghost hint and ghost when idle (after a few seconds of inactivity)
- Optional piece locking
- Battery-saver detection (reduces confetti when low-power or data-saver)
- Six themes (Light, Dark, Space, Ocean, Forest, Sunset) with system preference detection on first visit
- Keyboard navigation in hamburger menu (Arrow keys, Escape)

### Social and progress

- Daily puzzle and streak tracking
- **Streak freeze** – One per week; use when you miss a day to keep your streak. Offered when opening Today's Puzzle if yesterday wasn't completed. See [doc/streak-freeze.md](doc/streak-freeze.md).
- Stats dashboard and leaderboards (Supabase)
- Profile with display name and anonymous mode
- Share completed puzzle image
- Share app / invite testers button (native share on mobile, copy link on desktop)

### Analytics (optional)

- PostHog integration behind env vars
  - Events like `puzzle_started`, `puzzle_completed`, `puzzle_abandoned`
  - No route inside the app

---

## Roadmap

### Planned

- Import puzzle from URL
- Offline-first gameplay (e.g. play without network after first load)

---

## Performance (100+ piece puzzles)

Rendering and interaction are tuned for large puzzles:

- **Canvas redraw** – When idle (no drag, no completion animation), the board redraw is throttled to 30fps for puzzles with 50+ pieces to reduce CPU/GPU load. During drag or completion flourish, it runs at full frame rate.
- **Snap calculations** – A single (row, col) → piece map is built per snap check so neighbor lookups are O(1). Only _boundary_ pieces of the dragged group (those with a neighbor outside the group) are considered for neighbor snap, cutting work for large groups.
- **Overlap checks** – Before testing piece-vs-piece overlap, group bounds are compared; only groups whose bounding boxes intersect the moved group are checked in detail.

---

## Tech Stack

| Category  | Tools                           |
| --------- | ------------------------------- |
| Framework | React                           |
| Language  | TypeScript                      |
| Build     | Vite                            |
| Rendering | HTML Canvas                     |
| PWA       | vite-plugin-pwa (Workbox)       |
| Testing   | Vitest (unit), Playwright (E2E) |
| CI/CD     | GitHub Actions                  |
| Hosting   | Vercel                          |

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

| Doc                                            | Description                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [doc/SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md) | Supabase setup: leaderboards, stats, achievements, co-op share; env vars, migrations, verification |
| [doc/README.md](doc/README.md)                 | Index of docs                                                                                      |

---

## Environment Variables

Copy `.env.example` to `.env.local` (or `.env.development`) and set what you need.

For Vercel:  
Project Settings → Environment Variables

| Variable                 | Required | Purpose                                            |
| ------------------------ | -------- | -------------------------------------------------- |
| `VITE_SHOW_DEBUG`        | No       | `true` to show debug overlay in play screen        |
| `VITE_SUPABASE_URL`      | No       | Supabase project URL                               |
| `VITE_SUPABASE_ANON_KEY` | No       | Supabase anon key                                  |
| `VITE_POSTHOG_KEY`       | No       | PostHog project key                                |
| `VITE_POSTHOG_HOST`      | No       | PostHog host (example: `https://us.i.posthog.com`) |

PostHog UI: https://app.posthog.com/

---

## Testing

- Unit tests (Vitest)
  - `npm run test` single run
  - `npm run test:watch` watch mode
  - `npm run test:ui` UI runner
- E2E tests (Playwright)
  - `npm run test:e2e`
  - first run: `npx playwright install`
  - ensure port 5173 is free (or stop `npm run dev`), or Playwright will start the app in CI

---

## PWA

Phuzzle is a Progressive Web App. You can install it from the browser.

- Manifest and icons live in `public/`
- Service worker generated by `vite-plugin-pwa` (Workbox) with offline caching
- Theme-color meta updates with selected theme for browser chrome
- Install via “Install app” or “Add to Home Screen” when visiting the deployed site

---

## Adding Sample Puzzles

Drop images into `src/app/assets/puzzles/`. Subfolders are supported.

Example:

```
src/app/assets/puzzles/
  animals/
    bear.png
    cute/
      kitten.png
  nature/
    mountain.jpg
```

Category is the path under `puzzles/`. Puzzle name is derived from the filename.

---

<details>
<summary>📁 Click to expand file structure</summary>

```plaintext
.
├── .github
│   ├── ISSUE_TEMPLATE
│   │   ├── bug.yml
│   │   ├── config.yml
│   │   ├── documentation.yml
│   │   ├── enhancement_refactor.yml
│   │   ├── feature_request.yml
│   │   └── question_discussion.yml
│   ├── workflows
│   │   ├── CODEOWNERS
│   │   ├── Phuzzle.yml
│   │   └── vercel-production.yml
│   └── pull_request_template.md
├── .husky
│   ├── pre-commit
│   └── pre-push
├── doc
│   ├── FUTURE.md
│   ├── LIGHTHOUSE.md
│   ├── README.md
│   ├── SESSION_SUMMARY.md
│   └── SUPABASE_SETUP.md
├── e2e
│   └── home.spec.ts
├── public
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── scripts
│   └── precheck.sh
├── src
│   ├── app
│   │   ├── assets
│   │   │   ├── puzzles
│   │   │   │   ├── animals
│   │   │   │   │   ├── bear.png
│   │   │   │   │   ├── cat.png
│   │   │   │   │   ├── fox.png
│   │   │   │   │   ├── rabbit.png
│   │   │   │   │   └── racoon-8bit.png
│   │   │   │   ├── flowers
│   │   │   │   │   ├── daisy.png
│   │   │   │   │   ├── flower_bed.png
│   │   │   │   │   ├── lavender.png
│   │   │   │   │   └── sunflower.png
│   │   │   │   ├── food
│   │   │   │   │   ├── charcuterie_board.png
│   │   │   │   │   ├── curries_and_rice.png
│   │   │   │   │   ├── fruit_platter.png
│   │   │   │   │   ├── pasta_dishes.png
│   │   │   │   │   ├── strawbery_shortcake.png
│   │   │   │   │   ├── tacos.png
│   │   │   │   │   └── warmcoco.png
│   │   │   │   ├── space
│   │   │   │   │   ├── nebual.png
│   │   │   │   │   ├── outterspace.png
│   │   │   │   │   ├── outterspace2.png
│   │   │   │   │   └── saturn.png
│   │   │   │   └── tech
│   │   │   │       ├── 404.png
│   │   │   │       ├── computer-404.png
│   │   │   │       ├── racoon-computer.png
│   │   │   │       └── racoon-matrix.png
│   │   │   └── ui
│   │   │       └── phuzzle-logo-512.png
│   │   ├── audio
│   │   │   └── sounds.ts
│   │   ├── components
│   │   │   ├── AboutModal
│   │   │   │   ├── AboutModal.module.css
│   │   │   │   ├── AboutModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Button
│   │   │   │   ├── Button.module.css
│   │   │   │   └── Button.tsx
│   │   │   ├── DailyDifficultyModal
│   │   │   │   ├── DailyDifficultyModal.module.css
│   │   │   │   ├── DailyDifficultyModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── DropDown
│   │   │   │   ├── Dropdown.module.css
│   │   │   │   └── Dropdown.tsx
│   │   │   ├── ErrorBoundary
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── index.ts
│   │   │   ├── HelpChoiceModal
│   │   │   │   ├── HelpChoiceModal.module.css
│   │   │   │   ├── HelpChoiceModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── HowToPlay
│   │   │   │   ├── index.ts
│   │   │   │   ├── TutorialOverlay.module.css
│   │   │   │   └── TutorialOverlay.tsx
│   │   │   ├── Modal
│   │   │   │   ├── Modal.module.css
│   │   │   │   └── Modal.tsx
│   │   │   ├── OnboardingTooltip
│   │   │   │   ├── index.ts
│   │   │   │   ├── OnboardingTooltip.module.css
│   │   │   │   └── OnboardingTooltip.tsx
│   │   │   ├── PieceTray
│   │   │   │   ├── PieceTray.module.css
│   │   │   │   └── PieceTray.tsx
│   │   │   ├── ShortcutsModal
│   │   │   │   ├── ShortcutsModal.module.css
│   │   │   │   └── ShortcutsModal.tsx
│   │   │   ├── ThemeModal
│   │   │   │   ├── index.ts
│   │   │   │   ├── ThemeModal.module.css
│   │   │   │   └── ThemeModal.tsx
│   │   │   ├── ThemeToggle
│   │   │   │   ├── ThemeToggle.module.css
│   │   │   │   └── ThemeToggle.tsx
│   │   │   ├── Tray
│   │   │   │   ├── Tray.module.css
│   │   │   │   └── Tray.tsx
│   │   │   └── WhatsNew
│   │   │       ├── index.ts
│   │   │       ├── WhatsNewModal.module.css
│   │   │       └── WhatsNewModal.tsx
│   │   ├── daily
│   │   │   ├── dailyPuzzle.ts
│   │   │   └── dailyPuzzleCore.ts
│   │   ├── data
│   │   │   ├── achievements.ts
│   │   │   ├── anonymousNames.ts
│   │   │   ├── changelog.ts
│   │   │   ├── completionMessages.ts
│   │   │   ├── confettiColors.ts
│   │   │   ├── loadPacksData.ts
│   │   │   ├── menuTips.ts
│   │   │   ├── packCompletion.ts
│   │   │   ├── packMetadata.ts
│   │   │   ├── puzzlePacks.ts
│   │   │   └── samplePuzzles.ts
│   │   ├── hooks
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useOnboarding.ts
│   │   │   └── useTheme.tsx
│   │   ├── puzzle
│   │   │   ├── canvas
│   │   │   │   ├── pickPiece.ts
│   │   │   │   ├── renderBoard.ts
│   │   │   │   ├── renderBoardHelpers.ts
│   │   │   │   ├── renderTrayPiece.ts
│   │   │   │   └── shape.ts
│   │   │   ├── factories
│   │   │   │   └── createInitialPieces.ts
│   │   │   ├── colorUtils.ts
│   │   │   ├── config.ts
│   │   │   ├── groupUtils.ts
│   │   │   ├── PuzzleManager.ts
│   │   │   ├── puzzleStorage.ts
│   │   │   ├── shape.ts
│   │   │   ├── types.ts
│   │   │   └── undoManager.ts
│   │   ├── screens
│   │   │   ├── Menu
│   │   │   │   ├── MenuScreen.module.css
│   │   │   │   └── MenuScreen.tsx
│   │   │   ├── NewGame
│   │   │   │   ├── NewGameScreen.module.css
│   │   │   │   └── NewGameScreen.tsx
│   │   │   ├── Packs
│   │   │   │   ├── PackDetailScreen.module.css
│   │   │   │   ├── PackDetailScreen.tsx
│   │   │   │   ├── PackListScreen.module.css
│   │   │   │   └── PackListScreen.tsx
│   │   │   ├── Play
│   │   │   │   ├── components
│   │   │   │   │   ├── CompletionOverlay.tsx
│   │   │   │   │   ├── DragPreview.tsx
│   │   │   │   │   ├── HeaderMenu.tsx
│   │   │   │   │   ├── headerMenuConfig.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── PauseOverlay.tsx
│   │   │   │   │   ├── PlayHUD.tsx
│   │   │   │   │   ├── PlayToasts.tsx
│   │   │   │   │   ├── PlayToasts.types.ts
│   │   │   │   │   ├── ProfilerOverlay.module.css
│   │   │   │   │   ├── ProfilerOverlay.tsx
│   │   │   │   │   └── TopBarButtons.tsx
│   │   │   │   ├── hooks
│   │   │   │   │   ├── pointerHandlers
│   │   │   │   │   │   ├── dragLog.ts
│   │   │   │   │   │   ├── mouseHandlers.ts
│   │   │   │   │   │   ├── shared.ts
│   │   │   │   │   │   ├── touchHandlers.ts
│   │   │   │   │   │   └── types.ts
│   │   │   │   │   ├── useCoarsePointer.ts
│   │   │   │   │   ├── useDownloadImage.ts
│   │   │   │   │   ├── useHaptics.ts
│   │   │   │   │   ├── useInputHints.ts
│   │   │   │   │   ├── usePlayScreenAnimation.ts
│   │   │   │   │   ├── usePlayScreenManager.ts
│   │   │   │   │   ├── usePlayScreenShortcuts.ts
│   │   │   │   │   ├── usePlayScreenTimer.ts
│   │   │   │   │   ├── usePlayScreenUI.ts
│   │   │   │   │   ├── usePointerHandlers.ts
│   │   │   │   │   ├── usePuzzleSession.ts
│   │   │   │   │   ├── useShareResults.ts
│   │   │   │   │   ├── useTimeModeConfig.ts
│   │   │   │   │   └── useViewport.ts
│   │   │   │   ├── PlayScreen.module.css
│   │   │   │   ├── PlayScreen.tsx
│   │   │   │   ├── playScreenUtils.test.ts
│   │   │   │   ├── playScreenUtils.ts
│   │   │   │   ├── playUtils.ts
│   │   │   │   └── timeMode.ts
│   │   │   ├── Setup
│   │   │   │   ├── components
│   │   │   │   │   ├── CameraCapture.module.css
│   │   │   │   │   └── CameraCapture.tsx
│   │   │   │   ├── hooks
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── useGridConfig.ts
│   │   │   │   │   └── useImagePicker.ts
│   │   │   │   ├── SetupScreen.module.css
│   │   │   │   └── SetupScreen.tsx
│   │   │   └── Stats
│   │   │       ├── StatsScreen.module.css
│   │   │       └── StatsScreen.tsx
│   │   ├── services
│   │   │   ├── achievementsService.ts
│   │   │   ├── leaderboardService.ts
│   │   │   ├── profileService.ts
│   │   │   ├── puzzleSessionService.ts
│   │   │   └── statsService.ts
│   │   ├── styles
│   │   │   └── global.css
│   │   ├── supabase
│   │   │   ├── auth.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   └── types
│       ├── canvas-confetti.d.ts
│       └── vite-env.d.ts
├── supabase
│   ├── migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_player_profiles.sql
│   │   └── 003_puzzle_sessions.sql
│   └── README.md
├── test-results
│   └── .last-run.json
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.yml
├── CHANGELOG_UPDATE.md
├── CONTRIBUTORS.md
├── eslint.config.ts
├── index.html
├── LICENSE.md
├── lighthouserc.cjs
├── package-lock.json
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.app.json
├── tsconfig.app.tsbuildinfo
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
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
