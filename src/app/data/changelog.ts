/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
export const CHANGELOG_VERSION = "3";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "Leaderboards & Stats Overhaul",
    items: [
      "🏆 Multiple leaderboards – Today's daily, weekly, monthly, all-time best, streaks, most completions",
      "📅 Historical daily – Pick any past date to see that day's leaderboard",
      "👤 Display names – Set a nickname for leaderboards (optional)",
      "👑 Podium – Top 3 get special treatment with crown for #1",
      "✨ You highlight – Your row is highlighted, with a 'You' badge",
      "📊 Your rank – See today's rank and seconds behind the player above you",
      "📈 Completion history – 30-day chart of your puzzle times",
      "🔄 Refresh – Pull latest leaderboard data anytime",
      "📐 All-time by grid – Filter best times by 3×3, 4×4, 5×5, 6×6",
    ],
  },
  {
    title: "Previously",
    items: [
      "📸 Camera capture – Take a photo directly for your puzzle",
      "📊 Stats & Achievements – Track progress, compete on leaderboards",
      "📅 Daily puzzle – Same puzzle for everyone, streak tracking",
      "⏱ Time modes – Elapsed, countdown, active-only, relaxed, best time",
      "🌙 Dark mode – Easy on the eyes",
      "↩️ Undo – Reverse accidental moves",
      "👻 Ghost hint – See where pieces belong when stuck",
    ],
  },
];

export function getLastSeenVersion(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "0";
  } catch {
    return "0";
  }
}

export function markChangelogSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, CHANGELOG_VERSION);
  } catch {
    // ignore
  }
}

export function shouldShowChangelog(): boolean {
  return getLastSeenVersion() !== CHANGELOG_VERSION;
}
