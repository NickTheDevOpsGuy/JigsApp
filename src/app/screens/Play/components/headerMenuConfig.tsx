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
  timeMode: TimeMode;
  setTimeMode: (m: TimeMode | ((prev: TimeMode) => TimeMode)) => void;
  countdownMinutes: number;
  setCountdownMinutes: (n: number | ((prev: number) => number)) => void;
  showPreview: boolean;
  soundEnabled: boolean;
  musicEnabled?: boolean;
  hapticsEnabled: boolean;
  deliberateDetachEnabled?: boolean;
  onToggleDeliberateDetach?: () => void;
  pieceLockingEnabled: boolean;
  relaxedModeEnabled?: boolean;
  showGhostHint: boolean;
  showGhostWhenIdle: boolean;
  showEdgeHighlight: boolean;
  showClusterOutline?: boolean;
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
  onToggleMusic?: () => void;
  onToggleHaptics: () => void;
  onTogglePieceLocking: () => void;
  onToggleRelaxedMode?: () => void;
  driftModeEnabled?: boolean;
  onToggleDriftMode?: () => void;
  onToggleGhostHint: () => void;
  onToggleGhostWhenIdle: () => void;
  onToggleEdgeHighlight: () => void;
  onToggleClusterOutline?: () => void;
  onToggleAlignmentGrid: () => void;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShowShortcuts: () => void;
  onShowHowToPlay: () => void;
  onShowAbout?: () => void;
  onToggleDebug: () => void;
  onTogglePerfOverlay: () => void;
  immersiveMode: boolean;
  onToggleImmersiveMode: () => void;
  pieceCutType?: "classic" | "irregular" | "hard";
  onPieceCutTypeChange?: (cut: "classic" | "irregular" | "hard") => void;
  progressiveRevealMode?: boolean;
  onToggleProgressiveReveal?: () => void;
  onSharePuzzle?: () => void | Promise<void>;
  shareDisabled?: boolean;
  theme?: Theme;
  setTheme?: (t: Theme) => void;
  onOpenThemeModal?: () => void;
  onResetStats?: () => void;
  onClearCache?: () => void;
  snapToleranceOverride: number;
  onSnapToleranceOverrideChange: (value: number) => void;
};

