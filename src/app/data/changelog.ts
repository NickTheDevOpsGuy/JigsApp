/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
export const CHANGELOG_VERSION = "3";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "📱 Two-finger pinch zoom – Zoom and pan on mobile (iOS & Android) now works reliably",
      "📸 Camera capture – Take a photo directly for your puzzle",
      "📰 What's New popup – Stay updated on the latest features",
      "📊 Stats & Achievements – Track progress, compete on leaderboards",
      "📅 Daily puzzle – Same puzzle for everyone, streak tracking",
      "⏱ Time modes – Elapsed, countdown, active-only, relaxed, best time",
      "🌙 Dark mode – Easy on the eyes",
      "↩️ Undo – Reverse accidental moves",
      "↪️ Redo – Re-apply undone moves (Ctrl+Shift+Z / ⌘⇧Z)",
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
