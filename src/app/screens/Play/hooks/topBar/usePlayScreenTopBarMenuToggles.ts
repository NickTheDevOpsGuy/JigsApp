import { isSupabaseConfigured } from "@/supabase/client";

function withHaptic(hapticsEnabled: boolean, fn: () => void): () => void {
  return () => {
    if (hapticsEnabled && typeof navigator?.vibrate === "function") navigator.vibrate(10);
    fn();
  };
}

export function buildHeaderMenuToggleProps(args: {
  hapticsEnabled: boolean;
  setShowPreview: (fn: (p: boolean) => boolean) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleHaptics: () => void;
  setPieceLockingEnabled: (fn: (p: boolean) => boolean) => void;
  magneticSnapEnabled: boolean;
  setMagneticSnapEnabled: (fn: (m: boolean) => boolean) => void;
  snapGlowEnabled: boolean;
  setSnapGlowEnabled: (fn: (g: boolean) => boolean) => void;
  autoRotateOnSnap: boolean;
  setAutoRotateOnSnap: (fn: (a: boolean) => boolean) => void;
  relaxedModeEnabled: boolean;
  toggleRelaxedMode: () => void;
  driftModeEnabled: boolean;
  toggleDriftMode: () => void;
  setShowGhostHint: (fn: (g: boolean) => boolean) => void;
  toggleShowGhostWhenIdle: () => void;
  toggleShowEdgeHighlight: () => void;
  setShowAlignmentGrid: (fn: (a: boolean) => boolean) => void;
  toggleFullscreen: () => void;
  setShowShortcuts: (v: boolean) => void;
  setShowHowToPlay: (v: boolean) => void;
  toggleDebug: () => void;
  togglePerfOverlay: () => void;
  immersiveMode: boolean;
  handleToggleImmersiveMode: () => void;
  setProgressiveRevealMode: (fn: (v: boolean) => boolean) => void;
  pieceCutType: "classic" | "irregular" | "hard";
  setPieceCutType: (cut: "classic" | "irregular" | "hard") => void;
  handleSharePuzzle: (() => void | Promise<void>) | undefined;
  creatingSession: boolean;
  setShowThemeModal: (v: boolean) => void;
  dailyPreferredModifier:
    | import("@/daily/dailyPuzzleCore").DailyVisualModifier
    | undefined;
  setDailyPreferredModifier: (
    m: import("@/daily/dailyPuzzleCore").DailyVisualModifier,
  ) => void;
  setShowResetStatsConfirm: (v: boolean) => void;
  setShowClearCacheConfirm: (v: boolean) => void;
  snapToleranceOverride: number;
  setSnapToleranceOverride: (value: number) => void;
  zenModeEnabled: boolean;
  mysteryModeEnabled: boolean;
  precisionModeEnabled: boolean;
  dynamicDifficultyEnabled: boolean;
  adaptivePersonalityEnabled: boolean;
  toggleZenMode: () => void;
  toggleMysteryMode: () => void;
  togglePrecisionMode: () => void;
  toggleDynamicDifficulty: () => void;
  toggleAdaptivePersonality: () => void;
  minimapVisible: boolean;
  toggleMinimap: () => void;
}) {
  const {
    hapticsEnabled,
    setShowPreview,
    toggleSound,
    toggleMusic,
    toggleHaptics,
    setPieceLockingEnabled,
    magneticSnapEnabled,
    setMagneticSnapEnabled,
    snapGlowEnabled,
    setSnapGlowEnabled,
    autoRotateOnSnap,
    setAutoRotateOnSnap,
    relaxedModeEnabled,
    toggleRelaxedMode,
    driftModeEnabled,
    toggleDriftMode,
    setShowGhostHint,
    toggleShowGhostWhenIdle,
    toggleShowEdgeHighlight,
    setShowAlignmentGrid,
    toggleFullscreen,
    setShowShortcuts,
    setShowHowToPlay,
    toggleDebug,
    togglePerfOverlay,
    immersiveMode,
    handleToggleImmersiveMode,
    setProgressiveRevealMode,
    pieceCutType,
    setPieceCutType,
    handleSharePuzzle,
    creatingSession,
    setShowThemeModal,
    dailyPreferredModifier,
    setDailyPreferredModifier,
    setShowResetStatsConfirm,
    setShowClearCacheConfirm,
    snapToleranceOverride,
    setSnapToleranceOverride,
    zenModeEnabled,
    mysteryModeEnabled,
    precisionModeEnabled,
    dynamicDifficultyEnabled,
    adaptivePersonalityEnabled,
    toggleZenMode,
    toggleMysteryMode,
    togglePrecisionMode,
    toggleDynamicDifficulty,
    toggleAdaptivePersonality,
    minimapVisible,
    toggleMinimap,
  } = args;

  return {
    onTogglePreview: withHaptic(hapticsEnabled, () => setShowPreview((p) => !p)),
    onToggleSound: toggleSound,
    onToggleMusic: toggleMusic,
    onToggleHaptics: toggleHaptics,
    onTogglePieceLocking: withHaptic(hapticsEnabled, () =>
      setPieceLockingEnabled((p) => !p),
    ),
    magneticSnapEnabled,
    onToggleMagneticSnap: withHaptic(hapticsEnabled, () =>
      setMagneticSnapEnabled((m) => !m),
    ),
    snapGlowEnabled,
    onToggleSnapGlow: withHaptic(hapticsEnabled, () => setSnapGlowEnabled((g) => !g)),
    autoRotateOnSnap,
    onToggleAutoRotateOnSnap: withHaptic(hapticsEnabled, () =>
      setAutoRotateOnSnap((a) => !a),
    ),
    relaxedModeEnabled,
    onToggleRelaxedMode: withHaptic(hapticsEnabled, toggleRelaxedMode),
    driftModeEnabled,
    onToggleDriftMode: withHaptic(hapticsEnabled, toggleDriftMode),
    onToggleGhostHint: withHaptic(hapticsEnabled, () => setShowGhostHint((g) => !g)),
    onToggleGhostWhenIdle: withHaptic(hapticsEnabled, toggleShowGhostWhenIdle),
    onToggleEdgeHighlight: withHaptic(hapticsEnabled, toggleShowEdgeHighlight),
    onToggleAlignmentGrid: withHaptic(hapticsEnabled, () =>
      setShowAlignmentGrid((a) => !a),
    ),
    onToggleFullscreen: toggleFullscreen,
    onShowShortcuts: () => setShowShortcuts(true),
    onShowHowToPlay: () => setShowHowToPlay(true),
    onToggleDebug: toggleDebug,
    onTogglePerfOverlay: togglePerfOverlay,
    immersiveMode,
    onToggleImmersiveMode: withHaptic(hapticsEnabled, handleToggleImmersiveMode),
    onToggleProgressiveReveal: withHaptic(hapticsEnabled, () =>
      setProgressiveRevealMode((v) => !v),
    ),
    pieceCutType,
    onPieceCutTypeChange: (cut: "classic" | "irregular" | "hard") => {
      if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
      setPieceCutType(cut);
    },
    onSharePuzzle: isSupabaseConfigured() ? handleSharePuzzle : undefined,
    shareDisabled: creatingSession,
    onOpenThemeModal: withHaptic(hapticsEnabled, () => setShowThemeModal(true)),
    dailyPreferredModifier,
    onDailyPreferredModifierChange: (
      m: import("@/daily/dailyPuzzleCore").DailyVisualModifier,
    ) => {
      if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
      setDailyPreferredModifier(m);
    },
    onResetStats: () => setShowResetStatsConfirm(true),
    onClearCache: () => setShowClearCacheConfirm(true),
    snapToleranceOverride,
    onSnapToleranceOverrideChange: setSnapToleranceOverride,
    zenModeEnabled,
    onToggleZenMode: withHaptic(hapticsEnabled, toggleZenMode),
    mysteryModeEnabled,
    onToggleMysteryMode: withHaptic(hapticsEnabled, toggleMysteryMode),
    precisionModeEnabled,
    onTogglePrecisionMode: withHaptic(hapticsEnabled, togglePrecisionMode),
    dynamicDifficultyEnabled,
    onToggleDynamicDifficulty: withHaptic(hapticsEnabled, toggleDynamicDifficulty),
    adaptivePersonalityEnabled,
    onToggleAdaptivePersonality: withHaptic(hapticsEnabled, toggleAdaptivePersonality),
    minimapVisible,
    onToggleMinimap: withHaptic(hapticsEnabled, toggleMinimap),
  };
}
