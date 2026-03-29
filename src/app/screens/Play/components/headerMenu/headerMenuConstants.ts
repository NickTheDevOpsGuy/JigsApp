/**
 * Header menu submenu labels, descriptions, and ordering.
 */
import type {
  MenuItemConfig,
  SubMenuId,
} from "@/screens/Play/components/headerMenu/headerMenuConfigTypes";

export const SUB_MENU_LABELS: Record<SubMenuId, string> = {
  about: "About",
  advanced: "Advanced",
  audio: "Audio",
  assistance: "Assistance",
  contribute: "Get Involved",
  controls: "Gameplay",
  display: "Appearance",
  effects: "Effects",
  gameplay: "Snapping",
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
  assistance: "Visual hints: alignment grid, edge highlight, cluster outlines",
  audio: "Sound effects and haptic feedback",
  contribute: "About Phuzzle and how to get involved",
  controls: "Piece shape, modes, and manual controls",
  display: "Preview, effects, immersive mode, and theme",
  gameplay: "Magnetic snap, snap glow, progressive reveal, unlock pieces",
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

/** Submenus that belong in the Play panel, not the Settings submenu list. */
const SETTINGS_SUBMENU_EXCLUDE_FROM_LIST: SubMenuId[] = ["navigation", "share"];

/** All settings-area submenus that have at least one item, sorted A–Z by visible label. */
export function getSettingsSubmenuIdsAlphabetical(
  settingsItems: MenuItemConfig[],
): SubMenuId[] {
  const ids = new Set<SubMenuId>();
  for (const item of settingsItems) {
    if (!item.subMenu) continue;
    if (SETTINGS_SUBMENU_EXCLUDE_FROM_LIST.includes(item.subMenu)) continue;
    ids.add(item.subMenu);
  }
  return Array.from(ids).sort((a, b) => {
    const cmp = SUB_MENU_LABELS[a].localeCompare(SUB_MENU_LABELS[b], undefined, {
      sensitivity: "base",
    });
    return cmp !== 0 ? cmp : a.localeCompare(b);
  });
}
