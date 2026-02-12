![CI](https://github.com/NickTheDevOpsGuy/phuzzle/actions/workflows/Phuzzle.yml/badge.svg)
![React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

# Phuzzle

A cozy, modern jigsaw puzzle game built with React + TypeScript.  
Upload an image, break it into pieces, and snap them together.

Play: https://phuzzle.vercel.app/

---

## Table of Contents

- [Preview](#preview)
- [What is Phuzzle](#what-is-phuzzle)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [PWA](#pwa)
- [Adding Sample Puzzles](#adding-sample-puzzles)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## Preview

### Gameplay Demo

If the GIF link below is broken, check the folder name casing. GitHub is case-sensitive.  
Common fixes:

- `./assets/...` vs `./Assets/...`
- `preview.gif` vs `Preview.gif`

[![Play Phuzzle](./assets/preview/preview.gif)](https://phuzzle.vercel.app/)

---

## What is Phuzzle

Phuzzle is a fully interactive jigsaw puzzle experience focused on:

- Smooth snapping and merging
- Satisfying interactions
- Mobile-first usability
- Clean, maintainable game logic

Purpose:

A calm, cozy puzzle you can open anytime, part mindfulness, part challenge.

---

## Features

### Core gameplay

- Drag and drop pieces with rotation
- Board snap and neighbor snap
- Group merging so connected pieces move together
- Multiple grid sizes (3x3 to 6x6 and more)
- Image sources: gallery, file upload, camera capture
- Tray filters: All, Edges, Corners, Center (plus Grid and Color sorting)
- Zoom and pan
  - Desktop: scroll to zoom, middle mouse drag to pan
  - Mobile: two-finger pinch zoom and pan, plus single-finger pan on empty space when zoomed

### UX and polish

- Reference image preview overlay
- Progress and timer modes
- Completion confetti and fun completion messages (respects reduced motion)
- Completion summary: time, grid size, piece count
- Settings organized into sub-menus (Game, View, Audio)
- Optional piece borders (View)
- Undo and redo
- Ghost hint
- Optional piece locking
- Error boundary with reload (no blank screens)
- Visible focus indicators for keyboard users
- Difficulty indicator on setup (piece count + Easy/Medium/Hard/Expert)

### Social and progress

- Daily puzzle and streak tracking
- Stats dashboard and leaderboards (Supabase)
- Profile with display name and anonymous mode
- Share completed puzzle image
- Share app / invite testers (in-game Menu → More; native share on mobile, copy link on desktop)
- What's New (in-game Menu → More)

### Analytics (optional)

- PostHog integration behind env vars
  - Events: `puzzle_started`, `puzzle_completed`, `puzzle_exit_before_completion`, `time_to_first_snap_ms`
  - No route inside the app

---

## Tech Stack

| Category  | Tools                                    |
| --------- | ---------------------------------------- |
| Framework | React                                    |
| Language  | TypeScript                               |
| Build     | Vite                                     |
| Rendering | HTML Canvas                              |
| Backend   | Supabase (stats, leaderboards, profiles) |
| Analytics | PostHog (optional)                       |
| PWA       | vite-plugin-pwa                          |
| Testing   | Vitest (unit), Playwright (E2E)          |
| CI/CD     | GitHub Actions                           |
| Hosting   | Vercel                                   |

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

---

## PWA

Phuzzle is a Progressive Web App. You can install it from the browser.

- Manifest and icons live in `public/`
- Service worker generated by `vite-plugin-pwa`
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

## Project Structure

| Folder                        | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `src/app/puzzle/`             | Core puzzle logic (PuzzleManager, pieces, rendering, undo, storage) |
| `src/app/screens/`            | Screens (Menu, NewGame, Setup, Play, Stats)                         |
| `src/app/screens/Play/hooks/` | Play hooks (manager, animation, timer, input, viewport)             |
| `src/app/components/`         | Shared UI components                                                |
| `src/app/audio/`              | Sounds and music support                                            |
| `src/app/analytics/`          | PostHog integration (optional)                                      |
| `src/app/services/`           | Supabase services                                                   |
| `src/app/assets/puzzles/`     | Sample puzzle images by category                                    |
| `.github/`                    | Workflows, templates, PR template                                   |
| `e2e/`                        | Playwright tests                                                    |
| `scripts/`                    | Local tooling scripts                                               |
| `supabase/`                   | Migrations and Supabase setup                                       |

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

Nick

- GitHub: https://github.com/NickTheDevOpsGuy
- LinkedIn: https://www.linkedin.com/in/nicholas-a-clark/

Vinay

- GitHub: https://github.com/v-gajjar
- LinkedIn: https://www.linkedin.com/in/vinaygajjar/

Hannah

- GitHub: https://github.com/hannahro15
- LinkedIn: https://www.linkedin.com/in/hannaholbrich/

With help from the wider community.  
See all contributors here: **[CONTRIBUTORS.md](./CONTRIBUTORS.md)**

---

## License

MIT License. See [LICENSE.md](./LICENSE.md).
