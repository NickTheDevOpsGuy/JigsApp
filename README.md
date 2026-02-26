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

- **Gameplay** — Drag, drop, rotate pieces; board and neighbor snap; group merging; 3×3 to 9×9 grids; gallery, upload, camera; puzzle packs; tray filters (All, Edges, Color); zoom and pan; undo/redo with snap-back animation (Ctrl/Cmd+Z); drag lift (stronger shadow, scale)
- **Daily** — Today's puzzle, streak tracking, countdown to next unlock, streak shield (earn after 5-day streak); comments and emoji reactions after completion (280 chars, report support). See [doc/streak-freeze.md](doc/streak-freeze.md)
- **Polish** — Snap proximity glow, reference preview (full or progressive reveal), snap combo meter, alternate piece shapes (Classic/Irregular/Hard via submenu), completion confetti and badges, six themes
- **Social** — Stats, leaderboards, profile, anonymous mode (raccoon names), share puzzle image, Share Result popup (Share Card PNG, Download), co-op (Play with Friend via link)
- **Analytics** — Live completion counter, percentile ranking (Top X%)

Full feature list → [CHANGES.md](doc/CHANGES.md)

---

## Roadmap

### Planned

- Import puzzle from URL
- Full offline-first gameplay (app shells and assets cache today; puzzle images still need network on first load)

---

## Mobile layout

- **Board** — 94vw width, max 520px on mobile; 65–70% viewport height.
- **Piece tray** — 160px height below board; horizontal scroll. No collapse.
- **Piece scaling** — Min 42px on mobile; zoom scales if needed.
- **Snap** — 120ms pop + glow animation.
- **Header** — 56px max.

---

## Grid sizes & difficulty

Presets: Easy (3×3) → Medium (4×4) → Hard (5×5) → Expert (6×6) → Master (7×7) → Legend (8×8) → Extreme (9×9). Custom grids up to 12×12. Difficulty dropdowns show piece count (e.g. "🌱 3×3 (9 pieces)"). "Based on your progress" suggests the next preset (including 9×9) when you've completed smaller grids. Custom grids 81+ pieces show a hint that larger puzzles may run slower on some devices.

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

| Doc                                                    | Description                                                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md)             | Supabase setup: leaderboards, stats, achievements, co-op share, daily comments; migrations (tables + RLS) |
| [SHARING.md](doc/SHARING.md)                           | Completion share (image, social) and co-op (Play with Friend)                                      |
| [STREAK-FREEZE.md](doc/STREAK-FREEZE.md)               | Streak freeze: earn after 5-day streak, auto-applied when day missed                               |
| [CHANGES.md](doc/CHANGES.md)                           | Full feature list                                                                                  |
| [FEATURES_IMPLEMENTED.md](doc/FEATURES_IMPLEMENTED.md) | New features (countdown, streak shield, piece shapes, etc.)                                        |
| [README.md](doc/README.md)                             | Index of docs                                                                                      |

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
- E2E tests (Playwright)
  - `npm run test:e2e`
  - first run: `npx playwright install`
  - ensure port 5173 is free (or stop `npm run dev`), or Playwright will start the app in CI
  - Covers Stats mobile layout, Setup/Daily 9×9 preset, and core flows
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

