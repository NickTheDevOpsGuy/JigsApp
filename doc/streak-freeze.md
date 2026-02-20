# Streak freeze

Streak freeze lets users protect their daily streak when they miss a day. One freeze token per week.

## Flow

1. User opens **Today's Puzzle** on the menu.
2. If yesterday was not completed and no freeze was used for it, and the user has a freeze available, the modal shows an offer: _"You missed yesterday. Use your streak shield to protect your streak?"_
3. **Use Shield** – Consumes the token and marks yesterday as "freeze used"; streak continues.
4. **No thanks** – Dismisses the offer for today; it won't show again until tomorrow.

## Storage keys

| Key                                        | Meaning                                       |
| ------------------------------------------ | --------------------------------------------- |
| `phuzzle:streakFreeze`                     | Count of available tokens (0 or 1)            |
| `phuzzle:streakFreezeWeek`                 | Week key; when it changes, token refills to 1 |
| `phuzzle:streakFreeze:used:YYYY-MM-DD`     | Freeze was used for this date                 |
| `phuzzle:streakFreezeDismissed:YYYY-MM-DD` | User dismissed the offer on this date         |

## Logic (`dailyPuzzleCore.ts`)

- `getStreakFreezeCount()` – Returns available count (default 1).
- `refreshStreakFreeze()` – Legacy; returns current count (no longer refills).
- `useStreakFreeze(forDate)` – Consumes token, sets `used` for that date.
- `wasYesterdayMissed()` – True if yesterday not completed and no freeze used.
- `wasFreezeOfferDismissedToday()` – True if user dismissed today.
- `dismissFreezeOfferToday()` – Sets dismissed for today.

## Init

`initStreakFreeze()` is called at app startup in `App.tsx` and is a no-op. The streak freeze offer is shown in `DailyDifficultyModal` when the user opens Today's Puzzle.
