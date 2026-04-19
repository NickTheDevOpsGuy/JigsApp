/**
 * Changelog for the in-app What's New popup.
 * Keep this intentionally short; full release history lives in docs/CHANGES.md.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export const CHANGELOG_VERSION = "56";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "Tablet landscape play feels more intentional — the board and tray now compose better side by side instead of feeling like a stretched phone layout.",
      "Touch tray upgrades — quick filters and hold-to-preview make it easier to find and inspect pieces on phones and tablets.",
      "Rotate confidence is stronger — tablet portrait, tablet landscape, and replay flows now have better viewport coverage and fewer clipping risks.",
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