| Pack              | Category  | Folder             |
| ----------------- | --------- | ------------------ |
| Cozy Animals      | `animals` | `puzzles/animals/` |
| Floral            | `flowers` | `puzzles/flowers/` |
| Food Photography  | `food`    | `puzzles/food/`    |
| Space Exploration | `space`   | `puzzles/space/`   |
| Retro Tech        | `tech`    | `puzzles/tech/`    |

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
│   ├── CHANGES.md
│   ├── FEATURES_IMPLEMENTED.md
│   ├── FUTURE.md
│   ├── LIGHTHOUSE.md
│   ├── README.md
│   ├── SESSION_SUMMARY.md
│   ├── SHARING.md
│   ├── streak-freeze.md
│   └── SUPABASE_SETUP.md
├── e2e
│   ├── daily-modal.spec.ts
│   ├── home.spec.ts
│   ├── packs-stats.spec.ts
│   ├── play-screen.spec.ts
│   ├── setup-play.spec.ts
│   ├── streak-freeze.spec.ts
│   └── theme.spec.ts
├── public
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── scripts
│   ├── check-bundle-size.sh
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
│   │   │   ├── DailyReactions
│   │   │   │   ├── DailyReactions.module.css
│   │   │   │   ├── DailyReactions.tsx
│   │   │   │   └── index.ts
│   │   │   ├── AboutModal
│   │   │   │   ├── AboutModal.module.css
│   │   │   │   ├── AboutModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Button
│   │   │   │   ├── Button.module.css
│   │   │   │   └── Button.tsx
│   │   │   ├── DailyCountdown
│   │   │   │   ├── DailyCountdown.module.css
│   │   │   │   └── DailyCountdown.tsx
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
│   │   │   ├── MenuTree
│   │   │   │   ├── MenuTree.module.css
│   │   │   │   └── MenuTree.tsx
│   │   │   ├── Modal
│   │   │   │   ├── Modal.module.css
│   │   │   │   └── Modal.tsx
│   │   │   ├── OfflineIndicator
│   │   │   │   ├── OfflineIndicator.module.css
│   │   │   │   └── OfflineIndicator.tsx
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
│   │   │   ├── dailyPuzzleCore.test.ts
│   │   │   └── dailyPuzzleCore.ts
│   │   ├── data
│   │   │   ├── achievements.ts
│   │   │   ├── anonymousNames.ts
│   │   │   ├── changelog.ts
│   │   │   ├── completionMessages.test.ts
│   │   │   ├── completionMessages.ts
│   │   │   ├── confettiColors.ts
│   │   │   ├── loadPacksData.ts
│   │   │   ├── menuConfig.ts
│   │   │   ├── menuTips.ts
│   │   │   ├── packCompletion.ts
│   │   │   ├── packMetadata.ts
│   │   │   ├── puzzlePacks.ts
│   │   │   └── samplePuzzles.ts
│   │   ├── hooks
│   │   │   ├── useBatterySaver.ts
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   ├── useMenuSettings.ts
│   │   │   ├── useOnboarding.ts
│   │   │   ├── useTheme.test.tsx
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
│   │   │   ├── groupUtils.test.ts
│   │   │   ├── groupUtils.ts
│   │   │   ├── PuzzleManager.test.ts
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
│   │   │   │   └── NewGameScreen.tsx
│   │   │   ├── Packs
│   │   │   │   ├── PackDetailScreen.module.css
│   │   │   │   ├── PackDetailScreen.tsx
│   │   │   │   ├── PackListScreen.module.css
│   │   │   │   └── PackListScreen.tsx
│   │   │   ├── Play
│   │   │   │   ├── components
│   │   │   │   │   ├── CompletionOverlay.tsx
│   │   │   │   │   ├── CoopDebugPanel.tsx
│   │   │   │   │   ├── CoopStatusIndicator.tsx
│   │   │   │   │   ├── DragPreview.tsx
│   │   │   │   │   ├── HeaderMenu.tsx
│   │   │   │   │   ├── headerMenuConfig.tsx
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── PauseOverlay.tsx
│   │   │   │   │   ├── PlayHUD.tsx
│   │   │   │   │   ├── ProgressivePreviewOverlay.tsx
│   │   │   │   │   ├── PlayToasts.tsx
│   │   │   │   │   ├── PlayToasts.types.ts
│   │   │   │   │   ├── ProfilerOverlay.module.css
│   │   │   │   │   ├── ProfilerOverlay.tsx
│   │   │   │   │   ├── UndoRedoButtons.tsx
│   │   │   │   ├── SnapComboMeter.tsx
│   │   │   │   │   ├── SnapComboMeter.module.css
│   │   │   │   │   ├── TopBarButtons.tsx
│   │   │   │   │   ├── TrayFilterButton.tsx
│   │   │   │   │   ├── TrayFilterButton.module.css
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
│   │   │   │   │   ├── useShareCardImage.ts
│   │   │   │   ├── useShareResults.ts
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
│   │   │   ├── dailyCommentsService.ts
│   │   │   ├── achievementsService.ts
│   │   │   ├── leaderboardService.ts
│   │   │   ├── serverTimeService.ts
│   │   │   ├── profileService.ts
│   │   │   ├── puzzleSessionService.ts
│   │   │   └── statsService.ts
│   │   ├── styles
│   │   │   └── global.css
│   │   ├── supabase
│   │   │   ├── auth.ts
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── utils
│   │   │   ├── seasons.test.ts
│   │   │   └── seasons.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── hooks
│   ├── test
│   │   └── setup.ts
│   └── types
│       ├── canvas-confetti.d.ts
│       └── vite-env.d.ts
├── supabase
│   ├── migrations
│   │   ├── 20260225120000_tables.sql
│   │   └── 20260225120001_rls.sql
│   └── README.md
├── .env.example
├── .eslintcache
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
