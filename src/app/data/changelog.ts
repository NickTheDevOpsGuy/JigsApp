/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
export const CHANGELOG_VERSION = "4";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "Latest",
    items: [
      "🛡️ Error boundary – Friendly error screen with reload instead of a blank screen",
      "♿ Reduced motion – Respects prefers-reduced-motion (e.g. no confetti when set)",
      "📋 Completion summary – Time, grid size, and piece count on finish",
      "📊 Difficulty indicator – Piece count and Easy/Medium/Hard/Expert shown before you start",
      "📈 Analytics – Exit before completion and time to first snap (when PostHog is enabled)",
      "⌨️ Focus indicators – Visible keyboard focus so navigation works without a mouse",
      "📂 What's New & Share – Moved into the in-game Menu (hamburger) so the main menu is less busy",
    ],
  },
  {
    title: "Previously",
    items: [
      "📱 Two-finger pinch zoom – Zoom and pan on mobile (iOS & Android)",
      "📸 Camera capture – Take a photo directly for your puzzle",
      "📊 Stats & Achievements – Track progress, compete on leaderboards",
      "📅 Daily puzzle – Same puzzle for everyone, streak tracking",
      "⏱ Time modes – Elapsed, countdown, active-only, relaxed, best time",
      "🌙 Dark mode – Easy on the eyes",
      "↩️ Undo & Redo – Reverse or re-apply moves (keyboard shortcuts supported)",
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
