/**
 * Header menu item definitions and submenu grouping.
 * buildMenuItems produces the flat list; HeaderMenu groups by subMenu for display.
 */
import type { TimeMode } from "../timeMode";
import { COUNTDOWN_OPTIONS } from "../timeMode";

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
  showPerfOverlay: boolean;
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
  showGhostWhenIdle: boolean;
  showEdgeHighlight: boolean;
  showAlignmentGrid: boolean;
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
  onToggleGhostWhenIdle: () => void;
  onToggleEdgeHighlight: () => void;
  onToggleAlignmentGrid: () => void;
  onToggleFullscreen: () => void;
  onCenterBoard: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShowShortcuts: () => void;
  onShowHowToPlay: () => void;
  onShowHelpChoice: () => void;
  onShowAbout?: () => void;
  onToggleDebug: () => void;
  onTogglePerfOverlay: () => void;
  immersiveMode: boolean;
  onToggleImmersiveMode: () => void;
  onSharePuzzle?: () => void | Promise<void>;
};

export type SubMenuId =
  | "about"
  | "audio"
  | "board"
  | "controls"
  | "display"
  | "game"
  | "help"
  | "navigation"
  | "share"
  | "stats"
  | "view";

export type MenuItemConfig = {
  id: string;
  label: string;
  section: "nav" | "settings" | "help" | "about" | "other";
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

const GITHUB_REPO_URL = "https://github.com/NickTheDevOpsGuy/phuzzle";
const GITHUB_CONTRIBUTORS_URL =
  "https://github.com/NickTheDevOpsGuy/phuzzle/blob/develop/CONTRIBUTORS.md";

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
      subMenu: "navigation",
    },
    {
      id: "new",
      section: "settings",
      visible: true,
      label: "New puzzle",
      sortKey: "New puzzle",
      onClick: c(props.onNewPuzzle),
      subMenu: "navigation",
    },
    {
      id: "undo",
      section: "settings",
      visible: true,
      label: "Undo",
      sortKey: "Undo",
      disabled: !props.canUndo,
      onClick: c(props.onUndo),
      subMenu: "controls",
    },
    {
      id: "redo",
      section: "settings",
      visible: true,
      label: "Redo",
      sortKey: "Redo",
      disabled: !props.canRedo,
      onClick: c(props.onRedo),
      subMenu: "controls",
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
      id: "perfOverlay",
      section: "settings",
      visible: props.canShowDebug,
      label: props.debug.showPerfOverlay ? "Hide perf overlay" : "Perf overlay",
      sortKey: "Perf overlay",
      onClick: c(props.onTogglePerfOverlay),
    },
    {
      id: "fullscreen",
      section: "settings",
      visible: props.canShowFullscreen,
      label: props.isFullscreen ? "Exit fullscreen" : "Fullscreen",
      sortKey: "1 Fullscreen",
      onClick: c(props.onToggleFullscreen),
      subMenu: "display",
    },
    {
      id: "preview",
      section: "settings",
      visible: true,
      label: props.showPreview ? "Hide preview" : "Show preview",
      sortKey: "2 Show preview",
      onClick: c(props.onTogglePreview),
      subMenu: "display",
    },
    {
      id: "theme",
      section: "settings",
      visible: true,
      label: "",
      sortKey: "3 Theme",
      onClick: () => setOpen(false),
      isTheme: true,
      subMenu: "display",
    },
    {
      id: "immersiveMode",
      section: "settings",
      visible: true,
      label: props.immersiveMode ? "Immersive mode: on" : "Immersive mode: off",
      sortKey: "0 Immersive",
      onClick: c(props.onToggleImmersiveMode),
      subMenu: "view",
    },
    {
      id: "alignmentGrid",
      section: "settings",
      visible: true,
      label: props.showAlignmentGrid ? "Alignment grid: on" : "Alignment grid: off",
      sortKey: "1 Alignment grid",
      onClick: c(props.onToggleAlignmentGrid),
      subMenu: "view",
    },
    {
      id: "centerBoard",
      section: "settings",
      visible: true,
      label: "Center board",
      sortKey: "1 Center board",
      onClick: c(props.onCenterBoard),
      subMenu: "board",
    },
    {
      id: "zoomIn",
      section: "settings",
      visible: true,
      label: "Zoom in",
      sortKey: "2 Zoom in",
      onClick: c(props.onZoomIn),
      subMenu: "board",
    },
    {
      id: "zoomOut",
      section: "settings",
      visible: true,
      label: "Zoom out",
      sortKey: "3 Zoom out",
      onClick: c(props.onZoomOut),
      subMenu: "board",
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
      id: "ghostWhenIdle",
      section: "settings",
      visible: true,
      label: props.showGhostWhenIdle ? "Ghost when idle: on" : "Ghost when idle: off",
      sortKey: "Ghost when idle",
      onClick: c(props.onToggleGhostWhenIdle),
      subMenu: "view",
    },
    {
      id: "edgeHighlight",
      section: "settings",
      visible: true,
      label: props.showEdgeHighlight ? "Edge highlight: on" : "Edge highlight: off",
      sortKey: "2 Edge highlight",
      onClick: c(props.onToggleEdgeHighlight),
      subMenu: "view",
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
      id: "lock",
      section: "settings",
      visible: true,
      label: props.pieceLockingEnabled ? "Lock pieces: on" : "Lock pieces: off",
      sortKey: "Lock pieces",
      onClick: c(props.onTogglePieceLocking),
      subMenu: "game",
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
      id: "share",
      section: "settings",
      visible: !!props.onSharePuzzle,
      label: "Play with friend?",
      sortKey: "Share",
      onClick: c(props.onSharePuzzle ?? (() => {})),
      subMenu: "share",
    },
    {
      id: "stats",
      section: "settings",
      visible: true,
      label: "Leaderboards",
      sortKey: "Stats",
      onClick: c(() => navigate("/stats")),
      subMenu: "stats",
    },
    {
      id: "repo",
      section: "about",
      visible: true,
      label: "Get Involved",
      sortKey: "Get Involved",
      onClick: c(() => window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer")),
      subMenu: "about",
    },
    {
      id: "contributors",
      section: "about",
      visible: true,
      label: "Meet the Team",
      sortKey: "Meet the Team",
      onClick: c(() =>
        window.open(GITHUB_CONTRIBUTORS_URL, "_blank", "noopener,noreferrer"),
      ),
      subMenu: "about",
    },
    {
      id: "howToPlay",
      section: "help",
      visible: true,
      label: "How to Play",
      sortKey: "How to Play",
      onClick: c(props.onShowHowToPlay),
      subMenu: "help",
    },
    {
      id: "shortcuts",
      section: "help",
      visible: true,
      label: "Keyboard & Controls",
      sortKey: "Keyboard & Controls",
      onClick: c(props.onShowShortcuts),
      subMenu: "help",
    },
  ];
}
