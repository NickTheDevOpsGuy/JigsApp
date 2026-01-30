# 🧩 Phuzzle

A cozy, modern jigsaw puzzle game built with React.  
Upload an image, break it into pieces, and snap them together piece by piece.

[![CI](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml/badge.svg?branch=main)](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![Contributions welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](./CONTRIBUTORS.md)
[![Last Commit](https://img.shields.io/github/last-commit/NickTheDevOpsGuy/phuzzle)](https://github.com/NickTheDevOpsGuy/phuzzle/commits/main)

---

## Table of Contents

- [Preview](#preview)
- [About Phuzzle](#about-phuzzle)
- [User Stories](#user-stories)
- [Testing](#testing)
- [Wireframes / Mockups](#wireframes--mockups)
- [Features](#features)
- [Roadmap](#roadmap)
- [Extended Roadmap](#extended-roadmap)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Adding Sample Puzzles](#adding-sample-puzzles)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Collaborators](#collaborators)
- [License](#license)
- [Built by the Phuzzle Community](#built-by-the-phuzzle-community)

---

## Preview

### Gameplay Demo

[![Play Phuzzle](./Assets/Preview/preview.gif)](https://phuzzle.vercel.app/)

**[▶️ Play Now on Vercel](https://phuzzle.vercel.app/)**

---

## Play the Latest Build

A downloadable build will be available once the first playtest is released.

---

## About Phuzzle

**Phuzzle** is a web-based jigsaw puzzle game built with React that turns relaxing piece-snapping into a smooth, satisfying experience.
Powered by modern frontend tooling and a lightweight UI architecture, it focuses on clear visuals, fluid drag-and-drop interactions, and that “just one more piece” feeling.

### Purpose

A calm, focused puzzle experience you can open anytime — part mindfulness, part cozy challenge.

---

## User Stories

### **Players Want…**

- To upload an image and instantly generate a puzzle from it.
- To drag pieces smoothly and intuitively.
- To have pieces snap into place when they are correctly aligned.
- To preview the original image for reference.
- To enjoy clean visuals with no clutter or distractions.
- To play a relaxing puzzle at their own pace.

### **Developers Want…**

- A well-defined puzzle-generation flow.
- A structure that supports expansion (mobile, new puzzle sizes, etc).
- A roadmap that invites contribution.

---

## Testing

---

## 🖌️ Wireframes / Mockups

### **Upload Your Image Screen**

### **Puzzle Loading Screen**

### **Puzzle Board Gameplay**

### **Preview Modal**

---

## 🚀 Features

---

## Roadmap

### Completed

- **Core gameplay**
  - Drag-and-drop jigsaw pieces with rotation
  - Interlocking jigsaw shapes (tabs and blanks)
  - Smart snapping (board + neighbor snapping)
  - Piece merging (connected pieces move as a group)

- **Gameplay tools**
  - Piece tray (middle-click to store, color-sorted)
  - Reference preview overlay
  - Progress counter and win detection
  - Timer with pause support

- **Controls & accessibility**
  - Mouse, touch, and keyboard support
  - Keyboard shortcuts (Tab select, arrows move, R rotate)
  - Mobile gestures (tap to rotate, long-press to tray)

- **Polish & UX**
  - Auto-save across sessions
  - Sound effects and haptics
  - Confetti celebration on completion
  - Fullscreen mode

- **Content & delivery**
  - Sample puzzle gallery
  - Multiple difficulty levels (3×3–6×6)
  - Deployed on Vercel

- **Rendering Architecture**

- Dual-space rendering model
  - Screen space for backdrop and overlays
    -World space for puzzle transforms
- DPR-aware canvas clearing to prevent subpixel artifacts
- Path2D-based piece silhouettes for pixel-accurate clipping
- Deterministic draw ordering via z-index sorting

Deterministic draw ordering via z-index sorting

---

### Planned

- [ ] Dark mode
- [ ] Undo/Redo
- [ ] Ghost/hint preview for stuck players
- [ ] Edge piece filter in tray
- [ ] Zoom and pan for larger puzzles
- [ ] Daily puzzle challenge
- [ ] Share completed puzzle image
- [ ] Player statistics dashboard
- [ ] Achievements system
- [ ] Import puzzle from URL
- [ ] Camera capture for custom photos
- [ ] PWA support (offline play)

---

## Extended Roadmap

TBD

---

## Tech Stack

---

| Category  | Technologies / Tools |
| --------- | -------------------- |
| Framework | React                |
| Build     | Vite                 |
| Language  | TypeScript           |
| Styling   | CSS Modules          |
| Tooling   | GitHub Actions       |

---

---

## Getting Started

1. Clone:

```bash
git clone https://github.com/NickTheDevOpsGuy/phuzzle.git
```

3. Run

```bash
npm run dev
```

---

## Adding Sample Puzzles

Drop images into `src/app/assets/puzzles/<category>/`:

```
src/app/assets/puzzles/
  animals/
    my-new-image.jpg
  nature/
    landscape.png
```

Images are auto-discovered. Category = folder name, puzzle name = filename.

---

## Project Structure

```
<details>
<summary>Click to expand file structure</summary>

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
│   │   ├── Phuzzle.yml
│   │   └── vercel-production.yml
│   └── pull_request_template.md
├── .husky
│   ├── pre-commit
│   └── pre-push
├── .vite
│   └── deps
│       ├── _metadata.json
│       └── package.json
├── Assets
│   └── Preview
│       └── preview.gif
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
│   │   │   │   │   ├── frog.png
│   │   │   │   │   ├── kitten.png
│   │   │   │   │   └── rabbit.png
│   │   │   │   ├── demo
│   │   │   │   │   ├── blue_square_thumb.png
│   │   │   │   │   ├── four_quadrants_thumb.png
│   │   │   │   │   ├── green_triangle_thumb.png
│   │   │   │   │   ├── red_circle_thumb.png
│   │   │   │   │   ├── two_color_split_thumb.png
│   │   │   │   │   └── yellow_star_thumb.png
│   │   │   │   └── nature
│   │   │   └── ui
│   │   │       └── phuzzle-logo-512.png
│   │   ├── audio
│   │   │   └── sounds.ts
│   │   ├── components
│   │   │   ├── Button
│   │   │   │   ├── Button.module.css
│   │   │   │   └── Button.tsx
│   │   │   ├── DropDown
│   │   │   │   ├── Dropdown.module.css
│   │   │   │   └── Dropdown.tsx
│   │   │   ├── HowToPlay
│   │   │   │   ├── HowToPlay.module.css
│   │   │   │   ├── HowToPlayModal.tsx
│   │   │   │   ├── index.ts
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
│   │   │   └── Tray
│   │   │       ├── Tray.module.css
│   │   │       └── Tray.tsx
│   │   ├── data
│   │   │   └── samplePuzzles.ts
│   │   ├── hooks
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── puzzle
│   │   │   ├── canvas
│   │   │   │   ├── pickPiece.ts
│   │   │   │   ├── renderBoard.ts
│   │   │   │   ├── renderTrayPiece.ts
│   │   │   │   └── shape.ts
│   │   │   ├── colorUtils.ts
│   │   │   ├── config.ts
│   │   │   ├── PuzzleManager.ts
│   │   │   ├── puzzleStorage.ts
│   │   │   ├── shape.ts
│   │   │   ├── SnapLogic.ts
│   │   │   └── types.ts
│   │   ├── screens
│   │   │   ├── Menu
│   │   │   │   ├── MenuScreen.module.css
│   │   │   │   └── MenuScreen.tsx
│   │   │   ├── NewGame
│   │   │   │   ├── NewGameScreen.module.css
│   │   │   │   └── NewGameScreen.tsx
│   │   │   ├── Play
│   │   │   │   ├── PlayScreen.module.css
│   │   │   │   └── PlayScreen.tsx
│   │   │   └── Setup
│   │   │       ├── SetupScreen.module.css
│   │   │       └── SetupScreen.tsx
│   │   ├── styles
│   │   │   └── global.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   └── types
│       ├── canvas-confetti.d.ts
│       └── vite-env.d.ts
├── .env.development
├── .env.example
├── .eslintcache
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
├── tsconfig.app.tsbuildinfo
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts

</details>
```

---

## Contributing

PRs welcome — ideas, fixes, features… all help make the puzzle feel smoother.

---

## Collaborators

![Contributors](https://contrib.rocks/image?repo=NickTheDevOpsGuy/phuzzle&columns=10)

Meet all our amazing contributors here:

➡️ **[CONTRIBUTORS.md](./CONTRIBUTORS.md)**

---

## Built by the Phuzzle Community

Phuzzle is an open-source project maintained by [CONTRIBUTORS.md](./CONTRIBUTORS.md) around the world.  
Thanks to everyone helping make this cozy puzzle experience even better.

---

## License

MIT License. See [LICENSE.md](./LICENSE.md) for details.
