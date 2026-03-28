/**
 * XP multiplier for daily puzzle completions from consecutive calendar-day streaks.
 * Applies only when `recordCompletion` runs for a daily (`isDaily: true`). Extra XP
 * raises total XP → higher level → faster tier/rank progression on the profile.
 */

/** +6% XP per consecutive daily beyond the first, capped at 2×. */
export function dailyStreakXpMultiplier(dailyStreak: number): number {
  const s = Math.max(0, dailyStreak);
  if (s <= 1) return 1;
  const bonus = Math.min(0.06 * (s - 1), 1);
  return 1 + bonus;
}

/** Human-readable multiplier, e.g. 1.15 → "1.15×". */
export function formatStreakXpMultiplierLabel(mult: number): string {
  if (mult <= 1.001) return "1×";
  const rounded = Math.round(mult * 100) / 100;
  const s = Number.isInteger(rounded) ? `${rounded}` : `${rounded}`.replace(/\.?0+$/, "");
  return `${s}×`;
}
