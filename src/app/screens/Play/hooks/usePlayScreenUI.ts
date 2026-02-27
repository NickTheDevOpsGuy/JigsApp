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
import {
  PIECE_LOCKING_KEY,
  CUT_TYPE_KEY,
  PROGRESSIVE_REVEAL_KEY,
  GHOST_HINT_KEY,
  IMMERSIVE_MODE_KEY,
  ALIGNMENT_GRID_KEY,
  GHOST_WHEN_IDLE_KEY,
  EDGE_HIGHLIGHT_KEY,
  CLUSTER_OUTLINE_KEY,
  DELIBERATE_DETACH_KEY,
  RELAXED_MODE_KEY,
  DRIFT_MODE_KEY,
  SNAP_TOLERANCE_OVERRIDE_KEY,
  type DebugFlags,
} from "../playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { getPlayScreenUIStorageInitial, DEBUG_INITIAL } from "./playScreenUIInitial";

export function usePlayScreenUI() {
  const storageInitial = getPlayScreenUIStorageInitial();

  const [pieceLockingEnabled, setPieceLockingEnabled] = useState(
    storageInitial.pieceLockingEnabled,
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
    try {
      safeLocalStorage.setItem(PIECE_LOCKING_KEY, pieceLockingEnabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, [pieceLockingEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(GHOST_HINT_KEY, showGhostHint ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showGhostHint]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(ALIGNMENT_GRID_KEY, showAlignmentGrid ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showAlignmentGrid]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(GHOST_WHEN_IDLE_KEY, showGhostWhenIdle ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showGhostWhenIdle]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(EDGE_HIGHLIGHT_KEY, showEdgeHighlight ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showEdgeHighlight]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        CLUSTER_OUTLINE_KEY,
        showClusterOutline ? "true" : "false",
      );
    } catch {
      // ignore
    }
  }, [showClusterOutline]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        DELIBERATE_DETACH_KEY,
        deliberateDetachEnabled ? "true" : "false",
      );
    } catch {
      // ignore
    }
  }, [deliberateDetachEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(RELAXED_MODE_KEY, relaxedModeEnabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, [relaxedModeEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(DRIFT_MODE_KEY, driftModeEnabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, [driftModeEnabled]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        SNAP_TOLERANCE_OVERRIDE_KEY,
        String(snapToleranceOverride),
      );
    } catch {
      // ignore
    }
  }, [snapToleranceOverride]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(CUT_TYPE_KEY, pieceCutType);
    } catch {
      // ignore
    }
  }, [pieceCutType]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(
        PROGRESSIVE_REVEAL_KEY,
        progressiveRevealMode ? "true" : "false",
      );
    } catch {
      // ignore
    }
  }, [progressiveRevealMode]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem(IMMERSIVE_MODE_KEY, immersiveMode ? "true" : "false");
    } catch {
      // ignore
    }
  }, [immersiveMode]);

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

  const setDailyPreferredModifier = useCallback((modifier: DailyVisualModifier) => {
    setDailyPreferredModifierState(modifier);
    persistDailyPreferredModifier(modifier);
  }, []);

  return {
    pieceLockingEnabled,
    setPieceLockingEnabled,
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
