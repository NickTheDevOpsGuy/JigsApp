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
  showPieceBorders: boolean;
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
  onTogglePieceBorders: () => void;
  onToggleFullscreen: () => void;
  onShowShortcuts: () => void;
  onShowHowToPlay: () => void;
  onShowHelpChoice: () => void;
  onToggleDebug: () => void;
  onShowWhatsNew: () => void;
  onShareApp: () => void;
};

export type SubMenuId = "control" | "game" | "view" | "audio" | "help" | "community" | "navigate";

export type MenuItemConfig = {
  id: string;
  label: string;
  section: "nav" | "settings" | "help" | "about" | "community";
  visible: boolean;
  disabled?: boolean;
  onClick: () => void;
  isTheme?: boolean;
  sortKey?: string;
  /** When set, item appears in this sub-menu instead of top-level settings */
  subMenu?: SubMenuId;
};

const GITHUB_URL = "https://github.com/NickTheDevOpsGuy/phuzzle";
const CONTRIBUTORS_URL =
  "https://github.com/NickTheDevOpsGuy/phuzzle/blob/develop/CONTRIBUTORS.md";

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
      section: "settings",
      visible: true,
      label: "Home",
      sortKey: "Home",
      onClick: c(() => navigate("/")),
      subMenu: "navigate",
    },
    {
      id: "new",
      section: "settings",
      visible: true,
      label: "New puzzle",
      sortKey: "New puzzle",
      onClick: c(props.onNewPuzzle),
      subMenu: "navigate",
    },
    {
      id: "undo",
      section: "settings",
      visible: true,
      label: "Undo",
      disabled: !props.canUndo,
      sortKey: "Undo",
      onClick: c(props.onUndo),
      subMenu: "control",
    },
    {
      id: "redo",
      section: "settings",
      visible: true,
      label: "Redo",
      disabled: !props.canRedo,
      sortKey: "Redo",
      onClick: c(props.onRedo),
      subMenu: "control",
    },
    {
      id: "help",
      section: "settings",
      visible: true,
      label: "Help",
      sortKey: "Help",
      onClick: c(props.onShowHelpChoice),
      subMenu: "help",
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
      id: "pieceBorders",
      section: "settings",
      visible: true,
      label: props.showPieceBorders ? "Piece borders: on" : "Piece borders: off",
      sortKey: "Piece borders",
      onClick: c(props.onTogglePieceBorders),
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
    {
      id: "whatsNew",
      section: "settings",
      visible: true,
      label: "What's New",
      sortKey: "What's New",
      onClick: c(props.onShowWhatsNew),
      subMenu: "community",
    },
    {
      id: "shareApp",
      section: "settings",
      visible: true,
      label: "Share",
      sortKey: "Share",
      onClick: c(props.onShareApp),
      subMenu: "community",
    },
    {
      id: "github",
      section: "settings",
      visible: true,
      label: "GitHub",
      sortKey: "GitHub",
      onClick: c(() => {
        if (typeof window !== "undefined") window.open(GITHUB_URL, "_blank", "noopener");
      }),
      subMenu: "community",
    },
    {
      id: "contributors",
      section: "settings",
      visible: true,
      label: "Contributors",
      sortKey: "Contributors",
      onClick: c(() => {
        if (typeof window !== "undefined")
          window.open(CONTRIBUTORS_URL, "_blank", "noopener");
      }),
      subMenu: "community",
    },
  ];
}
