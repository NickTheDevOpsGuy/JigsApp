/**
 * Changelog for the in-app What's New popup.
 * Keep this intentionally short; full release history lives in docs/CHANGES.md.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export const CHANGELOG_VERSION = "57";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "Stats and leaderboard screens scale better on larger devices — desktop gets a roomier card, stronger row spacing, and a cleaner control layout.",
      "iPad and tablet stats polish — leaderboard controls wrap more gracefully and keep the board view readable without feeling squeezed.",
      "Touch tray upgrades remain in — quick filters and hold-to-preview make it easier to find and inspect pieces on phones and tablets.",
      "Replay still returns cleanly to your completed puzzle — no surprise jump to another flow.",
    ],
  },
];

export function getLastSeenVersion(): string {
  return safeLocalStorage.getItem(STORAGE_KEY) ?? "0";
}

export function markChangelogSeen(): void {
  safeLocalStorage.setItem(STORAGE_KEY, CHANGELOG_VERSION);
}

export function shouldShowChangelog(): boolean {
  return getLastSeenVersion() !== CHANGELOG_VERSION;
}
