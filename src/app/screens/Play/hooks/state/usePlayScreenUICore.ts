/** usePlayScreenUI – UI state (ghost hint, alignment grid, debug, etc.) with localStorage. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PieceCutType } from "@/puzzle/core/types";
import {
  getDailyPreferredModifier,
  setDailyPreferredModifier as persistDailyPreferredModifier,
} from "@/daily/dailyPuzzleCore";
import type { DailyVisualModifier } from "@/daily/dailyPuzzleCore";
import { type DebugFlags } from "@/screens/Play/core/utils/playScreenUtils";
import { getPlayScreenUIStorageInitial, DEBUG_INITIAL } from "./playScreenUIInitial";
import { usePlayScreenUIPersistence } from "./usePlayScreenUIPersistence";
import { usePlayScreenUISystem } from "./usePlayScreenUISystem";

export function usePlayScreenUI() {
  const storageInitial = getPlayScreenUIStorageInitial();

  const [pieceLockingEnabled, setPieceLockingEnabled] = useState(
    storageInitial.pieceLockingEnabled,
  );
  const [autoRotateOnSnap, setAutoRotateOnSnap] = useState(
    storageInitial.autoRotateOnSnap,
  );
  const [magneticSnapEnabled, setMagneticSnapEnabled] = useState(
    storageInitial.magneticSnapEnabled,
  );
  const [snapGlowEnabled, setSnapGlowEnabled] = useState(storageInitial.snapGlowEnabled);
  const [showGhostHint, setShowGhostHint] = useState(storageInitial.showGhostHint);
  const [showAlignmentGrid, setShowAlignmentGrid] = useState(
    storageInitial.showAlignmentGrid,
  );
  const [showGhostWhenIdle, setShowGhostWhenIdle] = useState(
    storageInitial.showGhostWhenIdle,
  );
  const [showEdgeHighlight, setShowEdgeHighlight] = useState(
    storageInitial.showEdgeHighlight,
  );
  const [showClusterOutline, setShowClusterOutline] = useState(
    storageInitial.showClusterOutline,
  );
  const [deliberateDetachEnabled, setDeliberateDetachEnabled] = useState(
    storageInitial.deliberateDetachEnabled,
  );
  const [relaxedModeEnabled, setRelaxedModeEnabled] = useState(
    storageInitial.relaxedModeEnabled,
  );
  const [driftModeEnabled, setDriftModeEnabled] = useState(
    storageInitial.driftModeEnabled,
  );
  const [snapToleranceOverride, setSnapToleranceOverride] = useState<number>(
    storageInitial.snapToleranceOverride,
  );
  const [pieceCutType, setPieceCutType] = useState<PieceCutType>(
    storageInitial.pieceCutType,
  );
  const [progressiveRevealMode, setProgressiveRevealMode] = useState(
    storageInitial.progressiveRevealMode,
  );
  const [zenModeEnabled, setZenModeEnabled] = useState(storageInitial.zenModeEnabled);
  const [mysteryModeEnabled, setMysteryModeEnabled] = useState(
    storageInitial.mysteryModeEnabled,
  );
  const [precisionModeEnabled, setPrecisionModeEnabled] = useState(
    storageInitial.precisionModeEnabled,
  );
  const [dynamicDifficultyEnabled, setDynamicDifficultyEnabled] = useState(
    storageInitial.dynamicDifficultyEnabled,
  );
  const [adaptivePersonalityEnabled, setAdaptivePersonalityEnabled] = useState(
    storageInitial.adaptivePersonalityEnabled,
  );
  const [minimapVisible, setMinimapVisible] = useState(storageInitial.minimapVisible);
  const [minimapPosition, setMinimapPosition] = useState<
    "bottom-left" | "bottom-right" | "top-left" | "top-right"
  >(storageInitial.minimapPosition);

  const [dailyPreferredModifier, setDailyPreferredModifierState] =
    useState<DailyVisualModifier>(getDailyPreferredModifier);

  const [debug, setDebug] = useState<DebugFlags>(DEBUG_INITIAL);
  const [showPreview, setShowPreview] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState(storageInitial.immersiveMode);
  const [isPaused, setIsPaused] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showHelpChoice, setShowHelpChoice] = useState(false);
  const [showFeedbackChoice, setShowFeedbackChoice] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);
  const {
    isFullscreen,
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    toggleFullscreen,
    toggleSound,
    toggleMusic,
    toggleHaptics,
  } = usePlayScreenUISystem(pageRef);

  useEffect(() => {
    selectedIdRef.current = selectedPieceId;
  }, [selectedPieceId]);

  usePlayScreenUIPersistence({
    pieceLockingEnabled,
    autoRotateOnSnap,
    magneticSnapEnabled,
    snapGlowEnabled,
    showGhostHint,
    showAlignmentGrid,
    showGhostWhenIdle,
    showEdgeHighlight,
    showClusterOutline,
    deliberateDetachEnabled,
    relaxedModeEnabled,
    driftModeEnabled,
    snapToleranceOverride,
    pieceCutType,
    progressiveRevealMode,
    immersiveMode,
    zenModeEnabled,
    mysteryModeEnabled,
    precisionModeEnabled,
    dynamicDifficultyEnabled,
    adaptivePersonalityEnabled,
    minimapVisible,
    minimapPosition,
  });

  const toggleDebug = useCallback(() => {
    setDebug((d) => ({
      ...d,
      showGrid: !d.showGrid,
      showBounds: !d.showBounds,
      showIds: !d.showIds,
    }));
  }, []);

  const togglePerfOverlay = useCallback(() => {
    setDebug((d) => ({ ...d, showPerfOverlay: !d.showPerfOverlay }));
  }, []);

  const toggleImmersiveMode = useCallback(() => {
    setImmersiveMode((m) => !m);
  }, []);

  const toggleShowGhostWhenIdle = useCallback(() => setShowGhostWhenIdle((v) => !v), []);
  const toggleShowEdgeHighlight = useCallback(() => setShowEdgeHighlight((v) => !v), []);
  const toggleShowClusterOutline = useCallback(
    () => setShowClusterOutline((v) => !v),
    [],
  );
  const toggleDeliberateDetach = useCallback(
    () => setDeliberateDetachEnabled((v) => !v),
    [],
  );
  const toggleRelaxedMode = useCallback(() => setRelaxedModeEnabled((v) => !v), []);
  const toggleDriftMode = useCallback(() => setDriftModeEnabled((v) => !v), []);
  const toggleMagneticSnap = useCallback(() => setMagneticSnapEnabled((v) => !v), []);
  const toggleSnapGlow = useCallback(() => setSnapGlowEnabled((v) => !v), []);
  const toggleZenMode = useCallback(() => setZenModeEnabled((v) => !v), []);
  const toggleMysteryMode = useCallback(() => setMysteryModeEnabled((v) => !v), []);
  const togglePrecisionMode = useCallback(() => setPrecisionModeEnabled((v) => !v), []);
  const toggleDynamicDifficulty = useCallback(
    () => setDynamicDifficultyEnabled((v) => !v),
    [],
  );
  const toggleAdaptivePersonality = useCallback(
    () => setAdaptivePersonalityEnabled((v) => !v),
    [],
  );

  const setDailyPreferredModifier = useCallback((modifier: DailyVisualModifier) => {
    setDailyPreferredModifierState(modifier);
    persistDailyPreferredModifier(modifier);
  }, []);

  return {
    pieceLockingEnabled,
    setPieceLockingEnabled,
    autoRotateOnSnap,
    setAutoRotateOnSnap,
    magneticSnapEnabled,
    setMagneticSnapEnabled,
    toggleMagneticSnap,
    snapGlowEnabled,
    setSnapGlowEnabled,
    toggleSnapGlow,
    showGhostHint,
    setShowGhostHint,
    showAlignmentGrid,
    setShowAlignmentGrid,
    showGhostWhenIdle,
    setShowGhostWhenIdle,
    toggleShowGhostWhenIdle,
    showEdgeHighlight,
    setShowEdgeHighlight,
    toggleShowEdgeHighlight,
    showClusterOutline,
    setShowClusterOutline,
    toggleShowClusterOutline,
    deliberateDetachEnabled,
    toggleDeliberateDetach,
    relaxedModeEnabled,
    setRelaxedModeEnabled,
    toggleRelaxedMode,
    driftModeEnabled,
    setDriftModeEnabled,
    toggleDriftMode,
    snapToleranceOverride,
    setSnapToleranceOverride,
    pieceCutType,
    setPieceCutType,
    progressiveRevealMode,
    setProgressiveRevealMode,
    zenModeEnabled,
    setZenModeEnabled,
    toggleZenMode,
    mysteryModeEnabled,
    setMysteryModeEnabled,
    toggleMysteryMode,
    precisionModeEnabled,
    setPrecisionModeEnabled,
    togglePrecisionMode,
    dynamicDifficultyEnabled,
    setDynamicDifficultyEnabled,
    toggleDynamicDifficulty,
    adaptivePersonalityEnabled,
    setAdaptivePersonalityEnabled,
    toggleAdaptivePersonality,
    minimapVisible,
    setMinimapVisible,
    toggleMinimap: useCallback(() => setMinimapVisible((v) => !v), []),
    minimapPosition,
    setMinimapPosition,
    cycleMinimapPosition: useCallback(
      () =>
        setMinimapPosition((p) => {
          if (p === "bottom-left") return "bottom-right";
          if (p === "bottom-right") return "top-right";
          if (p === "top-right") return "top-left";
          return "bottom-left";
        }),
      [],
    ),
    debug,
    setDebug,
    showPreview,
    setShowPreview,
    immersiveMode,
    setImmersiveMode,
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
    toggleMusic,
    hapticsEnabled,
    setHapticsEnabled,
    isFullscreen,
    isPaused,
    setIsPaused,
    showShortcuts,
    setShowShortcuts,
    showHowToPlay,
    setShowHowToPlay,
    showHelpChoice,
    setShowHelpChoice,
    showFeedbackChoice,
    setShowFeedbackChoice,
    showNewGameModal,
    setShowNewGameModal,
    showThemeModal,
    setShowThemeModal,
    dailyPreferredModifier,
    setDailyPreferredModifier,
    selectedPieceId,
    setSelectedPieceId,
    pageRef,
    selectedIdRef,
    bump,
    toggleFullscreen,
    toggleSound,
    toggleHaptics,
    toggleDebug,
    togglePerfOverlay,
    toggleImmersiveMode,
  };
}
