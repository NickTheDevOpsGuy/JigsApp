# App Map

Use this as the first stop when you are trying to answer "where does this live?"
or "where does the player find this option?"

## Main User Routes

| Area | User path | Main files |
| --- | --- | --- |
| Home | `/` | `src/app/screens/Menu/MenuScreen.tsx` |
| Play | `/play` | `src/app/screens/Play/PlayScreen.tsx`, `src/app/screens/Play/core/`, `src/app/screens/Play/components/` |
| Stats and leaderboards | `/stats`, or Play menu -> Leaderboard | `src/app/screens/Stats/StatsScreen.tsx`, `src/app/services/leaderboard/`, `src/app/services/player/` |
| Puzzle packs | Home -> Puzzle Packs | `src/app/screens/Packs/`, `src/app/data/puzzlePacks.ts`, `src/app/data/packMetadata.ts` |
| Quick Play | Home -> Quick Play | `src/app/components/ChoosePuzzleModal/`, `src/app/data/samplePuzzles.ts` |

`/new` is no longer the setup flow. It redirects to Home; puzzle setup happens
inside the staged Quick Play and Puzzle Packs modals.

## Home Screen Options

| Option | Where users find it | Notes |
| --- | --- | --- |
| Play Today's Puzzle / Continue Daily | Home primary button | Starts today's daily or resumes today's in-progress daily. |
| Resume puzzle | Home resume card | Appears only when saved progress exists. |
| Puzzle Packs | Home secondary action | Opens the pack flow. |
| Quick Play | Home secondary action | Opens catalog category -> puzzle -> difficulty setup. |
| Feedback | Home text action, and Help modal when provided | Opens Report a bug / Suggest a feature. |
| Help | Home help button | Opens How to Play, Keyboard & Controls, About, Feedback, Advanced, or Theme depending on available handlers. |
| Stats | Home top bar | Navigates to `/stats`. |

## Play Screen Menu

The Play screen hamburger menu has five root actions:

| Root action | What it does |
| --- | --- |
| Resume | Closes the menu and returns to the puzzle. |
| New Puzzle | Opens the existing new puzzle flow. |
| Settings | Opens Gameplay, Appearance, Audio, and Advanced groups. Gameplay contains Assistance, Modes, Move behavior, Piece Shape, Snapping, and Controls. |
| Leaderboard | Direct navigation to `/stats`. |
| Help | How to Play, Keyboard & Controls, and Get Involved items. |

For the full option-by-option map, see [SETTINGS_MENU.md](SETTINGS_MENU.md).

## Completion Options

| Option | Where users find it | Notes |
| --- | --- | --- |
| Share Result | Completion overlay -> Options | Shares the completed puzzle result. |
| Challenge Friend | Completion overlay -> Options | Creates a challenge link for the same puzzle/settings context. |
| Daily Share | Completion overlay after daily completion | Daily-only Wordle-style text share. |
| Watch Replay | Completion overlay -> Options | Opens replay viewer when replay data is available. |
| Next puzzle / Play again | Completion overlay | Continues the play loop after completion. |

Sharing behavior is documented in [SHARING.md](SHARING.md).

## Stats Screen Options

| Area | What users can do | Main files |
| --- | --- | --- |
| Profile | View identity, streak, tier, finished puzzles, daily mastery, and Profile & privacy settings. | `src/app/screens/Stats/tabs/ProfileTab.tsx` |
| Leaderboard | Filter Today, Week, and All-time rankings. | `src/app/screens/Stats/tabs/LeaderboardTab.tsx`, `src/app/services/leaderboard/` |
| Badges | View earned and locked badges. | `src/app/screens/Stats/tabs/BadgesTab.tsx` |

Stats-specific QA is in [STATS_UI_QA.md](STATS_UI_QA.md).

## Source Ownership

| Feature family | Start here |
| --- | --- |
| Play menu options | `src/app/screens/Play/components/headerMenu/` |
| Play screen state | `src/app/screens/Play/hooks/state/` |
| Play top bar and menu props | `src/app/screens/Play/hooks/topBar/` |
| Puzzle engine and snapping | `src/app/puzzle/manager/`, `src/app/puzzle/core/`, `src/app/puzzle/canvas/` |
| Puzzle data | `src/app/data/samplePuzzles.ts`, `src/app/data/puzzlePacks.ts`, `src/app/data/packMetadata.ts` |
| Daily puzzle logic | `src/app/daily/` |
| Sharing | `src/app/share/`, `src/app/screens/Play/components/completion/` |
| Audio | `src/app/audio/` |
| Supabase-backed data | `src/app/supabase/`, `src/app/services/leaderboard/`, `src/app/services/player/` |

When a user-facing option moves, update this file, [SETTINGS_MENU.md](SETTINGS_MENU.md),
and any feature doc that mentions the old path.
