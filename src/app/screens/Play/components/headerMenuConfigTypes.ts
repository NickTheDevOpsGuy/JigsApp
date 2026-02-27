/**
 * Shared types for header menu config and item sections.
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
  ariaLabel?: string;
  disabledTitle?: string;
  title?: string;
  isToggle?: boolean;
  checked?: boolean;
  radioSelected?: boolean;
};
