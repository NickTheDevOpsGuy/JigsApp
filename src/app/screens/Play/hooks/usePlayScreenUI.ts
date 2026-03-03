/**
 * usePlayScreenUI – UI state (ghost hint, alignment grid, debug, etc.) with localStorage.
 *
 * Sections: 1–190 state (all toggles/options) + load from safeLocalStorage;
 * 191–350 setters + persistence; 351–430 return object + optional sync effect.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { soundManager } from "@/audio/sounds";
import { audioManager } from "@/audio/audioManager";
import type { PieceCutType } from "@/puzzle/types";
import {
  getDailyPreferredModifier,
  setDailyPreferredModifier as persistDailyPreferredModifier,
} from "@/daily/dailyPuzzleCore";
import type { DailyVisualModifier } from "@/daily/dailyPuzzleCore";
import { type DebugFlags } from "../playScreenUtils";
import { getPlayScreenUIStorageInitial, DEBUG_INITIAL } from "./playScreenUIInitial";
import { usePlayScreenUIPersistence } from "./usePlayScreenUIPersistence";

export function usePlayScreenUI() {
  const storageInitial = getPlayScreenUIStorageInitial();

  const [pieceLockingEnabled, setPieceLockingEnabled] = useState(
    storageInitial.pieceLockingEnabled,
  );
  const [autoRotateOnSnap, setAutoRotateOnSnap] = useState(
    storageInitial.autoRotateOnSnap,
  );
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
  const [zenModeEnabled, setZenModeEnabled] = useState(
    storageInitial.zenModeEnabled,
  );
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

  const [dailyPreferredModifier, setDailyPreferredModifierState] =
    useState<DailyVisualModifier>(getDailyPreferredModifier);

  const [debug, setDebug] = useState<DebugFlags>(DEBUG_INITIAL);
  const [showPreview, setShowPreview] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState(storageInitial.immersiveMode);
  const [soundEnabled, setSoundEnabled] = useState(() =>
    typeof window !== "undefined" ? soundManager.isEnabled() : true,
  );
  const [musicEnabled, setMusicEnabled] = useState(() =>
    typeof window !== "undefined" ? audioManager.isMusicEnabled() : false,
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(() =>
    typeof window !== "undefined" ? soundManager.isHapticsEnabled() : false,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showHelpChoice, setShowHelpChoice] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

  useEffect(() => {
    selectedIdRef.current = selectedPieceId;
  }, [selectedPieceId]);

  usePlayScreenUIPersistence({
    pieceLockingEnabled,
    autoRotateOnSnap,
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
  });

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      pageRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    setSoundEnabled(soundManager.isEnabled());
    setMusicEnabled(audioManager.isMusicEnabled());
    setHapticsEnabled(soundManager.isHapticsEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const v = !soundManager.isEnabled();
    soundManager.setEnabled(v);
    setSoundEnabled(v);
  }, []);

  const toggleMusic = useCallback(() => {
    const v = !audioManager.isMusicEnabled();
    audioManager.setMusicEnabled(v);
    setMusicEnabled(v);
  }, []);

  const toggleHaptics = useCallback(() => {
    const v = !soundManager.isHapticsEnabled();
    soundManager.setHapticsEnabled(v);
    setHapticsEnabled(v);
    if (v && navigator.vibrate) navigator.vibrate(25);
  }, []);

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
  const toggleZenMode = useCallback(() => setZenModeEnabled((v) => !v), []);
  const toggleMysteryMode = useCallback(() => setMysteryModeEnabled((v) => !v), []);
  const togglePrecisionMode = useCallback(
    () => setPrecisionModeEnabled((v) => !v),
    [],
  );
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
