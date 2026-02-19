/**
 * Header menu item definitions and submenu grouping.
 * Structure: Gameplay, Display (Theme submenu opens modal), Audio, Advanced.
 */
import type { TimeMode } from "../timeMode";
import type { Theme } from "@/hooks/useTheme";

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
  relaxedModeEnabled?: boolean;
  showGhostHint: boolean;
  showGhostWhenIdle: boolean;
  showGhostImage?: boolean;
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
  onToggleRelaxedMode?: () => void;
  onToggleGhostHint: () => void;
  onToggleGhostWhenIdle: () => void;
  onToggleGhostImage?: () => void;
  onToggleEdgeHighlight: () => void;
  onToggleAlignmentGrid: () => void;
  onToggleFullscreen: () => void;
  onCenterBoard: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShowShortcuts: () => void;
  onShowHowToPlay: () => void;
  onShowAbout?: () => void;
  onToggleDebug: () => void;
  onTogglePerfOverlay: () => void;
  immersiveMode: boolean;
  onToggleImmersiveMode: () => void;
  onSharePuzzle?: () => void | Promise<void>;
  shareDisabled?: boolean;
  theme?: Theme;
  setTheme?: (t: Theme) => void;
  onOpenThemeModal?: () => void;
  onResetStats?: () => void;
  onClearCache?: () => void;
};

export type SubMenuId =
  | "about"
  | "advanced"
  | "audio"
  | "contribute"
  | "controls"
  | "display"
  | "gameplay"
  | "help"
  | "navigation"
  | "share"
  | "stats"
  | "theme";

