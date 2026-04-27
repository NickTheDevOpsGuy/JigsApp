/**
 * Changelog for the in-app What's New popup.
 * Keep this intentionally short; full release history lives in docs/CHANGES.md.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export const CHANGELOG_VERSION = "59";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "Fresh players now get a fast 3×3 starter puzzle so the first win lands immediately.",
      "Challenge links show a beat-this target in play and call out wins or runbacks after completion.",
      "Daily Puzzle now has a recent archive, richer daily results, and streak-aware share text.",
      "Mobile, iPad, leaderboard, tray, replay, completion, and warm-cache loading got another polish pass.",
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
