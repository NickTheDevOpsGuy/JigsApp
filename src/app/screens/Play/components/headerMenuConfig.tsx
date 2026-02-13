import type { TimeMode } from "../timeMode";
import { COUNTDOWN_OPTIONS } from "../timeMode";

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

export type HeaderMenuProps = {
  title?: string;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  timeMode: TimeMode;
  setTimeMode: (m: TimeMode | ((prev: TimeMode) => TimeMode)) => void;
  countdownMinutes: number;
  setCountdownMinutes: (n: number | ((prev: number) => number)) => void;
  showPreview: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  pieceLockingEnabled: boolean;
  showGhostHint: boolean;
  isFullscreen: boolean;
  canShowHaptics: boolean;
  canShowFullscreen: boolean;
  canShowShortcuts: boolean;
  canShowDebug: boolean;
  debug: DebugFlags;
  onNewPuzzle: () => void;
  onTogglePreview: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onTogglePieceLocking: () => void;
  onToggleGhostHint: () => void;
  onToggleFullscreen: () => void;
  onShowShortcuts: () => void;
  onShowHowToPlay: () => void;
  onShowHelpChoice: () => void;
  onToggleDebug: () => void;
};

export type SubMenuId = "game" | "view" | "audio";

export type MenuItemConfig = {
  id: string;
  label: string;
  section: "nav" | "settings" | "help" | "other";
  visible: boolean;
  disabled?: boolean;
  onClick: () => void;
  isTheme?: boolean;
  sortKey?: string;
  /** When set, item appears in this sub-menu instead of top-level settings */
  subMenu?: SubMenuId;
};

const TIME_MODE_LABELS: Record<TimeMode, string> = {
  elapsed: "Elapsed",
  countdown: "Countdown",
  active: "Active only",
  relaxed: "Relaxed (no timer)",
  best: "Best time",
};

export function buildMenuItems(
  props: HeaderMenuProps,
  setOpen: (open: boolean) => void,
  navigate: (path: string) => void,
): MenuItemConfig[] {
  const c = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return [
    {
      id: "home",
      section: "nav",
      visible: true,
      label: "Home",
      onClick: c(() => navigate("/")),
    },
    {
      id: "new",
      section: "nav",
      visible: true,
      label: "New puzzle",
      onClick: c(props.onNewPuzzle),
    },
    {
      id: "undo",
      section: "nav",
      visible: true,
      label: "Undo",
      disabled: !props.canUndo,
      onClick: c(props.onUndo),
    },
    {
      id: "redo",
      section: "nav",
      visible: true,
      label: "Redo",
      disabled: !props.canRedo,
      onClick: c(props.onRedo),
    },
    {
      id: "debug",
      section: "settings",
      visible: props.canShowDebug,
      label: "Debug overlay",
      sortKey: "Debug overlay",
      onClick: c(props.onToggleDebug),
      /* No subMenu - stays at top level */
    },
    {
      id: "fullscreen",
      section: "settings",
      visible: props.canShowFullscreen,
      label: props.isFullscreen ? "Exit fullscreen" : "Fullscreen",
      sortKey: "Fullscreen",
      onClick: c(props.onToggleFullscreen),
      subMenu: "view",
    },
    {
      id: "timeMode",
      section: "settings",
      visible: true,
      label: `Time: ${TIME_MODE_LABELS[props.timeMode]} (tap to change)`,
      sortKey: "Time",
      onClick: c(() => {
        const order: TimeMode[] = ["elapsed", "countdown", "active", "relaxed", "best"];
        props.setTimeMode(order[(order.indexOf(props.timeMode) + 1) % order.length]);
      }),
      subMenu: "game",
    },
    {
      id: "countdownMinutes",
      section: "settings",
      visible: props.timeMode === "countdown",
      label: `Countdown: ${props.countdownMinutes} min`,
      sortKey: "Countdown",
      onClick: c(() => {
        const idx = COUNTDOWN_OPTIONS.indexOf(
          props.countdownMinutes as (typeof COUNTDOWN_OPTIONS)[number],
        );
        const i = idx >= 0 ? idx : 0;
        props.setCountdownMinutes(COUNTDOWN_OPTIONS[(i + 1) % COUNTDOWN_OPTIONS.length]);
      }),
      subMenu: "game",
    },
    {
      id: "ghost",
      section: "settings",
      visible: true,
      label: props.showGhostHint ? "Ghost hint: on" : "Ghost hint: off",
      sortKey: "Ghost hint",
      onClick: c(props.onToggleGhostHint),
      subMenu: "game",
    },
    {
      id: "haptics",
      section: "settings",
      visible: props.canShowHaptics,
      label: props.hapticsEnabled ? "Haptics: on" : "Haptics: off",
      sortKey: "Haptics",
      onClick: c(props.onToggleHaptics),
      subMenu: "audio",
    },
    {
      id: "theme",
      section: "settings",
      visible: true,
      label: "",
      sortKey: "Theme",
      onClick: () => setOpen(false),
      isTheme: true,
      subMenu: "view",
    },
    {
      id: "lock",
      section: "settings",
      visible: true,
      label: props.pieceLockingEnabled ? "Lock pieces: on" : "Lock pieces: off",
      sortKey: "Lock pieces",
      onClick: c(props.onTogglePieceLocking),
      subMenu: "game",
    },
    {
      id: "preview",
      section: "settings",
      visible: true,
      label: props.showPreview ? "Hide preview" : "Show preview",
      sortKey: "Show preview",
      onClick: c(props.onTogglePreview),
      subMenu: "view",
    },
    {
      id: "sound",
      section: "settings",
      visible: true,
      label: props.soundEnabled ? "Sound: on" : "Sound: off",
      sortKey: "Sound",
      onClick: c(props.onToggleSound),
      subMenu: "audio",
    },
  ];
}
