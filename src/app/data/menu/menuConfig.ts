/**
 * menuConfig – hierarchical menu structure.
 * Used by MenuScreen (home) and HeaderMenu (in-play hamburger).
 * Types and TIME_MODE_LABELS in menuConfigConstants.ts.
 * Tree sections in menuConfigPlay.ts, menuConfigAppearance.ts, menuConfigRest.ts.
 */
import { getPlayMenuNodes } from "./menuConfigPlay";
import { getAppearanceMenuNodes } from "./menuConfigAppearance";
import { getRestMenuNodes } from "./menuConfigRest";
import type { MenuNode } from "./menuConfigConstants";

export type { MenuNode } from "./menuConfigConstants";

/** Root menu tree. Some leaves are placeholders for future features. */
export function getMenuTree(): MenuNode[] {
  return [...getPlayMenuNodes(), ...getAppearanceMenuNodes(), ...getRestMenuNodes()];
}