export type MenuItemConfig = {
  id: string;
  label: string;
  section: "nav" | "settings" | "help" | "about" | "contribute" | "other";
  visible: boolean;
  disabled?: boolean;
  onClick: () => void;
  isTheme?: boolean;
  isThemeOption?: boolean;
  themeValue?: Theme;
  isSectionLabel?: boolean;
  sortKey?: string;
  subMenu?: SubMenuId;
  /** Screen reader label without emojis */
  ariaLabel?: string;
  /** Tooltip when disabled */
  disabledTitle?: string;
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

  const showTimer = props.timeMode !== "relaxed";

  return [
    // ─── Navigation ───
    {
      id: "home",
      section: "settings",
      visible: true,
      label: "🏠 Home",
      sortKey: "Home",
      onClick: c(() => navigate("/")),
      subMenu: "navigation",
    },
    {
      id: "new",
      section: "settings",
      visible: true,
      label: "🧩 New puzzle",
      sortKey: "New puzzle",
      onClick: c(props.onNewPuzzle),
      subMenu: "navigation",
    },
    // ─── Gameplay ───
    {
      id: "redo",
      section: "settings",
      visible: true,
      label: "↪️ Redo",
      sortKey: "Redo",
      disabled: !props.canRedo,
      onClick: c(props.onRedo),
      subMenu: "controls",
      disabledTitle: "No moves to redo yet",
    },
    {
      id: "undo",
      section: "settings",
      visible: true,
      label: "↩️ Undo",
      sortKey: "Undo",
      disabled: !props.canUndo,
      onClick: c(props.onUndo),
      subMenu: "controls",
      disabledTitle: "No moves to undo yet",
    },
    {
      id: "lock",
      section: "settings",
      visible: true,
      label: props.pieceLockingEnabled ? "Tap to Rotate ✨" : "Tap to Rotate 🌙",
      sortKey: "Tap to Rotate",
      onClick: c(props.onTogglePieceLocking),
      subMenu: "controls",
    },
    {
      id: "relaxedMode",
      section: "settings",
      visible: !!props.onToggleRelaxedMode,
      label: props.relaxedModeEnabled ? "Relaxed Mode ✨" : "Relaxed Mode 🌙",
      sortKey: "Relaxed Mode",
      ariaLabel: props.relaxedModeEnabled ? "Relaxed Mode on" : "Relaxed Mode off",
      onClick: c(props.onToggleRelaxedMode ?? (() => {})),
      subMenu: "controls",
    },
    {
      id: "showTimer",
      section: "settings",
      visible: true,
      label: showTimer ? "Show Timer ✨" : "Show Timer 🌙",
      sortKey: "Show Timer",
      onClick: c(() => props.setTimeMode(showTimer ? "relaxed" : "elapsed")),
      subMenu: "controls",
    },
    // ─── Display ───
    {
      id: "alignmentGrid",
      section: "settings",
      visible: true,
      label: props.showAlignmentGrid ? "Alignment Grid ✨" : "Alignment Grid 🌙",
      sortKey: "Alignment Grid",
      onClick: c(props.onToggleAlignmentGrid),
      subMenu: "display",
    },
    {
      id: "edgeHighlight",
      section: "settings",
      visible: true,
      label: props.showEdgeHighlight ? "Edge Highlight ✨" : "Edge Highlight 🌙",
      sortKey: "Edge Highlight",
      onClick: c(props.onToggleEdgeHighlight),
      subMenu: "display",
    },
    {
      id: "ghostHint",
      section: "settings",
      visible: true,
      label: props.showGhostHint ? "Ghost Hint ✨" : "Ghost Hint 🌙",
      sortKey: "Ghost Hint",
      onClick: c(props.onToggleGhostHint),
      subMenu: "display",
    },
    {
      id: "ghostWhenIdle",
      section: "settings",
      visible: true,
      label: props.showGhostWhenIdle ? "Ghost When Idle ✨" : "Ghost When Idle 🌙",
      sortKey: "Ghost When Idle",
      onClick: c(props.onToggleGhostWhenIdle),
      subMenu: "display",
    },
    {
      id: "ghostImage",
      section: "settings",
      visible: !!props.onToggleGhostImage,
      label: props.showGhostImage ? "Ghost Image ✨" : "Ghost Image 🌙",
      sortKey: "Ghost Image",
      ariaLabel: props.showGhostImage ? "Ghost Image behind board on" : "Ghost Image off",
      onClick: c(props.onToggleGhostImage ?? (() => {})),
      subMenu: "display",
    },
    {
      id: "immersiveMode",
      section: "settings",
      visible: true,
      label: props.immersiveMode ? "Immersive Mode ✨" : "Immersive Mode 🌙",
      sortKey: "Immersive Mode",
      onClick: c(props.onToggleImmersiveMode),
      subMenu: "display",
    },
    // ─── Audio ───
    {
      id: "haptics",
      section: "settings",
      visible: props.canShowHaptics,
      label: props.hapticsEnabled ? "Haptics ✨" : "Haptics 🌙",
      sortKey: "Haptics",
      onClick: c(props.onToggleHaptics),
      subMenu: "audio",
    },
    {
      id: "sound",
      section: "settings",
      visible: true,
      label: props.soundEnabled ? "Sound Effects ✨" : "Sound Effects 🌙",
      sortKey: "Sound Effects",
      onClick: c(props.onToggleSound),
      subMenu: "audio",
    },
    // ─── Advanced ───
    {
      id: "clearCache",
      section: "settings",
      visible: !!props.onClearCache,
      label: "🗑️ Clear Cache",
      sortKey: "Clear Cache",
      onClick: c(props.onClearCache ?? (() => {})),
      subMenu: "advanced",
    },
    {
      id: "perfOverlay",
      section: "settings",
      visible: props.canShowDebug,
      label: props.debug.showPerfOverlay
        ? "📊 Performance Overlay ✨"
        : "📊 Performance Overlay 🌙",
      sortKey: "Performance Overlay",
      onClick: c(props.onTogglePerfOverlay),
      subMenu: "advanced",
    },
    {
      id: "resetStats",
      section: "settings",
      visible: !!props.onResetStats,
      label: "🔄 Reset Local Stats",
      sortKey: "Reset Local Stats",
      onClick: c(props.onResetStats ?? (() => {})),
      subMenu: "advanced",
    },
    // ─── Stats, Share ───
    {
      id: "stats",
      section: "settings",
      visible: true,
      label: "🏆 Leaderboards",
      sortKey: "Leaderboards",
      onClick: c(() => navigate("/stats")),
      subMenu: "stats",
    },
    {
      id: "share",
      section: "settings",
      visible: !!props.onSharePuzzle,
      label: "👥 Play with friend?",
      sortKey: "Play with friend",
      disabled: props.shareDisabled,
      disabledTitle: props.shareDisabled ? "Creating session…" : undefined,
      onClick: c(props.onSharePuzzle ?? (() => {})),
      subMenu: "share",
    },
    // ─── Contribute (under About) ───
    {
      id: "repo",
      section: "contribute",
      visible: true,
      label: "🌟 Get Involved",
      sortKey: "Get Involved",
      onClick: c(() => window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer")),
      subMenu: "contribute",
    },
    {
      id: "contributors",
      section: "contribute",
      visible: true,
      label: "👋 Meet the Team",
      sortKey: "Meet the Team",
      onClick: c(() =>
        window.open(GITHUB_CONTRIBUTORS_URL, "_blank", "noopener,noreferrer"),
      ),
      subMenu: "contribute",
    },
    {
      id: "howToPlay",
      section: "help",
      visible: true,
      label: "📖 How to Play",
      sortKey: "How to Play",
      onClick: c(props.onShowHowToPlay),
      subMenu: "help",
    },
    {
      id: "shortcuts",
      section: "help",
      visible: true,
      label: "⌨️ Keyboard & Controls",
      sortKey: "Keyboard & Controls",
      onClick: c(props.onShowShortcuts),
      subMenu: "help",
    },
  ];
}
