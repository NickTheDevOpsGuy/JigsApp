# Streak freeze (streak shield)

Streak freeze protects a player's daily streak when they miss a day.

Rules:

- One freeze can be **available at a time** (0 or 1).
- A freeze is **earned once per week** after reaching a 5-day streak.
- If a day is missed and a freeze is available, it is **auto-applied** at app startup.

> Week boundaries follow the app's "week key" logic in `dailyPuzzleCore.ts` (see `refreshStreakFreeze()`).

---

## Definitions

- Missed day: yesterday has no completion recorded and no freeze was used for that date.
- Week key: a stored identifier representing the current week. Used to reset eligibility and prevent earning more than one freeze per week.

---

## Flow

1. Earn
   - After recording a completion, if the player's streak is at least 5 and they have not earned a freeze this week, grant one freeze (if they do not already have one).

2. Auto-apply (default behavior)
   - At app startup, if yesterday was missed and a freeze is available, it is automatically consumed.
   - No modal or prompt is shown.

3. Manual offer (legacy, mainly for tests)
   - Only used when auto-apply is disabled for E2E.
   - If yesterday was missed, no freeze was used, and a freeze is available, the modal may offer:
     "Use your streak freeze to protect your streak?"
   - Dismissal is remembered for the day.

---

## Storage keys (localStorage)

| Key                                        | Purpose |
| ------------------------------------------ | ------- |
| `phuzzle:streakFreeze`                     | Available freeze count (0 or 1) |
| `phuzzle:streakFreezeWeek`                 | Current week key (used to detect week rollover) |
| `phuzzle:streakFreezeEarnedWeek`           | Week key in which the freeze was last earned (prevents earning twice in one week) |
| `phuzzle:streakFreeze:used:YYYY-MM-DD`     | Freeze was used to cover this date |
| `phuzzle:streakFreezeDismissed:YYYY-MM-DD` | User dismissed the offer for this date (if shown) |
| `phuzzle:testDisableAutoStreakFreeze`      | E2E only: `"true"` disables auto-apply |

---

## Logic (`dailyPuzzleCore.ts`)

- `getStreakFreezeCount()` - returns available count (0 or 1; default 0)
- `tryEarnStreakFreeze(currentStreak)` - call after recording completion; grants 1 freeze if `currentStreak >= 5` and not earned this week
- `tryAutoApplyStreakFreeze()` - consumes freeze for yesterday if missed and available; returns true if applied
- `refreshStreakFreeze()` - updates week key at start of a new week
- `useStreakFreeze(forDate)` - consumes token and marks it used for `forDate`
- `wasYesterdayMissed()` - true if yesterday not completed and no freeze used for that date
- `wasFreezeOfferDismissedToday()` / `dismissFreezeOfferToday()` - tracks dismissal for today (manual offer only)

---

## Initialization

`initStreakFreeze()` runs at app startup in `App.tsx`:

1. Refresh week key via `refreshStreakFreeze()`
2. Attempt auto-apply via `tryAutoApplyStreakFreeze()` if yesterday was missed

---

## Invariants (expected truths)

- Freeze availability is always 0 or 1.
- A freeze can be earned at most once per week.
- Auto-apply runs before any manual-offer UI is considered.
- A freeze is consumed at most once per date via `used:YYYY-MM-DD`.

---

## E2E tests

Set `phuzzle:testDisableAutoStreakFreeze` to `"true"` in `localStorage` (via `page.addInitScript`) to disable auto-apply. This allows tests to validate the manual offer flow (see `e2e/streak-freeze.spec.ts`).
