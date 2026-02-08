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
- Multiple difficulty levels (3×3 to 6×6 grids)
- Image sources: gallery, file upload, or camera capture

### UX & Polish

- Reference image preview overlay
- Progress counter and timer (elapsed, countdown, active-only, relaxed, best time)
- Confetti celebration on completion 🎉
- Sound effects (snap, rotate, place, complete, undo/redo)
- Fullscreen mode · Dark mode · Multiple themes (Space, Ocean, Forest, Sunset)
- What's New popup for updates
- Custom fonts (Inter, Fredoka) and Lucide icons
- Resume prompt – "Resume Your Puzzle?" when returning with saved progress (Resume / Start Fresh / Back to Home)
- Loading spinner while puzzle initializes
- Piece count display (e.g. 12 / 24) in HUD
- Empty tray message ("All pieces on board!") when drawer is empty

### Mobile Support

- Touch drag, tap to rotate, long-press to tray
- Haptic feedback
- Camera capture for instant puzzles
- Mobile-safe layouts and gestures
- Scrollable menu (no cut-off), Help submenu (How to Play / Keyboard shortcuts)

### Social & Progress

- Daily puzzle — same for everyone, streak tracking
- Player statistics dashboard (Supabase)
- Leaderboards for daily puzzle times
- Achievements system
- Share completed puzzle image

### Accessibility & Controls

- Keyboard shortcuts (Tab, arrows, R to rotate, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y for undo/redo)
- First-time tutorial overlay
- Undo · Redo · Ghost hint · Lock pieces (optional)
- ARIA labels, focus trapping in modals, 44px touch targets
- Designed for relaxed, low-pressure play

### Persistence

- Auto-save puzzle progress
- Resume across browser sessions
- Resume prompt on return (Resume / Start Fresh / Back to Home)

---

## Roadmap

### Completed ✓

| Area        | Features                                                         |
| ----------- | ---------------------------------------------------------------- |
| **Core**    | Dark mode · Undo · Redo · Ghost hint · Lock pieces · Share image |
| **Time**    | Elapsed, countdown, active-only, relaxed, best time              |
| **Daily**   | Same puzzle for everyone · Streak tracking                       |
| **Social**  | Stats dashboard · Leaderboards · Achievements (Supabase)         |
| **Content** | What's New popup · Camera capture · Sample puzzle gallery        |

### Planned

- Edge-piece filtering
- Zoom and pan for large puzzles
- Import puzzle from URL
- PWA / offline support

---

## Tech Stack

| Category  | Tools          |
| --------- | -------------- |
| Framework | React          |
| Language  | TypeScript     |
| Build     | Vite           |
| Rendering | HTML Canvas    |
| CI/CD     | GitHub Actions |
| Hosting   | Vercel         |

---

## Getting Started

```bash
git clone https://github.com/NickTheDevOpsGuy/phuzzle.git
cd phuzzle
npm install
npm run dev
```

---

## Adding Sample Puzzles

Drop images into:

```
src/app/assets/puzzles/<category>/
```

Example:

```
src/app/assets/puzzles/
  animals/
    kitten.png
  nature/
    mountain.jpg
```

Images are auto-discovered.  
Category = folder name, puzzle name = filename.

---

## Project Structure

| Folder | Purpose |
|--------|---------|
| `src/app/puzzle/` | Core puzzle logic: PuzzleManager, pieces, canvas rendering, undo, storage |
| `src/app/screens/` | Screen components: Menu, NewGame, Setup, Play, Stats |
| `src/app/screens/Play/hooks/` | Play screen hooks: manager, animation, timer, pointer handlers |
| `src/app/components/` | Shared UI: Modal, Button, PieceTray, HowToPlay, ThemeToggle, etc. |
| `src/app/audio/` | Sound effects |
| `src/app/services/` | Supabase: stats, leaderboard, achievements |
| `src/app/assets/puzzles/` | Sample puzzle images by category |

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
├── public
│   └── favicon.svg
├── scripts
│   └── precheck.sh
├── src
│   ├── app
│   │   ├── assets
│   │   │   ├── puzzles
│   │   │   │   ├── animals
│   │   │   │   │   ├── bear.png
│   │   │   │   │   └── rabbit.png
│   │   │   │   ├── flowers
│   │   │   │   │   ├── daisy.png
│   │   │   │   │   ├── flower_bed.png
│   │   │   │   │   ├── lavender.png
│   │   │   │   │   └── sunflower.png
│   │   │   │   └── food
│   │   │   │       ├── charcuterie_board.png
│   │   │   │       ├── curries_and_rice.png
│   │   │   │       ├── fruit_platter.png
│   │   │   │       └── pasta_dishes.png
│   │   │   └── ui
│   │   │       └── phuzzle-logo-512.png
│   │   ├── audio
│   │   │   └── sounds.ts
│   │   ├── components
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
│   │   │   ├── HowToPlay
│   │   │   │   ├── index.ts
│   │   │   │   ├── TutorialOverlay.module.css
│   │   │   │   └── TutorialOverlay.tsx
│   │   │   ├── Modal
│   │   │   │   ├── Modal.module.css
│   │   │   │   └── Modal.tsx
│   │   │   ├── PieceTray
│   │   │   │   ├── PieceTray.module.css
│   │   │   │   └── PieceTray.tsx
│   │   │   ├── ShortcutsModal
│   │   │   │   ├── ShortcutsModal.module.css
│   │   │   │   └── ShortcutsModal.tsx
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
│   │   │   ├── changelog.ts
│   │   │   └── samplePuzzles.ts
│   │   ├── hooks
│   │   │   ├── useKeyboardShortcuts.ts
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
│   │   │   │   │   ├── useShareResults.ts
│   │   │   │   │   └── useTimeModeConfig.ts
│   │   │   │   ├── PlayScreen.module.css
│   │   │   │   ├── PlayScreen.tsx
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
│   │   └── 001_initial_schema.sql
│   └── README.md
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.yml
├── CONTRIBUTORS.md
├── eslint.config.ts
├── index.html
├── LICENSE.md
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
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
