/**
 * Header menu item definitions and submenu grouping.
 * Structure: Gameplay, Display (Theme submenu opens modal), Audio, Advanced.
 */
import type { TimeMode } from "../timeMode";
import type { Theme } from "@/hooks/useTheme";
import type { DailyVisualModifier } from "@/daily/dailyPuzzleCore";

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
  canUndo?: boolean;
  onUndo?: () => void;
  canRedo?: boolean;
  onRedo?: () => void;
  onResetView?: () => void;
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
  dailyPreferredModifier?: DailyVisualModifier;
  onDailyPreferredModifierChange?: (m: DailyVisualModifier) => void;
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
  | "effects"
  | "gameplay"
  | "help"
  | "manualControls"
  | "modes"
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
  /** Hover/popup tooltip description */
  title?: string;
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
    // ─── Controls (manual: undo, redo, reset, zoom) ───
    {
      id: "undo",
      section: "settings",
      visible: !!props.onUndo,
      label: "Undo",
      sortKey: "0 Undo",
      title: "Revert last piece placement",
      onClick: c(props.onUndo ?? (() => {})),
      subMenu: "manualControls",
      disabled: !props.canUndo,
      disabledTitle: !props.canUndo ? "No moves to undo" : undefined,
    },
    {
      id: "redo",
      section: "settings",
      visible: !!props.onRedo,
      label: "Redo",
      sortKey: "1 Redo",
      title: "Reapply last undone move",
      onClick: c(props.onRedo ?? (() => {})),
      subMenu: "manualControls",
      disabled: !props.canRedo,
      disabledTitle: !props.canRedo ? "No moves to redo" : undefined,
    },
    {
      id: "resetView",
      section: "settings",
      visible: !!props.onResetView,
      label: "Reset View",
      sortKey: "2 Reset View",
      title: "Reset zoom and pan to center the board",
      onClick: c(props.onResetView ?? (() => {})),
      subMenu: "manualControls",
    },
    {
      id: "zoomIn",
      section: "settings",
      visible: true,
      label: "Zoom In",
      sortKey: "3 Zoom In",
      title: "Zoom in on the board",
      onClick: c(props.onZoomIn ?? (() => {})),
      subMenu: "manualControls",
    },
    {
      id: "zoomOut",
      section: "settings",
      visible: true,
      label: "Zoom Out",
      sortKey: "4 Zoom Out",
      title: "Zoom out to see more of the board",
      onClick: c(props.onZoomOut ?? (() => {})),
      subMenu: "manualControls",
    },
    // ─── Modes (behavior rules) ───
    {
      id: "deliberateDetach",
      section: "settings",
      visible: !!props.onToggleDeliberateDetach,
      label: "Deliberate Detach",
      sortKey: "0 Deliberate Detach",
      title: "Require hold or shake to detach placed pieces",
      ariaLabel: props.deliberateDetachEnabled
        ? "Deliberate detach on"
        : "Deliberate detach off",
      onClick: c(props.onToggleDeliberateDetach ?? (() => {})),
      subMenu: "modes",
      isToggle: true,
      checked: !!props.deliberateDetachEnabled,
    },
    {
      id: "lock",
      section: "settings",
      visible: true,
      label: "Tap to Rotate",
      sortKey: "1 Tap to Rotate",
      title: "Tap a piece in the tray to rotate it",
      onClick: c(props.onTogglePieceLocking),
      subMenu: "modes",
      isToggle: true,
      checked: props.pieceLockingEnabled,
    },
    {
      id: "relaxedMode",
      section: "settings",
      visible: !!props.onToggleRelaxedMode,
      label: "Relaxed Mode",
      sortKey: "2 Relaxed Mode",
      title: "Hide timer and take your time",
      ariaLabel: props.relaxedModeEnabled ? "Relaxed Mode on" : "Relaxed Mode off",
      onClick: c(props.onToggleRelaxedMode ?? (() => {})),
      subMenu: "modes",
      isToggle: true,
      checked: !!props.relaxedModeEnabled,
    },
    {
      id: "driftMode",
      section: "settings",
      visible: !!props.onToggleDriftMode,
      label: "Drift Mode",
      sortKey: "3 Drift Mode",
      title: "Pieces drift slightly for organic feel",
      ariaLabel: props.driftModeEnabled ? "Drift Mode on" : "Drift Mode off",
      onClick: c(props.onToggleDriftMode ?? (() => {})),
      subMenu: "modes",
      isToggle: true,
      checked: !!props.driftModeEnabled,
    },
    {
      id: "showTimer",
      section: "settings",
      visible: true,
      label: "Show Timer",
      sortKey: "4 Show Timer",
      title: "Show or hide elapsed time",
      onClick: c(() => props.setTimeMode(showTimer ? "relaxed" : "elapsed")),
      subMenu: "modes",
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
      title: "Show reference image while solving",
      onClick: c(props.onTogglePreview),
      subMenu: "display",
      isToggle: true,
      checked: props.showPreview,
    },
    {
      id: "modifierNone",
      section: "settings",
      visible: !!props.onDailyPreferredModifierChange,
      label: "None",
      sortKey: "0 None",
      title: "No visual modifier",
      onClick: c(() => props.onDailyPreferredModifierChange?.("none")),
      subMenu: "effects",
      isToggle: true,
      checked: (props.dailyPreferredModifier ?? "none") === "none",
      ariaLabel: "None – no visual modifier",
    },
    {
      id: "modifierFog",
      section: "settings",
      visible: !!props.onDailyPreferredModifierChange,
      label: "Fog",
      sortKey: "1 Fog",
      title: "Reduced contrast until piece is placed",
      onClick: c(() => props.onDailyPreferredModifierChange?.("fog")),
      subMenu: "effects",
      isToggle: true,
      checked: props.dailyPreferredModifier === "fog",
      ariaLabel: "Fog – reduced contrast until placed",
    },
    {
      id: "modifierNight",
      section: "settings",
      visible: !!props.onDailyPreferredModifierChange,
      label: "Night",
      sortKey: "2 Night",
      title: "Dark palette with vignette",
      onClick: c(() => props.onDailyPreferredModifierChange?.("night")),
      subMenu: "effects",
      isToggle: true,
      checked: props.dailyPreferredModifier === "night",
      ariaLabel: "Night – dark palette and vignette",
    },
    {
      id: "modifierSepia",
      section: "settings",
      visible: !!props.onDailyPreferredModifierChange,
      label: "Sepia",
      sortKey: "3 Sepia",
      title: "Vintage sepia tone",
      onClick: c(() => props.onDailyPreferredModifierChange?.("sepia")),
      subMenu: "effects",
      isToggle: true,
      checked: props.dailyPreferredModifier === "sepia",
      ariaLabel: "Sepia – vintage tone",
    },
    {
      id: "alignmentGrid",
      section: "settings",
      visible: true,
      label: "Alignment Grid",
      sortKey: "Alignment Grid",
      title: "Show grid lines to help align pieces",
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
      title: "Highlight edge pieces in the tray",
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
      title: "Show outlines around completed clusters",
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
      title: "Show ghost placement when dragging a piece",
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
      title: "Show ghost after a moment of idleness",
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
      title: "Hide UI until you hover or tap the edge",
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
      title: "Reveal reference image as you place pieces",
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
      title: "Classic jigsaw cuts – applies to next puzzle",
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
      title: "Irregular wavy cuts – applies to next puzzle",
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
      title: "Hard uniform cuts – applies to next puzzle",
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
      title: "Vibration feedback on snap and actions",
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
      title: "Play sounds when placing and snapping pieces",
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
      title: "Theme-based ambient music",
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
      title: "Clear cached puzzle images and data",
      onClick: c(props.onClearCache ?? (() => {})),
      subMenu: "advanced",
    },
    {
      id: "perfOverlay",
      section: "settings",
      visible: props.canShowDebug,
      label: "Performance Overlay",
      sortKey: "Performance Overlay",
      title: "Show FPS and draw call stats",
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
      title: "Clear all local best times – cannot be undone",
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
      title: "View daily and best-time leaderboards",
      onClick: c(() => navigate("/stats")),
      subMenu: "stats",
    },
    {
      id: "share",
      section: "settings",
      visible: !!props.onSharePuzzle,
      label: "Play with friend",
      sortKey: "Play with friend",
      title: "Start a co-op session to solve together",
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
      title: "Contribute on GitHub",
      onClick: c(() => window.open(GITHUB_REPO_URL, "_blank", "noopener,noreferrer")),
      subMenu: "contribute",
    },
    {
      id: "contributors",
      section: "contribute",
      visible: true,
      label: "Meet the Team",
      sortKey: "Meet the Team",
      title: "View contributors",
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
      title: "Learn the basics",
      onClick: c(props.onShowHowToPlay),
      subMenu: "help",
    },
    {
      id: "shortcuts",
      section: "help",
      visible: true,
      label: "Keyboard & Controls",
      sortKey: "Keyboard & Controls",
      title: "View keyboard shortcuts",
      onClick: c(props.onShowShortcuts),
      subMenu: "help",
    },
  ];
}
