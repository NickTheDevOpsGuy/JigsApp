/**
 * Header menu item definitions and submenu grouping.
 * Item arrays live in headerMenuItemsNavModes and headerMenuItemsDisplayRest.
 */
export type {
  DebugFlags,
  HeaderMenuProps,
  SubMenuId,
  MenuItemConfig,
} from "./headerMenuConfigTypes";

import type { HeaderMenuProps, MenuItemConfig } from "./headerMenuConfigTypes";
import { getNavControlsModesItems } from "./headerMenuItemsNavModes";
import { getDisplayAudioAdvancedItems } from "./headerMenuItemsDisplayRest";

export function buildMenuItems(
  props: HeaderMenuProps,
  setOpen: (open: boolean) => void,
  navigate: (path: string) => void,
): MenuItemConfig[] {
  const c = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const showTimer = props.timeMode !== "relaxed";

  return [
    ...getNavControlsModesItems(props, c, navigate, showTimer),
    ...getDisplayAudioAdvancedItems(props, c, navigate),
  ];
}
