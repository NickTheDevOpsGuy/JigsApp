/**
 * Header menu item definitions and submenu grouping.
 * Item arrays live in headerMenuItemsNavModes and headerMenuItemsDisplayRest.
 */
export type {
  DebugFlags,
  HeaderMenuProps,
  SubMenuId,
  RootMenuId,
  MenuItemConfig,
} from "@/screens/Play/components/headerMenu/headerMenuConfigTypes";

import type {
  HeaderMenuProps,
  MenuItemConfig,
} from "@/screens/Play/components/headerMenu/headerMenuConfigTypes";
import { getNavControlsModesItems } from "@/screens/Play/components/headerMenu/headerMenuItemsNavModes";
import { getDisplayAudioAdvancedItems } from "@/screens/Play/components/headerMenu/headerMenuItemsDisplayRest";

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
