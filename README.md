[![CI](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml/badge.svg)](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml)
![Last Commit](https://img.shields.io/github/last-commit/NickTheDevOpsGuy/phuzzle)
![License](https://img.shields.io/github/license/NickTheDevOpsGuy/phuzzle)
![Built with React](https://img.shields.io/badge/Built%20with-React-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38bdf8?logo=tailwind-css&logoColor=white)

# Phuzzle

A cozy jigsaw puzzle game built with React. Pick a puzzle from the catalog or packs using the staged modal flows—then snap pieces together with smooth drag-and-drop and satisfying feedback.

**Play:** [phuzzle.vercel.app](https://phuzzle.vercel.app)

---

## Table of Contents

- [Phuzzle](#phuzzle)
  - [Table of Contents](#table-of-contents)
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

- **Play:** Drag, drop, rotate; board and neighbor snap; group merging. Grids from 3×3 to 12×12. Puzzle selection starts from a streamlined mobile home with one clear primary CTA, then staged modals: **Quick Play** (catalog: category → puzzle → difficulty → start) and **Puzzle Packs** (pack → puzzle → difficulty → start), with clickable breadcrumbs. Piece tray with filters (All, Edges, Color); unified HUD pills (timer, pause, moves, pieces); compact gap between board and tray. Zoom and pan. Undo/redo in menu. Continue and start over. Placed pieces meet seamlessly (no visible gaps); unplaced pieces keep a clear jigsaw look.
- **Daily:** Daily puzzle, streaks, countdown, streak shield (freeze), a compact home momentum strip, and a 7-day daily-history row with streak nudges. **Daily Share** — after finishing the daily, share a Wordle-style result (daily #, difficulty, time, moves, emoji grid, play link) via copy or native share. Comments and reactions after completion.
- **Modes:** Zen, Mystery, Precision, Dynamic Difficulty, Adaptive Personality. Magnetic Snap and Snap Glow toggles. Reference preview, snap combo, piece shapes, percentile badges, themes.
- **Social:** Stats, profile, leaderboards (Today, Week, All-time, Efficiency). Share result, share card, **Challenge Friend** links, Daily Share (Wordle-style for daily only), replay viewer. Co-op play with shareable links. Home also surfaces a resume card when you have saved progress and refreshes automatically when daily or save data changes.
- **Quality:** Bug report with optional screenshots. Mobile layouts: touch drag on the board (pieces follow your finger; page scroll is disabled over the board so drag works), tappable tray and carousel buttons (48px hit areas). PWA install.

In-app **What's New** (changelog) uses a single bullet per item; source: `src/app/data/content/changelog.ts`.
Details: [docs/CHANGES.md](docs/CHANGES.md).

---

## Documentation

All project docs live in **[docs/](docs/)**. Full index: [docs/README.md](docs/README.md).

| Doc                                                          | Description                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| [docs/CHANGES.md](docs/CHANGES.md)                           | Feature list and recent changes                                 |
| [docs/FEATURES_IMPLEMENTED.md](docs/FEATURES_IMPLEMENTED.md) | Implemented features and where they live in code                |
| [docs/FUTURE.md](docs/FUTURE.md)                             | Ideas and possible future features                              |
| [docs/SHARING.md](docs/SHARING.md)                           | Completion share, Daily Share (Wordle-style), co-op share       |
| [docs/STREAK-FREEZE.md](docs/STREAK-FREEZE.md)               | Streak freeze (streak shield): earn it, when it applies         |
| [docs/BUG_REPORT.md](docs/BUG_REPORT.md)                     | In-app bug report: where it is, what it does                    |
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)             | Supabase: leaderboards, stats, co-op, env vars, migrations      |
| [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md)                     | Lighthouse CI, reports, "GitHub token not set" warning          |
| [docs/GAMES_SURFACE.md](docs/GAMES_SURFACE.md)               | Games surface: launch URLs, manifest, acceptance & QA checklist |
| [docs/MOBILE_QA.md](docs/MOBILE_QA.md)                       | Mobile release checklist and regression commands                |
| [docs/STATS_UI_QA.md](docs/STATS_UI_QA.md)                   | Stats modal QA: Profile, Board, Badges                          |
| [docs/SESSION_SUMMARY.md](docs/SESSION_SUMMARY.md)           | Session notes (layout, piece drawer, leaderboards, etc.)        |

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

Useful scripts: `npm run build`, `npm run preview`, `npm run test`, `npm run test:e2e`, `npm run lighthouse`, `npm run check:images` (Vitest and Playwright use 4 workers; run `npx playwright install` once). The image audit is useful before shipping large social or puzzle assets.

Image budget quick rule:

- Puzzle assets should usually stay under `500 kB` each after optimization.
- `1 MB+` is a warning sign.
- `2 MB+` is too large for normal gameplay assets and should be compressed or converted before shipping.
- Social/OG images should ideally stay under `250 kB`, and `500 kB+` should be treated as too heavy.

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
