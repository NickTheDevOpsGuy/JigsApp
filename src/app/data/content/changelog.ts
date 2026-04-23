/**
 * Changelog for the in-app What's New popup.
 * Keep this intentionally short; full release history lives in docs/CHANGES.md.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export const CHANGELOG_VERSION = "58";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "Desktop home, packs, and stats now use roomier shells instead of cramped phone-width cards.",
      "Leaderboard rows and filter controls scale more cleanly on large screens and iPad-sized layouts.",
      "Pack browsing is more tablet-friendly — the featured hero compacts better and detail rails breathe on wider screens.",
      "Touch tray upgrades remain in, and replay still returns cleanly to your completed puzzle.",
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
