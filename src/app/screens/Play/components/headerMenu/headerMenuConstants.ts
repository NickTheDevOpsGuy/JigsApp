/**
 * Header menu submenu labels, descriptions, and ordering.
 */
import type { SubMenuId } from "@/screens/Play/components/headerMenu/headerMenuConfigTypes";

export const SUB_MENU_LABELS: Record<SubMenuId, string> = {
  about: "About",
  advanced: "Advanced",
  audio: "Audio",
  assistance: "Assistance",
  contribute: "Get Involved",
  controls: "Gameplay",
  display: "Appearance",
  effects: "Effects",
  gameplay: "Gameplay",
  help: "Help",
  manualControls: "Controls",
  modes: "Modes",
  moves: "Move",
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
  moves: "controls",
};

export const SUBMENU_DESCRIPTIONS: Record<SubMenuId, string> = {
  about: "About Phuzzle and how to get involved",
  advanced: "Clear cache, performance overlay, reset local stats",
  assistance: "Visual hints: alignment grid, edge highlight, ghost hints",
  audio: "Sound effects and haptic feedback",
  contribute: "About Phuzzle and how to get involved",
  controls: "Piece shape, modes, and manual controls",
  display: "Preview, effects, immersive mode, and theme",
  gameplay: "Magnetic Snap, Progressive Reveal, Snap Glow, Unlock Pieces, Undo, Redo",
  help: "How to play and keyboard shortcuts",
  manualControls: "Undo, redo, reset view, zoom",
  modes: "Drift, relaxed, deliberate detach, timer",
  moves: "Undo and redo last moves",
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

/** Root menu: alpha order. Co-op is under Play. */
export const ROOT_MENU_ORDER: import("./headerMenuConfigTypes").RootMenuId[] = [
  "about",
  "leaderboard",
  "play",
  "settings",
];

export const ROOT_MENU_LABELS: Record<
  import("./headerMenuConfigTypes").RootMenuId,
  string
> = {
  about: "About",
  leaderboard: "Leaderboard",
  play: "Play",
  settings: "Settings",
};

/** Settings submenus: alphabetical by visible label (SUB_MENU_LABELS). */
export const SETTINGS_SUBMENU_ORDER: SubMenuId[] = [
  "advanced",
  "display",
  "assistance",
  "audio",
  "gameplay",
  "moves",
];
