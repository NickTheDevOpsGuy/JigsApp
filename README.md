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

[![Play Phuzzle](./Assets/Preview/preview.gif)](https://phuzzle.vercel.app/)

---

## What is Phuzzle?

Phuzzle is a fully interactive jigsaw puzzle experience focused on:

- Smooth snapping and merging
- Satisfying, tactile interactions
- Mobile-first usability
- Clean, maintainable game logic

It started as a small side project and evolved into a surprisingly deep puzzle engine with strong UX polish.

**Purpose:**  
A calm, cozy puzzle you can open anytime — part mindfulness, part challenge.

---

## User Stories

**Players** want to create puzzles from gallery, upload, or camera; enjoy smooth drag-and-drop with satisfying snaps; peek at a reference image when stuck; and relax in a clutter-free experience. They can compete on daily puzzles, track streaks, and share completed puzzles.

**Developers** want predictable puzzle-generation logic, a structure that supports expansion, and a roadmap that welcomes contribution.

---

## Features

### Core Gameplay

- Drag-and-drop jigsaw pieces with rotation
- Classic interlocking piece shapes with board and neighbor snapping
- Group merging — connected pieces move together
- Multiple difficulty levels (3×3 to 6×6 grids, custom sizes)
- Image sources: gallery, file upload, or camera capture
- Edge-piece tray filter — All, Edges, Corners, Center (Grid/Color sort)
- Zoom and pan — scroll to zoom (toward cursor), middle-click drag to pan; on mobile: two-finger pinch/drag, single-finger drag on empty space when zoomed

### UX & Polish

- Reference image preview overlay
- Progress counter and timer (elapsed, countdown, active-only, relaxed, best time)
- Confetti on completion (theme-colored); random completion headline (e.g. "You did it!", "Puzzle master!")
- Sound effects (snap, rotate, place, complete, undo/redo)
- Fullscreen mode · Multiple themes (Light, Dark, Space, Ocean, Forest, Sunset)
- Theme as full action card on main menu (no floating toggle)
- What's New popup for updates
- Custom fonts (Inter, Fredoka) and Lucide icons
- Difficulty emojis (Easy 🌱, Medium ⚡, Hard 🔥, Expert 👑) for daily and regular play
- **Engagement polish:** Snap glow and placement bounce when pieces lock; neighbor-snap particle burst when groups merge; milestone callouts at 25%, 50%, 75%; "On fire!" toast when placing 3+ pieces quickly; rotating tip/quote on main menu; last-piece flourish (brief board pulse on completion)
- **Play screen polish:** Completion overlay fits on mobile (scroll, responsive text); piece selection border is thin and auto-clears after 1s (tap empty space to clear); board size scales with piece count on mobile for easier planning

### Mobile Support

- Touch drag, tap to rotate, drag pieces to tray
- Two-finger pinch to zoom, two-finger drag to pan (iOS & Android, touch-event-based for reliability)
- Single-finger pan when zoomed — drag on empty space to pan
- Haptic feedback (place, snap, rotate)
- Camera capture for instant puzzles
- Mobile-safe layouts and gestures (44px touch targets)
- Mobile piece scaling — smaller pieces for higher piece counts
- Larger puzzles (16+ pieces) start with ~30% of pieces in tray
- Improved scatter spacing — less overlap on start
- Longer play menu (80vh) — no cut-off on small screens

### Social & Progress

- Daily puzzle — same for everyone (date-based), streak tracking
- Player statistics dashboard (Supabase)
- Leaderboards: daily puzzle, weekly totals, monthly totals, all-time completions, streaks, all-time best by grid
- Anonymous mode: toggle in profile; anonymous players appear as fun raccoon names (e.g. Trash Eater 42, Feral Raccoon 7), are still tracked, and can opt in to show their display name anytime
- Display names and profile (Stats → Profile)
- Achievements system
- Share completed puzzle image

### Accessibility & Controls

- **Help menu** — Main menu and play screen: "Help" presents two clear options: **How to Play** (gameplay basics) and **Keyboard & Controls** (shortcuts, mouse/touch, zoom/pan). No duplicate content; each flow has a single focus.
- Keyboard shortcuts (Tab, arrows, R to rotate, ? or F1 for help, Ctrl+Z/Y undo/redo)
- First-time tutorial overlay
- Settings sub-menus — Game (time, ghost, lock), View (theme, preview, fullscreen), Audio (sound, haptics)
- Undo · Redo · Ghost hint · Lock pieces (optional)
- Designed for relaxed, low-pressure play

### Persistence

- Auto-save puzzle progress
- Resume across browser sessions
- Resume prompt on return (Resume / Start Fresh / Back to Home)

### PWA (Progressive Web App)

- **Installable** — Add to Home Screen (iOS/Android) or Install app (Chrome/Edge) from the live site.
- **Manifest** — Name, icons (192×192, 512×512), theme color, standalone display, start URL.
- **Service worker** — Auto-updating; precaches JS, CSS, HTML, and assets for faster repeat loads and basic offline support.
- **Apple** — `apple-mobile-web-app-capable`, `apple-touch-icon`, status bar style.

---

## Roadmap

### Completed ✓

| Area        | Features                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**    | Dark mode · Undo · Redo · Ghost hint · Lock pieces · Share image · Edge-piece tray filter · Zoom & pan                                                                                                                                                                                                                                                                                                                                          |
| **Time**    | Elapsed, countdown, active-only, relaxed, best time                                                                                                                                                                                                                                                                                                                                                                                             |
| **Daily**   | Same puzzle for everyone · Streak tracking                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Social**  | Stats · Leaderboards · Profile (display name) · Anonymous mode (fun raccoon names, still tracked, opt-in later) · Achievements                                                                                                                                                                                                                                                                                                                  |
| **Content** | What's New popup · Camera capture · Sample puzzle gallery                                                                                                                                                                                                                                                                                                                                                                                       |
| **UX**      | Help menu (How to Play + Keyboard & Controls, reduced cognitive load) · Theme as action card · Difficulty emojis · Mobile piece scaling · Tray start (16+) · Two-finger pinch zoom (iOS & Android) · Single-finger pan when zoomed · Settings sub-menus (Game, View, Audio) · Engagement polish (snap glow, milestones, streak toast, theme confetti, menu tips) · Completion overlay mobile · Selection auto-clear · Board size by piece count |
| **PWA**     | Installable app (manifest, service worker, offline precache) via vite-plugin-pwa                                                                                                                                                                                                                                                                                                                                                                |

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

**Useful scripts:** `npm run build` (production build), `npm run test` (unit tests), `npm run test:e2e` (E2E; run `npx playwright install` once for browsers), `npm run preview` (preview production build locally).

---

## Testing

- **Unit tests (Vitest)** — `npm run test` (single run), `npm run test:watch` (watch), `npm run test:ui` (UI). Tests live next to source (`*.test.ts` / `*.test.tsx`). Config: `vite.config.ts` `test` block.
- **E2E tests (Playwright)** — `npm run test:e2e` (starts dev server, runs `e2e/*.spec.ts`). First time: `npx playwright install`. Config: `playwright.config.ts`. CI runs Chromium only.

Pre-push (Husky) runs: empty-file check, Prettier, ESLint, TypeScript, and unit tests.

---

## PWA

Phuzzle is a **Progressive Web App**: users can install it from the browser for a standalone app experience.

- **Manifest** — Generated at build; defines name, short name, icons, theme color, `display: standalone`, start URL. Icons: `public/icon-192.png`, `public/icon-512.png`.
- **Service worker** — Generated by `vite-plugin-pwa` (Workbox); precaches built assets; `registerType: "autoUpdate"` so updates apply on next load.
- **Install** — On supported browsers (Chrome, Edge, Safari, etc.), use “Install” / “Add to Home Screen” when visiting the deployed site (e.g. phuzzle.vercel.app). No app-store submission required.

---

## Adding Sample Puzzles

Drop images into `src/app/assets/puzzles/`. You can use **one level** (e.g. `animals/`) or **subfolders** (e.g. `animals/cute/`, `animals/realistic/`).

```
src/app/assets/puzzles/
  animals/
    bear.png
    cute/
      kitten.png
    realistic/
      wolf.png
  nature/
    mountain.jpg
```

Images are auto-discovered at any depth.  
**Category** = path under `puzzles/` (e.g. `animals`, `animals/cute`, `animals/realistic`). **Puzzle name** = filename (kebab-case → Title Case).

---

## Project Structure

| Folder                        | Purpose                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/app/puzzle/`             | Core puzzle logic: PuzzleManager, pieces, canvas rendering, undo, storage                                         |
| `src/app/screens/`            | Screen components: Menu, NewGame, Setup, Play, Stats                                                              |
| `src/app/screens/Play/hooks/` | Play screen hooks: manager, animation, timer, pointer handlers (touch + mouse), viewport (zoom/pan)               |
| `src/app/components/`         | Shared UI: Modal, Button, PieceTray, HelpChoiceModal, ThemeModal, ShortcutsModal, etc.                            |
| `src/app/audio/`              | Sound effects                                                                                                     |
| `src/app/data/`               | Changelog, completion messages, menu tips, confetti colors, achievements, anonymous raccoon names, sample puzzles |
| `src/app/services/`           | Supabase: stats, leaderboard, profile, achievements                                                               |
| `src/app/assets/puzzles/`     | Sample puzzle images by category (animals, flowers, food, space, tech; subfolders supported)                      |
| `public/`                     | Favicon, PWA icons (icon-192.png, icon-512.png)                                                                   |
| `e2e/`                        | Playwright E2E tests (e.g. home.spec.ts)                                                                          |
| `scripts/`                    | Pre-push precheck (empty files, Prettier, ESLint, TypeScript, unit tests)                                         |
| `.husky/`                     | Git hooks: pre-commit (empty files, node_modules check), pre-push (runs precheck)                                 |
| `src/types/`                  | TypeScript declarations (e.g. canvas-confetti, vite-env)                                                          |
| `.github/`                    | Issue templates, workflows (Phuzzle.yml, vercel-production.yml), pull_request_template.md                         |
| `supabase/`                   | Migrations (001_initial_schema.sql, 002_player_profiles.sql), Supabase setup README                               |

Root configs: `vite.config.ts` (Vite + Vitest, PWA via vite-plugin-pwa), `playwright.config.ts` (Playwright). Unit tests live alongside source (e.g. `*.test.ts`). Release notes / changelog: `CHANGELOG_UPDATE.md`.

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
│   ├── _
│   │   ├── .gitignore
│   │   ├── applypatch-msg
│   │   ├── commit-msg
│   │   ├── h
│   │   ├── husky.sh
│   │   ├── post-applypatch
│   │   ├── post-checkout
│   │   ├── post-commit
│   │   ├── post-merge
│   │   ├── post-rewrite
│   │   ├── pre-applypatch
│   │   ├── pre-auto-gc
│   │   ├── pre-commit
│   │   ├── pre-merge-commit
│   │   ├── pre-push
│   │   ├── pre-rebase
│   │   └── prepare-commit-msg
│   ├── pre-commit
│   └── pre-push
├── .lighthouseci
│   ├── assertion-results.json
│   ├── lhr-1771101136136.html
│   ├── lhr-1771101136136.json
│   ├── lhr-1771101150354.html
│   └── lhr-1771101150354.json
├── e2e
│   └── home.spec.ts
├── lhci-reports
│   ├── localhost-index_html-2026_02_14_20_32_05.report.html
│   ├── localhost-index_html-2026_02_14_20_32_05.report.json
│   ├── localhost-index_html-2026_02_14_20_32_19.report.html
│   ├── localhost-index_html-2026_02_14_20_32_19.report.json
│   └── manifest.json
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
│   │   │   └── dailyPuzzle.ts
│   │   ├── data
│   │   │   ├── achievements.ts
│   │   │   ├── anonymousNames.ts
│   │   │   ├── changelog.ts
│   │   │   ├── completionMessages.ts
│   │   │   ├── confettiColors.ts
│   │   │   ├── menuTips.ts
│   │   │   ├── packCompletion.ts
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
├── src.zip
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

We <strong>love help</strong>.

If you want to:

- fix bugs
- improve performance
- add features
- learn how puzzle engines work

Before submitting a PR: run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`. E2E: `npm run test:e2e` (optional; requires `npx playwright install` once).

**DM us** to join the Discord and get involved.

No gatekeeping. No ego. Just building something fun together.

---

Team

Built by:

Nick
• GitHub: https://github.com/NickTheDevOpsGuy
• LinkedIn: https://www.linkedin.com/in/nicholas-a-clark/

Vinay
• GitHub: https://github.com/v-gajjar
• LinkedIn: https://www.linkedin.com/in/vinaygajjar/

Hannah
• GitHub: https://github.com/hannahro15
• LinkedIn: https://www.linkedin.com/in/hannaholbrich/

With help from the wider community ❤️  
See all contributors here → **[CONTRIBUTORS.md](./CONTRIBUTORS.md)**

Different strengths, shared ownership, great teamwork.

---

## License

MIT License. See [LICENSE.md](./LICENSE.md).
