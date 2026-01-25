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

- [x] Drag-and-drop jigsaw pieces with rotation
- [x] Middle-click to send pieces to the tray for organization
- [x] Piece tray with color-sorted organization
- [x] Multiple difficulty levels (3×3 to 6×6 grids)
- [x] Reference preview of completed image
- [x] Progress counter showing pieces remaining
- [x] Timer that stops on completion
- [x] Auto-save progress across browser sessions
- [x] "New Game" button to start fresh
- [x] Confetti celebration when you complete the puzzle

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
- [ ] Added a puzzel draw to hold pieces for (later)

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
├── assets
│   ├── banner.png
│   └── omegabot.png
├── CHANGELOG.md
├── CONTRIBUTORS.md
├── data
│   └── omegabot.db
├── docs
│   ├── commands.md
│   ├── dev-notes.md
│   ├── faq.md
│   ├── setup-discord.md
│   ├── setup-env.md
│   └── transcripts.md
├── .env.example
├── eslint.config.ts
├── .github
│   ├── ISSUE_TEMPLATE
│   │   ├── bug.yml
│   │   ├── config.yml
│   │   ├── documentation.yml
│   │   ├── enhancement_refactor.yml
│   │   ├── feature_request.yml
│   │   └── question_discussion.yml
│   ├── pull_request_template.md
│   └── workflows
│       └── OmegaBot.yml
├── .gitignore
├── .husky
│   ├── pre-commit
│   └── pre-push
├── LICENSE
├── migrations
│   └── 001_rps_stats.sql
├── package.json
├── .prettierignore
├── .prettierrc.yml
├── README.md
├── scripts
│   └── precheck.sh
├── src
│   ├── bot.ts
│   ├── commands
│   │   ├── admin
│   │   │   └── admin.ts
│   │   ├── afk
│   │   │   └── afk.ts
│   │   ├── changelog
│   │   │   └── changelog.ts
│   │   ├── config
│   │   │   └── config.ts
│   │   ├── faq
│   │   │   ├── faq.ts
│   │   │   └── subcommands
│   │   │       ├── add.ts
│   │   │       ├── get.ts
│   │   │       ├── list.ts
│   │   │       └── remove.ts
│   │   ├── fun
│   │   │   ├── coinflipStore.test.ts
│   │   │   ├── coinflipStore.ts
│   │   │   ├── coinStore.ts
│   │   │   ├── fun.ts
│   │   │   └── subcommands
│   │   │       ├── coinflipstats.ts
│   │   │       ├── coinflip.ts
│   │   │       ├── daily.ts
│   │   │       ├── dice.ts
│   │   │       ├── eightball.ts
│   │   │       ├── joke
│   │   │       │   ├── add.ts
│   │   │       │   ├── index.ts
│   │   │       │   ├── list.ts
│   │   │       │   ├── random.ts
│   │   │       │   └── remove.ts
│   │   │       ├── leaderboard.ts
│   │   │       ├── poll.ts
│   │   │       ├── quote.ts
│   │   │       ├── remind.ts
│   │   │       ├── rps.ts
│   │   │       ├── trivia.ts
│   │   │       └── weather.ts
│   │   ├── general
│   │   │   └── ping.ts
│   │   ├── github
│   │   │   ├── gh.ts
│   │   │   ├── pr.ts
│   │   │   └── status.ts
│   │   ├── help
│   │   │   ├── helpText.ts
│   │   │   └── help.ts
│   │   ├── history
│   │   │   └── history.ts
│   │   ├── pagination
│   │   │   └── pagination.ts
│   │   ├── playback
│   │   │   └── playback.ts
│   │   ├── summary
│   │   │   └── summary.ts
│   │   └── timezone
│   │       └── timezone.ts
│   ├── config
│   │   └── env.ts
│   ├── registerCommands.ts
│   ├── services
│   │   ├── ai
│   │   │   └── claudeService.ts
│   │   ├── cache
│   │   │   └── simpleCache.ts
│   │   ├── config
│   │   │   ├── guildConfigStore.ts
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── database
│   │   │   └── db.ts
│   │   ├── discord
│   │   │   ├── commandLoader.ts
│   │   │   ├── commandMeta.ts
│   │   │   ├── commandTypes.ts
│   │   │   ├── cooldowns.ts
│   │   │   ├── fetchChannelMessages.ts
│   │   │   ├── interactionHandler.ts
│   │   │   ├── safeReply.ts
│   │   │   └── tracedInteractionHandler.ts
│   │   ├── faq
│   │   │   ├── faqService.ts
│   │   │   ├── permissions.ts
│   │   │   ├── services.test.ts
│   │   │   ├── services.ts
│   │   │   ├── _shared.ts
│   │   │   ├── store.test.ts
│   │   │   ├── store.ts
│   │   │   └── types.ts
│   │   ├── fun
│   │   │   ├── funUsageStore.test.ts
│   │   │   ├── funUsageStore.ts
│   │   │   └── pollStore.ts
│   │   ├── github
│   │   │   ├── githubApi.ts
│   │   │   ├── githubCache.ts
│   │   │   ├── githubClient.ts
│   │   │   ├── githubErrorMessage.ts
│   │   │   ├── issueAssigneePollerState.ts
│   │   │   ├── issueAssigneePoller.ts
│   │   │   ├── lastSeenStore.ts
│   │   │   ├── prFormatter.ts
│   │   │   ├── prPoller.ts
│   │   │   └── types.ts
│   │   ├── joke
│   │   │   └── jokeStore.ts
│   │   ├── logging
│   │   │   ├── index.ts
│   │   │   └── requestContext.ts
│   │   ├── reminders
│   │   │   ├── index.ts
│   │   │   ├── scheduler.ts
│   │   │   ├── schema.ts
│   │   │   └── store.ts
│   │   ├── roles
│   │   │   └── autoRoleHandler.ts
│   │   ├── summary
│   │   │   ├── llmSummary.ts
│   │   │   ├── localSummary.ts
│   │   │   └── summarizer.ts
│   │   ├── time
│   │   │   ├── formatTimestamp.ts
│   │   │   └── validateTimezone.ts
│   │   ├── timezone
│   │   │   └── timezoneStore.ts
│   │   ├── transcript
│   │   │   ├── buildTranscript.ts
│   │   │   └── defaults.ts
│   │   ├── weather
│   │   │   ├── forecast.ts
│   │   │   └── types.ts
│   │   └── welcome
│   │       ├── welcomeHandler.ts
│   │       └── welcomeMessage.ts
│   ├── test
│   │   └── dbTestUtils.ts
│   ├── types
│   │   └── discord-client.d.ts
│   └── utils
│       ├── colors.ts
│       ├── interactions.ts
│       └── logger.ts
├── tsconfig.json
└── vitest.config.ts

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
