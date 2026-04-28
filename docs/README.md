# Phuzzle docs

Developer documentation for Phuzzle. For project overview and setup, see the [main README](../README.md).

This `docs/` directory is the canonical documentation home for the repo. Its
`README.md` acts as the folder index; GitHub shows it when you open `docs/`, but
it does not automatically create side navigation for every subfolder.

---

## Setup

- [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md): Local setup, Playwright browsers, daily dev commands, Firefox test flow, troubleshooting.
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md): Supabase: leaderboards, stats, co-op. Create project, env vars, migrations, Realtime.
- [LIGHTHOUSE.md](LIGHTHOUSE.md): Lighthouse CI, where reports go, GitHub token note, and local Chrome setup tips.

---

## Features & behavior

| Doc                                                | What it covers                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [APP_MAP.md](APP_MAP.md)                           | First-stop map for user paths, menu locations, completion options, stats areas, and source ownership.  |
| [CHANGES.md](CHANGES.md)                           | Feature list and recent changes.                                                                       |
| [FEATURES_IMPLEMENTED.md](FEATURES_IMPLEMENTED.md) | Implemented features (daily countdown, streak freeze, piece shapes, etc.) and where they live in code. |
| [FUTURE.md](FUTURE.md)                             | Ideas and possible future features.                                                                    |
| [SHARING.md](SHARING.md)                           | Completion share, challenge targets, Daily Share, daily archive, and co-op share.                      |
| [SETTINGS_MENU.md](SETTINGS_MENU.md)               | Play menu settings map: submenus, toggles, conditional entries, and source files.                      |
| [STREAK-FREEZE.md](STREAK-FREEZE.md)               | Streak freeze (streak shield): how you earn it, when it applies, storage keys.                         |
| [BUG_REPORT.md](BUG_REPORT.md)                     | In-app bug report: where it is, what it does, main files.                                              |

---

## QA & testing

| Doc                                  | What it covers                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| [GAMES_SURFACE.md](GAMES_SURFACE.md) | Games catalog registration (UAT/Prod URLs), acceptance criteria, QA script, embed. |
| [MOBILE_QA.md](MOBILE_QA.md)         | Mobile release checklist: devices, core flows, safe areas, regression commands.    |
| [RELEASE_AUDIT.md](RELEASE_AUDIT.md) | Formal release audit: coverage, findings, feature-vs-spec review, release verdict. |
| [STATS_UI_QA.md](STATS_UI_QA.md)     | Stats modal QA: Profile, Board, Badges on mobile and desktop.                      |

---

## Session notes

| Doc                                      | What it covers                                                     |
| ---------------------------------------- | ------------------------------------------------------------------ |
| [SESSION_SUMMARY.md](SESSION_SUMMARY.md) | Session summary (layout, piece drawer, input, leaderboards, etc.). |

---

## Quick links

- **Main README:** [../README.md](../README.md) — overview, getting started, file structure.
- **Where is this option?:** [APP_MAP.md](APP_MAP.md) and [SETTINGS_MENU.md](SETTINGS_MENU.md).
- **Supabase migrations:** `supabase/migrations/`
- **Markdown lint config:** `/.markdownlint-cli2.jsonc`
