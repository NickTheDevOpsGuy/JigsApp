/**
 * Changelog for the in-app What's New popup.
 * Keep this intentionally short; full release history lives in docs/CHANGES.md.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export const CHANGELOG_VERSION = "54";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "Stable board near the finish — the piece tray keeps the same vertical space when the scroll strip hides, so the board doesn’t jump as you place the last pieces.",
      "Consistent phone & tablet widths — play, replay, and the win screen all use the same 600px phone breakpoint; tablets (601–1024px) get a slightly roomier tray under the board.",
      "Mobile replay polish — more room for the board and cleaner control spacing on small screens.",
      "Closing replay stays on your solved board — no surprise jump to another flow; Escape on modals is handled once (no double-dismiss quirks).",
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
