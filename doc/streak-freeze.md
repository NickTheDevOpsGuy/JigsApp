# Streak freeze (streak shield)

Streak freeze lets users protect their daily streak when they miss a day. **One freeze per week**, earned after a 5-day streak.

## Flow

1. **Earn** – When your streak reaches 5+ days, you earn one freeze for the week (if not already earned this week).
2. **Auto-apply** – If you miss a day and have a freeze available, it is **automatically applied** at app startup. Your streak continues without a prompt.
3. **Manual offer** (legacy) – When yesterday was missed, no freeze used, and you have a freeze, the modal may offer: _Use your streak freeze to protect your streak?_ (dismissible for the day).

## Storage keys

| Key                                        | Meaning                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| `phuzzle:streakFreeze`                     | Count of available tokens (0 or 1)                    |
| `phuzzle:streakFreezeWeek`                 | Week key; used for weekly reset                        |
| `phuzzle:streakFreezeEarnedWeek`           | Week when freeze was earned (max 1 per week)           |
| `phuzzle:streakFreeze:used:YYYY-MM-DD`     | Freeze was used for this date                          |
| `phuzzle:streakFreezeDismissed:YYYY-MM-DD` | User dismissed the offer on this date (if shown)       |

## Logic (`dailyPuzzleCore.ts`)

- `getStreakFreezeCount()` – Returns available count (0 or 1; default 0).
- `tryEarnStreakFreeze(currentStreak)` – Call after recording completion; grants 1 freeze if streak ≥ 5 and not yet earned this week.
- `tryAutoApplyStreakFreeze()` – Auto-consumes freeze for yesterday if missed and freeze available. Returns true if applied.
- `refreshStreakFreeze()` – Resets week key at start of new week.
- `useStreakFreeze(forDate)` – Consumes token, sets `used` for that date.
- `wasYesterdayMissed()` – True if yesterday not completed and no freeze used.
- `wasFreezeOfferDismissedToday()` – True if user dismissed today.
- `dismissFreezeOfferToday()` – Sets dismissed for today.

## Init

`initStreakFreeze()` is called at app startup in `App.tsx` to refresh the week key and **auto-apply** a freeze if yesterday was missed.