export type SubMenuId =
  | "about"
  | "advanced"
  | "assistance"
  | "audio"
  | "contribute"
  | "controls"
  | "display"
  | "gameplay"
  | "help"
  | "navigation"
  | "pieceShape"
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
  /** Render as toggle switch instead of button */
  isToggle?: boolean;
  /** Checked state for toggle (on = true) */
  checked?: boolean;
  /** Show checkmark for selected option in a radio group */
  radioSelected?: boolean;
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
    // ─── Gameplay ───
    {
      id: "deliberateDetach",
      section: "settings",
      visible: !!props.onToggleDeliberateDetach,
      label: "Deliberate Detach",
      sortKey: "Deliberate Detach",
      ariaLabel: props.deliberateDetachEnabled
        ? "Deliberate detach on"
        : "Deliberate detach off",
      onClick: c(props.onToggleDeliberateDetach ?? (() => {})),
      subMenu: "controls",
      isToggle: true,
      checked: !!props.deliberateDetachEnabled,
    },
    {
      id: "lock",
      section: "settings",
      visible: true,
      label: "Tap to Rotate",
      sortKey: "Tap to Rotate",
      onClick: c(props.onTogglePieceLocking),
      subMenu: "controls",
      isToggle: true,
      checked: props.pieceLockingEnabled,
    },
    {
      id: "relaxedMode",
      section: "settings",
      visible: !!props.onToggleRelaxedMode,
      label: "Relaxed Mode",
      sortKey: "Relaxed Mode",
      ariaLabel: props.relaxedModeEnabled ? "Relaxed Mode on" : "Relaxed Mode off",
      onClick: c(props.onToggleRelaxedMode ?? (() => {})),
      subMenu: "controls",
      isToggle: true,
      checked: !!props.relaxedModeEnabled,
    },
    {
      id: "driftMode",
      section: "settings",
      visible: !!props.onToggleDriftMode,
      label: "Drift Mode",
      sortKey: "Drift Mode",
      ariaLabel: props.driftModeEnabled ? "Drift Mode on" : "Drift Mode off",
      onClick: c(props.onToggleDriftMode ?? (() => {})),
      subMenu: "controls",
      isToggle: true,
      checked: !!props.driftModeEnabled,
    },
    {
      id: "showTimer",
      section: "settings",
      visible: true,
      label: "Show Timer",
      sortKey: "Show Timer",
      onClick: c(() => props.setTimeMode(showTimer ? "relaxed" : "elapsed")),
      subMenu: "controls",
      isToggle: true,
      checked: showTimer,
    },
    // ─── Display ───
    {
      id: "showPreview",
      section: "settings",
      visible: true,
      label: "Preview",
      sortKey: "0 Preview",
      onClick: c(props.onTogglePreview),
      subMenu: "display",
      isToggle: true,
      checked: props.showPreview,
    },
    {
      id: "alignmentGrid",
      section: "settings",
      visible: true,
      label: "Alignment Grid",
      sortKey: "Alignment Grid",
      onClick: c(props.onToggleAlignmentGrid),
      subMenu: "assistance",
      isToggle: true,
      checked: props.showAlignmentGrid,
    },
    {
      id: "edgeHighlight",
      section: "settings",
      visible: true,
      label: "Edge Highlight",
      sortKey: "Edge Highlight",
      onClick: c(props.onToggleEdgeHighlight),
      subMenu: "assistance",
      isToggle: true,
      checked: props.showEdgeHighlight,
    },
    {
      id: "clusterOutline",
      section: "settings",
      visible: !!props.onToggleClusterOutline,
      label: "Cluster Outlines",
      sortKey: "Cluster Outlines",
      ariaLabel: props.showClusterOutline
        ? "Cluster outlines on"
        : "Cluster outlines off",
      onClick: c(props.onToggleClusterOutline ?? (() => {})),
      subMenu: "assistance",
      isToggle: true,
      checked: !!props.showClusterOutline,
    },
    {
      id: "ghostHint",
      section: "settings",
      visible: true,
      label: "Ghost Hint",
      sortKey: "Ghost Hint",
      onClick: c(props.onToggleGhostHint),
      subMenu: "assistance",
      isToggle: true,
      checked: props.showGhostHint,
    },
    {
      id: "ghostWhenIdle",
      section: "settings",
      visible: true,
      label: "Ghost When Idle",
      sortKey: "Ghost When Idle",
      onClick: c(props.onToggleGhostWhenIdle),
      subMenu: "assistance",
      isToggle: true,
      checked: props.showGhostWhenIdle,
    },
    {
      id: "immersiveMode",
      section: "settings",
      visible: true,
      label: "Immersive Mode",
      sortKey: "Immersive Mode",
      onClick: c(props.onToggleImmersiveMode),
      subMenu: "display",
      isToggle: true,
      checked: props.immersiveMode,
    },
    {
      id: "progressiveReveal",
      section: "settings",
      visible: true,
      label: "Progressive Reveal",
      sortKey: "Progressive Reveal",
      onClick: c(props.onToggleProgressiveReveal ?? (() => {})),
      subMenu: "assistance",
      isToggle: true,
      checked: !!props.progressiveRevealMode,
    },
    {
      id: "pieceCutClassic",
      section: "settings",
      visible: !!props.onPieceCutTypeChange,
      label: "Classic",
      sortKey: "0 Piece shape Classic",
      onClick: c(() => props.onPieceCutTypeChange?.("classic")),
      subMenu: "pieceShape",
      radioSelected: (props.pieceCutType ?? "classic") === "classic",
      ariaLabel: "Classic – applies to next puzzle",
    },
    {
      id: "pieceCutIrregular",
      section: "settings",
      visible: !!props.onPieceCutTypeChange,
      label: "Irregular",
      sortKey: "1 Piece shape Irregular",
      onClick: c(() => props.onPieceCutTypeChange?.("irregular")),
      subMenu: "pieceShape",
      radioSelected: (props.pieceCutType ?? "classic") === "irregular",
      ariaLabel: "Irregular – applies to next puzzle",
    },
    {
      id: "pieceCutHard",
      section: "settings",
      visible: !!props.onPieceCutTypeChange,
      label: "Hard",
      sortKey: "2 Piece shape Hard",
      onClick: c(() => props.onPieceCutTypeChange?.("hard")),
      subMenu: "pieceShape",
      radioSelected: (props.pieceCutType ?? "classic") === "hard",
      ariaLabel: "Hard – applies to next puzzle",
    },
    // ─── Audio ───
    {
      id: "haptics",
      section: "settings",
      visible: props.canShowHaptics,
      label: "Haptics",
      sortKey: "Haptics",
      onClick: c(props.onToggleHaptics),
      subMenu: "audio",
      isToggle: true,
      checked: props.hapticsEnabled,
    },
    {
      id: "sound",
      section: "settings",
      visible: true,
      label: "Sound Effects",
      sortKey: "Sound Effects",
      onClick: c(props.onToggleSound),
      subMenu: "audio",
      isToggle: true,
      checked: props.soundEnabled,
    },
    {
      id: "music",
      section: "settings",
      visible: !!props.onToggleMusic,
      label: "Background Music",
      sortKey: "Background Music",
      ariaLabel: props.musicEnabled ? "Background music on" : "Background music off",
      onClick: c(props.onToggleMusic ?? (() => {})),
      subMenu: "audio",
      isToggle: true,
      checked: !!props.musicEnabled,
    },
    // ─── Advanced ───
    {
      id: "clearCache",
      section: "settings",
      visible: !!props.onClearCache,
      label: "Clear Cache",
      sortKey: "Clear Cache",
      onClick: c(props.onClearCache ?? (() => {})),
      subMenu: "advanced",
    },
    {
      id: "perfOverlay",
      section: "settings",
      visible: props.canShowDebug,
      label: "Performance Overlay",
      sortKey: "Performance Overlay",
      onClick: c(props.onTogglePerfOverlay),
      subMenu: "advanced",
      isToggle: true,
      checked: props.debug.showPerfOverlay,
    },
    {
      id: "resetStats",
      section: "settings",
      visible: !!props.onResetStats,
      label: "Reset Local Stats",
      sortKey: "Reset Local Stats",
      onClick: c(props.onResetStats ?? (() => {})),
      subMenu: "advanced",
    },
    // ─── Stats, Share ───
    {
      id: "stats",
      section: "settings",
      visible: true,
      label: "Leaderboards",
      sortKey: "Leaderboards",
      onClick: c(() => navigate("/stats")),
      subMenu: "stats",
    },
    {
      id: "share",
      section: "settings",
      visible: !!props.onSharePuzzle,
      label: "Play with friend",
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
      label: "Get Involved",
      sortKey: "Get Involved",
      onClick: c(() => window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer")),
      subMenu: "contribute",
    },
    {
      id: "contributors",
      section: "contribute",
      visible: true,
      label: "Meet the Team",
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
