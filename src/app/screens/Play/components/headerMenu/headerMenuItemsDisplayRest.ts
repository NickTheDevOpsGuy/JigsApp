/**
 * Header menu items: Display, Effects, Assistance, Piece Shape, Audio, Advanced, Stats, Share, About, Help.
 * Composes headerMenuItemsDisplay and headerMenuItemsRest.
 */
import type {
  HeaderMenuProps,
  MenuItemConfig,
} from "@/screens/Play/components/headerMenu/headerMenuConfigTypes";
import { getDisplayItems } from "@/screens/Play/components/headerMenu/headerMenuItemsDisplay";
import { getRestItems } from "@/screens/Play/components/headerMenu/headerMenuItemsRest";

export function getDisplayAudioAdvancedItems(
  props: HeaderMenuProps,
  c: (fn: () => void) => () => void,
  navigate: (path: string) => void,
): MenuItemConfig[] {
  return [...getDisplayItems(props, c), ...getRestItems(props, c, navigate)];
}
