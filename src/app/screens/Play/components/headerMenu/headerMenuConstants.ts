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
  moves: "Move behavior",
  navigation: "Navigate",
  pieceShape: "Piece Shape",
  share: "Share",
  stats: "Leaderboard",
  theme: "Theme",
};

export const SUBMENU_PARENT: Partial<Record<SubMenuId, SubMenuId>> = {
  contribute: "about",
  effects: "display",
  assistance: "controls",
  gameplay: "controls",
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
  controls: "Assistance, modes, movement, piece shape, and snapping",
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

/** Root menu: keep this short so play controls do not feel like a debug menu. */
export const ROOT_MENU_ORDER: import("./headerMenuConfigTypes").RootMenuId[] = [
  "resume",
  "newPuzzle",
  "settings",
  "leaderboard",
  "help",
];

export const ROOT_MENU_LABELS: Record<
  import("./headerMenuConfigTypes").RootMenuId,
  string
> = {
  resume: "Resume",
  newPuzzle: "New Puzzle",
  help: "Help",
  leaderboard: "Leaderboard",
  settings: "Settings",
};

/** Submenus nested inside Settings groups rather than shown at Settings root. */
const SETTINGS_SUBMENU_EXCLUDE_FROM_LIST: SubMenuId[] = [
  "navigation",
  "share",
  "stats",
  "assistance",
  "effects",
  "gameplay",
  "manualControls",
  "modes",
  "moves",
  "pieceShape",
];

const SETTINGS_SUBMENU_ORDER: SubMenuId[] = ["controls", "display", "audio", "advanced"];

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
    const ai = SETTINGS_SUBMENU_ORDER.indexOf(a);
    const bi = SETTINGS_SUBMENU_ORDER.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) -
        (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
    }
    const cmp = SUB_MENU_LABELS[a].localeCompare(SUB_MENU_LABELS[b], undefined, {
      sensitivity: "base",
    });
    return cmp !== 0 ? cmp : a.localeCompare(b);
  });
}
