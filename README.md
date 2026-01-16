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
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Collaborators](#collaborators)
- [License](#license)
- [Built by the Phuzzle Community](#built-by-the-phuzzle-community)

---

## Preview

### Gameplay Demo

_(Replace with a GIF once you have gameplay)_  
![Demo Placeholder](./Assets/Preview/preview.gif)

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

- [x] App routes and screens (Menu, New Game/Setup, Play)
- [x] Custom image upload (PNG/JPG) with validation
- [x] Persist selected image and render it in Play view
- [x] PuzzleManager scaffolding (state + piece generation)
- [x] Piece rendering with image slicing (each piece shows correct tile)
- [x] Classic jigsaw piece shapes (tabs/blanks) with clipping/masking
- [x] Drag-and-drop for shaped pieces
- [x] Target-based snapping still works with shaped pieces
- [x] Rotatable puzzle pieces with orientation-aware snapping

---

### In Progress / Planned

- [ ] Reference preview of completed image (thumbnail overlay)
- [ ] Error handling polish for invalid uploads (better UX)
- [ ] Random scatter placement improvements (more natural spread)
- [ ] Snapping logic MVP (snap tolerance, lock-in place)
- [ ] Detect puzzle completion + win state
- [ ] Multiple puzzle sizes (3×3, 4×4, 5×5…)
- [ ] Mobile support (touch drag)
- [ ] Save/Load game state
- [ ] Slice image into grid tiles (real pieces)
- [ ] Edge shaping or classic jigsaw cuts (later)

---

## Extended Roadmap

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
│   │   └── Phuzzle.yml
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
├── public
│   └── favicon.svg
├── scripts
│   └── precheck.sh
├── src
│   └── app
│       ├── assets
│       │   ├── branding
│       │   └── ui
│       │       └── phuzzle-logo-512.png
│       ├── components
│       │   ├── PuzzlePiece
│       │   │   ├── PuzzlePiece.module.css
│       │   │   └── PuzzlePiece.tsx
│       │   ├── Button.module.css
│       │   ├── Button.tsx
│       │   ├── Dropdown.module.css
│       │   ├── Dropdown.tsx
│       │   └── Modal.tsx
│       ├── puzzle
│       │   ├── PuzzleManager.ts
│       │   ├── PuzzlePiece.module.css
│       │   ├── PuzzlePiece.tsx
│       │   ├── shape.ts
│       │   ├── SnapLogic.ts
│       │   └── types.ts
│       ├── screens
│       │   ├── Menu
│       │   │   ├── MenuScreen.module.css
│       │   │   └── MenuScreen.tsx
│       │   ├── NewGame
│       │   │   ├── NewGameScreen.module.css
│       │   │   └── NewGameScreen.tsx
│       │   ├── Play
│       │   │   ├── PlayScreen.module.css
│       │   │   └── PlayScreen.tsx
│       │   └── Setup
│       │       ├── SetupScreen.module.css
│       │       └── SetupScreen.tsx
│       ├── styles
│       │   └── global.css
│       ├── App.tsx
│       ├── main.tsx
│       └── vite-env.d.ts
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
