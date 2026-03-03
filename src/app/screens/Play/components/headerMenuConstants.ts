/**
 * Header menu submenu labels, descriptions, and ordering.
 */
import type { SubMenuId } from "./headerMenuConfigTypes";

export const SUB_MENU_LABELS: Record<SubMenuId, string> = {
  about: "About",
  advanced: "System",
  audio: "Audio",
  assistance: "Assistance",
  contribute: "About",
  controls: "Gameplay",
  display: "Appearance",
  effects: "Effects",
  gameplay: "Gameplay",
  help: "Help",
  manualControls: "Controls",
  modes: "Modes",
  navigation: "Navigate",
  pieceShape: "Piece Shape",
  share: "Share",
  stats: "Leaderboard",
  theme: "Theme",
};

export const SUBMENU_PARENT: Partial<Record<SubMenuId, SubMenuId>> = {
  contribute: "about",
  effects: "display",
  help: "about",
  manualControls: "controls",
  modes: "controls",
  pieceShape: "controls",
};

export const SUBMENU_DESCRIPTIONS: Record<SubMenuId, string> = {
  about: "About Phuzzle and how to get involved",
  advanced: "Cache, performance overlay, reset stats",
  assistance: "Visual hints: alignment grid, edge highlight, ghost hints",
  audio: "Sound effects and haptic feedback",
  contribute: "About Phuzzle and how to get involved",
  controls: "Piece shape, modes, and manual controls",
  display: "Preview, effects, immersive mode, and theme",
  gameplay: "Piece shape, modes, and manual controls",
  help: "How to play and keyboard shortcuts",
  manualControls: "Undo, redo, reset view, zoom",
  modes: "Drift, relaxed, deliberate detach, timer",
  navigation: "Home and new puzzle",
  pieceShape: "Applies to next puzzle",
  share: "Play with a friend (co-op)",
  stats: "View leaderboards",
  theme: "Change color theme",
  effects: "Fog, night, or sepia visual effects",
};

export function getSubmenuDescription(id: SubMenuId): string {
  return SUBMENU_DESCRIPTIONS[id] ?? SUB_MENU_LABELS[id];
}

/** Settings submenus in alphabetical order by label (Appearance, Assistance, Audio, …). */
export const SETTINGS_SUBMENU_ORDER: SubMenuId[] = [
  "display", // Appearance
  "assistance", // Assistance
  "audio", // Audio
  "controls", // Gameplay
  "stats", // Leaderboard
  "navigation", // Navigate
  "share", // Share
  "advanced", // System
];
