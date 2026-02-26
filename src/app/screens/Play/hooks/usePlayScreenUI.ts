/**
 * usePlayScreenUI – UI state (ghost hint, alignment grid, debug, etc.) with localStorage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { soundManager } from "@/audio/sounds";
import { audioManager } from "@/audio/audioManager";
import type { PieceCutType } from "@/puzzle/types";
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

export function usePlayScreenUI() {
  const [pieceLockingEnabled, setPieceLockingEnabled] = useState(() => {
    try {
      return localStorage.getItem(PIECE_LOCKING_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [showGhostHint, setShowGhostHint] = useState(() => {
    try {
      return localStorage.getItem(GHOST_HINT_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [showAlignmentGrid, setShowAlignmentGrid] = useState(() => {
    try {
      return localStorage.getItem(ALIGNMENT_GRID_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [showGhostWhenIdle, setShowGhostWhenIdle] = useState(() => {
    try {
      return localStorage.getItem(GHOST_WHEN_IDLE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [showEdgeHighlight, setShowEdgeHighlight] = useState(() => {
    try {
      return localStorage.getItem(EDGE_HIGHLIGHT_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [showClusterOutline, setShowClusterOutline] = useState(() => {
    try {
      return localStorage.getItem(CLUSTER_OUTLINE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [deliberateDetachEnabled, setDeliberateDetachEnabled] = useState(() => {
    try {
      return localStorage.getItem(DELIBERATE_DETACH_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [relaxedModeEnabled, setRelaxedModeEnabled] = useState(() => {
    try {
      return localStorage.getItem(RELAXED_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [driftModeEnabled, setDriftModeEnabled] = useState(() => {
    try {
      return localStorage.getItem(DRIFT_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [snapToleranceOverride, setSnapToleranceOverride] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SNAP_TOLERANCE_OVERRIDE_KEY);
      const parsed = raw != null ? Number(raw) : 1;
      if (!Number.isFinite(parsed)) return 1;
      return Math.min(1.6, Math.max(0.6, parsed));
    } catch {
      return 1;
    }
  });

  const [pieceCutType, setPieceCutType] = useState<PieceCutType>(() => {
    try {
      const raw = localStorage.getItem(CUT_TYPE_KEY);
      return raw === "irregular" || raw === "hard" ? raw : "classic";
    } catch {
      return "classic";
    }
  });

  const [progressiveRevealMode, setProgressiveRevealMode] = useState(() => {
    try {
      return localStorage.getItem(PROGRESSIVE_REVEAL_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [debug, setDebug] = useState<DebugFlags>({
    showGrid: false,
    showBounds: false,
    showIds: false,
    showPerfOverlay: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState(() => {
    try {
      return localStorage.getItem(IMMERSIVE_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });
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
      localStorage.setItem(PIECE_LOCKING_KEY, pieceLockingEnabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, [pieceLockingEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(GHOST_HINT_KEY, showGhostHint ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showGhostHint]);

  useEffect(() => {
    try {
      localStorage.setItem(ALIGNMENT_GRID_KEY, showAlignmentGrid ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showAlignmentGrid]);

  useEffect(() => {
    try {
      localStorage.setItem(GHOST_WHEN_IDLE_KEY, showGhostWhenIdle ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showGhostWhenIdle]);

  useEffect(() => {
    try {
      localStorage.setItem(EDGE_HIGHLIGHT_KEY, showEdgeHighlight ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showEdgeHighlight]);

  useEffect(() => {
    try {
      localStorage.setItem(CLUSTER_OUTLINE_KEY, showClusterOutline ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showClusterOutline]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DELIBERATE_DETACH_KEY,
        deliberateDetachEnabled ? "true" : "false",
      );
    } catch {
      // ignore
    }
  }, [deliberateDetachEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(RELAXED_MODE_KEY, relaxedModeEnabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, [relaxedModeEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(DRIFT_MODE_KEY, driftModeEnabled ? "true" : "false");
    } catch {
      // ignore
    }
  }, [driftModeEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(SNAP_TOLERANCE_OVERRIDE_KEY, String(snapToleranceOverride));
    } catch {
      // ignore
    }
  }, [snapToleranceOverride]);

  useEffect(() => {
    try {
      localStorage.setItem(CUT_TYPE_KEY, pieceCutType);
    } catch {
      // ignore
    }
  }, [pieceCutType]);

  useEffect(() => {
    try {
      localStorage.setItem(
        PROGRESSIVE_REVEAL_KEY,
        progressiveRevealMode ? "true" : "false",
      );
    } catch {
      // ignore
    }
  }, [progressiveRevealMode]);

  useEffect(() => {
    try {
      localStorage.setItem(IMMERSIVE_MODE_KEY, immersiveMode ? "true" : "false");
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
