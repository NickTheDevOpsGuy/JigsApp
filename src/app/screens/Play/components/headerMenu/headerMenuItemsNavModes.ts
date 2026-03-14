/**
 * Header menu items: Navigation, Manual Controls, Modes.
 */
import type {
  HeaderMenuProps,
  MenuItemConfig,
} from "@/screens/Play/components/headerMenu/headerMenuConfigTypes";
import { getModeItems } from "@/screens/Play/components/headerMenu/headerMenuItemsNavModesData";

export function getNavControlsModesItems(
  props: HeaderMenuProps,
  c: (fn: () => void) => () => void,
  navigate: (path: string) => void,
  showTimer: boolean,
): MenuItemConfig[] {
  const navAndControlItems: MenuItemConfig[] = [
    {
      id: "home",
      section: "settings",
      visible: true,
      label: "Home",
      sortKey: "Home",
      title: "Return to main menu",
      onClick: c(() => navigate("/")),
      subMenu: "navigation",
    },
    {
      id: "new",
      section: "settings",
      visible: true,
      label: "New puzzle",
      sortKey: "New puzzle",
      title: "Start a fresh puzzle",
      onClick: c(props.onNewPuzzle),
      subMenu: "navigation",
    },
    {
      id: "startOver",
      section: "settings",
      visible: !!props.onStartThisPuzzleOver && !props.isComplete,
      label: "Start over",
      sortKey: "Start over",
      title: "Restart this puzzle from the beginning (same image and difficulty)",
      onClick: c(props.onStartThisPuzzleOver ?? (() => {})),
      subMenu: "navigation",
    },
    {
      id: "undo",
      section: "settings",
      visible: !!props.onUndo,
      label: "Undo",
      sortKey: "Undo",
      title: "Revert last piece placement",
      onClick: c(props.onUndo ?? (() => {})),
      subMenu: "moves",
      disabled: !props.canUndo,
      disabledTitle: !props.canUndo ? "No moves to undo" : undefined,
    },
    {
      id: "redo",
      section: "settings",
      visible: !!props.onRedo,
      label: "Redo",
      sortKey: "Redo",
      title: "Reapply last undone move",
      onClick: c(props.onRedo ?? (() => {})),
      subMenu: "moves",
      disabled: !props.canRedo,
      disabledTitle: !props.canRedo ? "No moves to redo" : undefined,
    },
    {
      id: "resetView",
      section: "settings",
      visible: !!props.onResetView,
      label: "Reset View",
      sortKey: "Reset View",
      title: "Reset zoom and pan to center the board",
      onClick: c(props.onResetView ?? (() => {})),
      subMenu: "manualControls",
    },
    {
      id: "zoomIn",
      section: "settings",
      visible: true,
      label: "Zoom In",
      sortKey: "Zoom In",
      title: "Zoom in on the board",
      onClick: c(props.onZoomIn ?? (() => {})),
      subMenu: "manualControls",
    },
    {
      id: "zoomOut",
      section: "settings",
      visible: true,
      label: "Zoom Out",
      sortKey: "Zoom Out",
      title: "Zoom out to see more of the board",
      onClick: c(props.onZoomOut ?? (() => {})),
      subMenu: "manualControls",
    },
  ];
  return [...navAndControlItems, ...getModeItems(props, c, showTimer)];
}
