# Phuzzle.dev


[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![Contributions welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](./CONTRIBUTORS.md)
[![Last Commit](https://img.shields.io/github/last-commit/NickTheDevOpsGuy/phuzzle)](https://github.com/NickTheDevOpsGuy/phuzzle/commits/main)

------------------------------------------------------------------------

## Table of Contents

- [Preview](#preview)
- [About Phuzzle](#about-jiggysaw)
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
- [Built by the Phuzzle Community](#built-by-the-jiggysaw-community)

------------------------------------------------------------------------

## Preview

### Gameplay Demo

*(Replace with a GIF once you have gameplay)*  
![Demo Placeholder](./Assets/Preview/preview.gif)


------------------------------------------------------------------------

## Play the Latest Build

A downloadable build will be available once the first playtest is released.

------------------------------------------------------------------------

## About Phuzzle

**Phuzzle** is a web-based jigsaw puzzle game built with React that turns relaxing piece-snapping into a smooth, satisfying experience.
Powered by modern frontend tooling and a lightweight UI architecture, it focuses on clear visuals, fluid drag-and-drop interactions, and that “just one more piece” feeling.

### Purpose

A calm, focused puzzle experience you can open anytime — part mindfulness, part cozy challenge.

------------------------------------------------------------------------

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

------------------------------------------------------------------------

## Testing


------------------------------------------------------------------------

## 🖌️ Wireframes / Mockups

### **Upload Your Image Screen**

### **Puzzle Loading Screen**

### **Puzzle Board Gameplay**

### **Preview Modal**


------------------------------------------------------------------------

## 🚀 Features


------------------------------------------------------------------------

## Roadmap

### Completed

- [] 2D scene setup
- [] Puzzle piece prefab
- [] Basic drag-and-drop
- [] Snapping logic prototype
- [] Random scatter placement

------------------------------------------------------------------------

### In Progress / Planned

- [ ] Multiple puzzle sizes (3×3, 4×4, 5×5…)
- [ ] Custom image import
- [ ] Win animation + confetti
- [ ] Light background music
- [ ] Mobile support (touch drag)
- [ ] Level selection screen
- [ ] Save/Load system
- [ ] Edge shaping / classic jigsaw cuts

------------------------------------------------------------------------

## Extended Roadmap


------------------------------------------------------------------------

## Tech Stack

-----------------------------------------------------------------------
Category      | Technologies / Tools
------------- | -------------------------------------------------------
Engine     | Unity 2022+
Scripts    | C# MonoBehaviours
Art        | Unity Sprites
Input      | Unity Input System
Tooling    | GitHub Actions (planned)
-----------------------------------------------------------------------

------------------------------------------------------------------------

## Getting Started

1. Clone:

```bash
git clone https://github.com/NickTheDevOpsGuy/JiggySaw.git
```

3. Run

```bash
npm run dev
```

------------------------------------------------------------------------

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
│   └── pull_request_template.md
├── src
│   └── app
│       ├── assets
│       │   ├── branding
│       │   └── ui
│       │       └── phuzzle-logo-512.png
│       ├── components
│       │   ├── Button.module.css
│       │   ├── Button.tsx
│       │   ├── Dropdown.module.css
│       │   ├── Dropdown.tsx
│       │   └── Modal.tsx
│       ├── puzzle
│       │   ├── PuzzleManager.ts
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
├── .gitignore
├── CONTRIBUTORS.md
├── index.html
├── LICENSE.md
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

15 directories, 37 files
MAC-G7L30391G4:phuzzle nicholas.clark$ npm run dev

> phuzzle@0.1.0 dev
> vite


  VITE v7.3.1  ready in 255 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
10:53:00 AM [vite] (client) hmr update /src/app/styles/global.css
10:53:04 AM [vite] (client) hmr update /src/app/styles/global.css (x2)
10:54:38 AM [vite] (client) hmr update /src/app/styles/global.css (x3)
10:56:53 AM [vite] (client) hmr update /src/app/styles/global.css (x4)
10:57:49 AM [vite] (client) page reload index.html
10:58:31 AM [vite] (client) hmr update /src/app/styles/global.css
10:58:44 AM [vite] (client) hmr update /src/app/screens/Menu/MenuScreen.tsx
^C
MAC-G7L30391G4:phuzzle nicholas.clark$ fileTree
.
├── .github
│   ├── ISSUE_TEMPLATE
│   │   ├── bug.yml
│   │   ├── config.yml
│   │   ├── documentation.yml
│   │   ├── enhancement_refactor.yml
│   │   ├── feature_request.yml
│   │   └── question_discussion.yml
│   └── pull_request_template.md
├── src
│   └── app
│       ├── assets
│       │   ├── branding
│       │   └── ui
│       │       └── phuzzle-logo-512.png
│       ├── components
│       │   ├── Button.module.css
│       │   ├── Button.tsx
│       │   ├── Dropdown.module.css
│       │   ├── Dropdown.tsx
│       │   └── Modal.tsx
│       ├── puzzle
│       │   ├── PuzzleManager.ts
│       │   ├── SnapLogic.ts
│       │   └── types.ts
│       ├── screens
│       │   ├── Menu
│       │   │   ├── MenuScreen.module.css
│       │   │   └── MenuScreen.tsx
│       │   ├── NewGame
│       │   │   ├── NewGameScreen.module.css
│       │   │   └── NewGameScreen.tsx
│       │   └── Play
│       │       ├── PlayScreen.module.css
│       │       └── PlayScreen.tsx
│       ├── styles
│       │   └── global.css
│       ├── App.tsx
│       ├── main.tsx
│       └── vite-env.d.ts
├── .gitignore
├── CONTRIBUTORS.md
├── index.html
├── LICENSE.md
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
</details>
```

------------------------------------------------------------------------

## Contributing

PRs welcome — ideas, fixes, features… all help make the puzzle feel smoother.

------------------------------------------------------------------------

## Collaborators

![Contributors](https://contrib.rocks/image?repo=NickTheDevOpsGuy/phuzzle&columns=10)

Meet all our amazing contributors here:

➡️ **[CONTRIBUTORS.md](./CONTRIBUTORS.md)**

------------------------------------------------------------------------

## Built by the Phuzzle Community

Phuzzle is an open-source project maintained by [CONTRIBUTORS.md](./CONTRIBUTORS.md) around the world.  
Thanks to everyone helping make this cozy puzzle experience even better.
