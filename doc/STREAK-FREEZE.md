# Streak freeze (streak shield)

Protects your daily streak when you miss a day.

---

## Rules

- You can have **0 or 1** freeze at a time.
- You **earn** one freeze per week, and only after a **5-day streak**.
- If you miss a day and have a freeze, it is **auto-applied** at app startup (no prompt).

Week boundaries use the app’s “week key” in `dailyPuzzleCore.ts` (`refreshStreakFreeze()`).

---

## Flow

**Earn**  
After a completion, if your streak is ≥ 5 and you haven’t earned a freeze this week, you get one (if you don’t already have one).

**Auto-apply**  
On app startup, if yesterday was missed and a freeze is available, it is used automatically.

**Manual offer (legacy / tests)**  
Only when auto-apply is off (e.g. E2E). A modal may offer “Use your streak freeze?” Dismissal is remembered for the day.

---

## Storage keys (localStorage)

| Key                                        | Purpose                            |
| ------------------------------------------ | ---------------------------------- |
| `phuzzle:streakFreeze`                     | Freeze count (0 or 1)              |
| `phuzzle:streakFreezeWeek`                 | Current week key                   |
| `phuzzle:streakFreezeEarnedWeek`           | Week when freeze was last earned   |
| `phuzzle:streakFreeze:used:YYYY-MM-DD`     | Freeze used for this date          |
| `phuzzle:streakFreezeDismissed:YYYY-MM-DD` | User dismissed offer for this date |
| `phuzzle:testDisableAutoStreakFreeze`      | E2E: `"true"` disables auto-apply  |

---

## Code (`dailyPuzzleCore.ts`)

- `getStreakFreezeCount()` — available count
- `tryEarnStreakFreeze(currentStreak)` — grant one if streak ≥ 5 and not earned this week
- `tryAutoApplyStreakFreeze()` — use freeze for yesterday if missed and available
- `refreshStreakFreeze()` — update week key for new week
- `useStreakFreeze(forDate)` — consume freeze and mark used for date
- `wasYesterdayMissed()` — true if yesterday not completed and no freeze used

At startup, `App.tsx` calls `initStreakFreeze()`: refresh week key, then try auto-apply.

---

## E2E

Set `phuzzle:testDisableAutoStreakFreeze` to `"true"` in localStorage to disable auto-apply and test the manual offer (e.g. `e2e/streak-freeze.spec.ts`).
