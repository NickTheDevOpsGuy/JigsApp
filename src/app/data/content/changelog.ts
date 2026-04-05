/**
 * Changelog for the in-app What's New popup.
 * Keep this intentionally short; full release history lives in docs/CHANGES.md.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export const CHANGELOG_VERSION = "53";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "Mobile completion & replay fit – Short-phone win screens stay fully on-screen, replay controls are tighter on mobile, the replay cutout covers the full board, and closing replay no longer lets results flash back unexpectedly.",
      "Completion dialog guardrails – Board-anchored win dialogs keep the action row in view on desktop, and shared modals now respect locked Escape behavior through both dialog and backdrop handlers.",
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
