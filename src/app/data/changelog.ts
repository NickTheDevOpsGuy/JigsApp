/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
export const CHANGELOG_VERSION = "4";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "📥 Piece drawer – Taller tray, compact mode for 25+ pieces, sticky filters, scroll snapping",
      "🖐 Touch fixes – Single piece per touch (no multi-drag), reliable tap-to-rotate on mobile",
      "🖼 Image validation – Grid-based resolution rules; friendly errors for corrupted images",
      "📈 Milestone progress – Based on correctly placed pieces (undo/redo safe)",
      "❓ Help menu – Pick How to Play or Keyboard & Controls; smaller text on mobile",
      "⏱ Time modes – Elapsed, countdown, active-only, relaxed, best time",
      "📊 Stats & Leaderboards – Daily puzzle, streaks, achievements (Supabase)",
      "↩️ Undo / Redo · 👻 Ghost hint · 🔒 Lock pieces",
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
