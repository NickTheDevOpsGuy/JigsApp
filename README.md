[![CI](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml/badge.svg)](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml)
![Last Commit](https://img.shields.io/github/last-commit/NickTheDevOpsGuy/phuzzle)
![License](https://img.shields.io/github/license/NickTheDevOpsGuy/phuzzle)
![Built with React](https://img.shields.io/badge/Built%20with-React-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38bdf8?logo=tailwind-css&logoColor=white)

# Phuzzle

A cozy jigsaw puzzle game built with React. Pick a puzzle from the gallery, uploads, camera, or packs—then snap pieces together with smooth drag-and-drop and satisfying feedback.

**Play:** [phuzzle.vercel.app](https://phuzzle.vercel.app)

---

## Table of Contents

- [Preview](#preview)
- [Features](#features)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Accessibility](#accessibility)
- [Tech](#tech)
- [Get started](#get-started)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## Preview

[![Play Phuzzle](./Assets/Preview/preview.gif)](https://phuzzle.vercel.app/)

> If the GIF doesn’t load, check path and casing (GitHub is case-sensitive).

---

## Features

- **Play:** Drag, drop, rotate; board and neighbor snap; group merging. Grids from 3×3 to 12×12. Gallery, upload, camera, and curated packs. Pack and puzzle pickers share one modal layout (Pack → Puzzle → Difficulty → Start) with clickable breadcrumbs. Piece tray with filters (All, Edges, Color); unified HUD pills (timer, pause, moves, pieces); compact gap between board and tray. Zoom and pan. Undo/redo with snap-back. Continue and start over.
- **Daily:** Daily puzzle, streaks, countdown, streak shield (freeze). **Daily Share** — after finishing the daily, share a Wordle-style result (daily #, difficulty, time, moves, emoji grid, play link) via copy or native share. Comments and reactions after completion.
- **Modes:** Zen, Mystery, Precision, Dynamic Difficulty, Adaptive Personality. Magnetic Snap and Snap Glow toggles. Reference preview, snap combo, piece shapes, percentile badges, themes.
- **Social:** Stats, profile, leaderboards (Today, Week, All-time, Efficiency). Share result, share card, Beat My Puzzle challenge links, Daily Share (Wordle-style for daily only), replay viewer. Co-op play with shareable links.
- **Quality:** Bug report with optional screenshots. Mobile layouts: touch drag on the board (pieces follow your finger; page scroll is disabled over the board so drag works), tappable tray and carousel buttons (48px hit areas). PWA install.

In-app **What's New** (changelog) uses a single bullet per item; source: `src/app/data/content/changelog.ts`.  
Details: [doc/CHANGES.md](doc/CHANGES.md).

---

## Documentation

All project docs live in **[doc/](doc/)**. Full index: [doc/README.md](doc/README.md).

| Doc                                                        | Description                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| [doc/CHANGES.md](doc/CHANGES.md)                           | Feature list and recent changes                            |
| [doc/FEATURES_IMPLEMENTED.md](doc/FEATURES_IMPLEMENTED.md) | Implemented features and where they live in code           |
| [doc/FUTURE.md](doc/FUTURE.md)                             | Ideas and possible future features                         |
| [doc/SHARING.md](doc/SHARING.md)                           | Completion share, Daily Share (Wordle-style), co-op share  |
| [doc/STREAK-FREEZE.md](doc/STREAK-FREEZE.md)               | Streak freeze (streak shield): earn it, when it applies    |
| [doc/BUG_REPORT.md](doc/BUG_REPORT.md)                     | In-app bug report: where it is, what it does               |
| [doc/SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md)             | Supabase: leaderboards, stats, co-op, env vars, migrations |
| [doc/LIGHTHOUSE.md](doc/LIGHTHOUSE.md)                     | Lighthouse CI, reports, "GitHub token not set" warning     |
| [doc/MOBILE_QA.md](doc/MOBILE_QA.md)                       | Mobile release checklist and regression commands           |
| [doc/STATS_UI_QA.md](doc/STATS_UI_QA.md)                   | Stats modal QA: Profile, Board, Badges                     |
| [doc/SESSION_SUMMARY.md](doc/SESSION_SUMMARY.md)           | Session notes (layout, piece drawer, leaderboards, etc.)   |

---

## Roadmap

- Import puzzle from URL
- Stronger offline-first for puzzle images

---

## Accessibility

- **Color vision:** The UI uses blue as the main brand color (buttons, links, selection), which works well for most color vision types. A **Color blind friendly** option (Settings → Display in Play, or Theme & Sounds from the menu) switches progress, “done,” and success states to blue so red–green is not the only cue; it applies to all screens and all themes. We avoid **color-only** cues: low-time warning shows a warning icon as well as red styling; co-op status shows text and icons (e.g. WifiOff, spinner) with color. Focus rings and sufficient contrast are used for interactive elements.

---

## Tech

**Frontend:** React, TypeScript, HTML Canvas  
**Build:** Vite, vite-plugin-pwa  
**Test:** Vitest, Playwright  
**Deploy:** GitHub Actions, Vercel. Optional Supabase for leaderboards, stats, co-op, comments.

---

## Get started

```bash
git clone https://github.com/NickTheDevOpsGuy/phuzzle.git
cd phuzzle
npm install
npm run dev
```

Useful scripts: `npm run build`, `npm run preview`, `npm run test`, `npm run test:e2e` (run `npx playwright install` once).

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

## Team

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
