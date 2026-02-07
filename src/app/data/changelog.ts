/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
export const CHANGELOG_VERSION = "3";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "📸 Take Photo – Use your camera to capture an image for your puzzle (menu or New Puzzle)",
      "📊 Leaderboard dropdown – Choose to view Today's Daily, 3×3, 4×4, 5×5, or 6×6 leaderboards",
      "🏆 Achievements – Unlock achievements and track your progress (Stats tab)",
      "🌅 Themes with sounds – Pick a theme (☀️ light, 🌙 dark, 🚀 space, 🌊 ocean, 🌲 forest, 🌅 sunset) with theme-specific sound effects",
      "📅 Daily puzzle – Pick difficulty (🌱 Easy 3×3, 🌿 Medium 4×4, 🌳 Hard 5×5, ⛰️ Expert 6×6) before starting",
      "🧩 Puzzle difficulty – Same emoji choices when creating custom puzzles (🌱🌿🌳⛰️🔧 Custom)",
      "🔧 Advanced mode – Custom rows & columns (2–12) for your own grid size",
      "❓ Help dropdown – How to Play and Keyboard shortcuts in one place (first-timers & review)",
      "⌨️ Keyboard controls – Undo (Ctrl+Z), rotate (R), preview (P), ghost hint (G), arrows to nudge, Tab to cycle pieces, ? for shortcuts",
      "⏱ Time modes – Elapsed, countdown, active-only, relaxed, best time",
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
