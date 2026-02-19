/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
export const CHANGELOG_VERSION = "9";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "🎉 Border complete celebration – Subtle confetti and toast when you finish the puzzle border (mid-game motivation)",
      "🧠 Challenge mode – Optional game mode (Menu → Gameplay): full image shown for 5 seconds at start, then solve from memory",
      "🏆 Leaderboard redesign – Today's Daily Puzzle card with mascot, Start Puzzle button, Today/Week/Month filter pills",
      "🏠 Leaderboard on home – Quick access to leaderboards from the main menu",
      "⏱️ Time Attack – Bonus points for fast placements, combo multiplier, score-based leaderboard",
      "🔥 Daily streak milestones – Special confetti for 3-day and 7-day streaks, raccoon name flair on leaderboards",
      "✂️ Crop & position – Zoom, pan, and crop images before generating puzzles (Setup → Crop & position)",
      "▶️ Puzzle replay – Record placement sequence, scrub through build, shareable animation",
      "🧩 Custom piece clusters – Select multiple tray pieces, create clusters, drag clusters onto the board together",
      "🦝 Customizable raccoon avatars – Hats, glasses, hoodie colors (unlock via achievements)",
      "🎃 Limited-time puzzle events – Seasonal events (Halloween, Winter) with event banners and leaderboards",
      "👁️ Ghost image – Optional faint completed puzzle behind board (Settings → View). Auto-disabled in daily/Time Attack",
      "🏅 Multi-tier achievements – 10, 50, 100 puzzles; Speed Runner (5 under 5 min)",
      "🧩 Edge & corner pieces – Full image content now visible on straight edges (no cropping)",
      "❄️ Streak freeze – One per week; protect your daily streak if you miss a day",
      "🔍 Zoom & pan – Animated zoom transitions, persistent per grid size, soft board clamp",
      "👻 Ghost when idle – Faint ghost overlay after a few seconds of inactivity",
      "🔲 Edge piece highlight – Optional faint border on edge pieces",
      "🎯 Near-snap nudge – Gentle nudge when pieces are very close but not quite snapping",
      "🏆 Dynamic completion badges – Speed Demon, Chill Mode, Precision Pro, and more",
      "📊 Stats & Leaderboards – Daily, Time Attack, streaks, achievements (Supabase)",
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
