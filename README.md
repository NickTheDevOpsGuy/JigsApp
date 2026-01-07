# phuzzle


![Unity](https://img.shields.io/badge/Built%20with-Unity-000000?logo=unity&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?logo=csharp&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Contributions welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)
![Last Commit](https://img.shields.io/github/last-commit/NickTheDevOpsGuy/JigsApp)

------------------------------------------------------------------------

## Table of Contents

- [Preview](#preview)
- [About JiggySaw](#about-jiggysaw)
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
- [Built by the JiggySaw Community](#built-by-the-jiggysaw-community)

------------------------------------------------------------------------

## Preview

### Gameplay Demo

*(Replace with a GIF once you have gameplay)*  
![Demo Placeholder](./Assets/Preview/preview.gif)

> Captured directly from the Unity Editor

------------------------------------------------------------------------

## Play the Latest Build

A downloadable build will be available once the first playtest is released.

------------------------------------------------------------------------

## About JiggySaw

**phuzzle** is a Unity-based jigsaw puzzle game that turns relaxing piece-snapping into a smooth, satisfying experience.  
Powered by C# and a lightweight 2D setup, it focuses on clear visuals, fluid drag-and-drop, and that "just one more piece" feeling.

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

- Modular, readable C# scripts.
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

2. Open in **Unity Hub (2022+)**

3. Press **Play** to run.

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
├── docs
│   └── WireFrames
├── public
│   └── assets
├── src
│   └── app
│       ├── assets
│       │   ├── art
│       │   ├── images
│       │   ├── logo
│       │   ├── prefabs
│       │   ├── scenes
│       │   └── sounds
│       ├── components
│       │   ├── Button
│       │   │   ├── Button.module.css
│       │   │   ├── Button.tsx
│       │   │   └── index.ts
│       │   ├── Dropdown
│       │   │   ├── Dropdown.module.css
│       │   │   ├── Dropdown.tsx
│       │   │   └── index.ts
│       │   └── Modal
│       │       ├── index.ts
│       │       ├── Modal.module.css
│       │       └── Modal.tsx
│       ├── features
│       │   └── puzzle
│       │       ├── Difficulty.ts
│       │       ├── index.ts
│       │       ├── Piece.ts
│       │       ├── PuzzleManager.ts
│       │       ├── SnapLogic.ts
│       │       └── types.ts
│       ├── providers
│       │   └── GameProvider.tsx
│       ├── screens
│       │   ├── HowToPlay
│       │   │   ├── HowToPlayModal.module.css
│       │   │   ├── HowToPlayModal.tsx
│       │   │   └── index.ts
│       │   ├── Menu
│       │   │   ├── DifficultySelect.module.css
│       │   │   ├── DifficultySelect.tsx
│       │   │   ├── index.ts
│       │   │   ├── MenuActions.module.css
│       │   │   ├── MenuActions.tsx
│       │   │   ├── MenuLayout.module.css
│       │   │   ├── MenuLayout.tsx
│       │   │   ├── MenuScreen.module.css
│       │   │   └── MenuScreen.tsx
│       │   └── Puzzle
│       │       ├── index.ts
│       │       ├── PuzzleBoard.module.css
│       │       ├── PuzzleBoard.tsx
│       │       ├── PuzzleHUD.module.css
│       │       ├── PuzzleHUD.tsx
│       │       ├── PuzzleScreen.module.css
│       │       └── PuzzleScreen.tsx
│       ├── styles
│       │   ├── colors.css
│       │   ├── globals.css
│       │   ├── spacing.css
│       │   └── typography.css
│       ├── types
│       │   └── index.ts
│       ├── utils
│       │   └── imageUtils.ts
│       ├── App.tsx
│       ├── main.tsx
│       ├── routes.tsx
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

![Contributors](https://contrib.rocks/image?repo=NickTheDevOpsGuy/JigsApp&columns=10)

Meet all our amazing contributors here:

➡️ **[CONTRIBUTORS.md](./CONTRIBUTORS.md)**

------------------------------------------------------------------------

## Built by the phuzzle Community

phuzzle 2026 is an open-source project maintained by [CONTRIBUTORS.md](./CONTRIBUTORS.md) around the world.  
Thanks to everyone helping make this cozy puzzle experience even better.
