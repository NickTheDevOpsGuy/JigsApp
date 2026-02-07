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
  onTodayPuzzle?: () => void;
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
  onToggleDebug: () => void;
};

export type MenuItemConfig = {
  id: string;
  label: string;
  section: "nav" | "settings" | "help" | "other";
  visible: boolean;
  disabled?: boolean;
  onClick: () => void;
  isTheme?: boolean;
  sortKey?: string;
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
  const closeAnd = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return [
    {
      id: "home",
      section: "nav",
      visible: true,
      label: "Home",
      onClick: closeAnd(() => navigate("/")),
    },
    {
      id: "today",
      section: "nav",
      visible: !!props.onTodayPuzzle,
      label: "Today's puzzle",
      onClick: closeAnd(props.onTodayPuzzle!),
    },
    {
      id: "new",
      section: "nav",
      visible: true,
      label: "New puzzle",
      onClick: closeAnd(props.onNewPuzzle),
    },
    {
      id: "undo",
      section: "nav",
      visible: true,
      label: "Undo",
      disabled: !props.canUndo,
      onClick: closeAnd(props.onUndo),
    },
    {
      id: "debug",
      section: "settings",
      visible: props.canShowDebug,
      label: "Debug overlay",
      sortKey: "Debug overlay",
      onClick: closeAnd(props.onToggleDebug),
    },
    {
      id: "fullscreen",
      section: "settings",
      visible: props.canShowFullscreen,
      label: props.isFullscreen ? "Exit fullscreen" : "Fullscreen",
      sortKey: "Fullscreen",
      onClick: closeAnd(props.onToggleFullscreen),
    },
    {
      id: "timeMode",
      section: "settings",
      visible: true,
      label: `Time: ${TIME_MODE_LABELS[props.timeMode]} (tap to change)`,
      sortKey: "Time",
      onClick: closeAnd(() => {
        const order: TimeMode[] = ["elapsed", "countdown", "active", "relaxed", "best"];
        props.setTimeMode(order[(order.indexOf(props.timeMode) + 1) % order.length]);
      }),
    },
    {
      id: "countdownMinutes",
      section: "settings",
      visible: props.timeMode === "countdown",
      label: `Countdown: ${props.countdownMinutes} min`,
      sortKey: "Countdown",
      onClick: closeAnd(() => {
        const idx = COUNTDOWN_OPTIONS.indexOf(
          props.countdownMinutes as (typeof COUNTDOWN_OPTIONS)[number],
        );
        const i = idx >= 0 ? idx : 0;
        props.setCountdownMinutes(COUNTDOWN_OPTIONS[(i + 1) % COUNTDOWN_OPTIONS.length]);
      }),
    },
    {
      id: "ghost",
      section: "settings",
      visible: true,
      label: props.showGhostHint ? "Ghost hint: on" : "Ghost hint: off",
      sortKey: "Ghost hint",
      onClick: closeAnd(props.onToggleGhostHint),
    },
    {
      id: "haptics",
      section: "settings",
      visible: props.canShowHaptics,
      label: props.hapticsEnabled ? "Haptics: on" : "Haptics: off",
      sortKey: "Haptics",
      onClick: closeAnd(props.onToggleHaptics),
    },
    {
      id: "howto",
      section: "help",
      visible: true,
      label: "How to Play",
      onClick: closeAnd(props.onShowHowToPlay),
    },
    {
      id: "shortcuts",
      section: "help",
      visible: props.canShowShortcuts,
      label: "Keyboard shortcuts",
      onClick: closeAnd(props.onShowShortcuts),
    },
    {
      id: "theme",
      section: "settings",
      visible: true,
      label: "",
      sortKey: "Dark mode",
      onClick: () => setOpen(false),
      isTheme: true,
    },
    {
      id: "lock",
      section: "settings",
      visible: true,
      label: props.pieceLockingEnabled ? "Lock pieces: on" : "Lock pieces: off",
      sortKey: "Lock pieces",
      onClick: closeAnd(props.onTogglePieceLocking),
    },
    {
      id: "preview",
      section: "settings",
      visible: true,
      label: props.showPreview ? "Hide preview" : "Show preview",
      sortKey: "Show preview",
      onClick: closeAnd(props.onTogglePreview),
    },
    {
      id: "sound",
      section: "settings",
      visible: true,
      label: props.soundEnabled ? "Sound: on" : "Sound: off",
      sortKey: "Sound",
      onClick: closeAnd(props.onToggleSound),
    },
  ];
}
