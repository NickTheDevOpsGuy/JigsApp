import { useCallback, useEffect, useRef, useState } from "react";
import { soundManager } from "@/audio/sounds";
import {
  PIECE_LOCKING_KEY,
  GHOST_HINT_KEY,
  PIECE_BORDERS_KEY,
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

  const [showPieceBorders, setShowPieceBorders] = useState(() => {
    try {
      return localStorage.getItem(PIECE_BORDERS_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [debug, setDebug] = useState<DebugFlags>({
    showGrid: false,
    showBounds: false,
    showIds: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() =>
    typeof window !== "undefined" ? soundManager.isEnabled() : true,
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
      localStorage.setItem(PIECE_BORDERS_KEY, showPieceBorders ? "true" : "false");
    } catch {
      // ignore
    }
  }, [showPieceBorders]);

  useEffect(() => {
    setSoundEnabled(soundManager.isEnabled());
    setHapticsEnabled(soundManager.isHapticsEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const v = !soundManager.isEnabled();
    soundManager.setEnabled(v);
    setSoundEnabled(v);
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

  return {
    pieceLockingEnabled,
    setPieceLockingEnabled,
    showGhostHint,
    setShowGhostHint,
    showPieceBorders,
    setShowPieceBorders,
    debug,
    setDebug,
    showPreview,
    setShowPreview,
    soundEnabled,
    setSoundEnabled,
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
    selectedPieceId,
    setSelectedPieceId,
    pageRef,
    selectedIdRef,
    bump,
    toggleFullscreen,
    toggleSound,
    toggleHaptics,
    toggleDebug,
  };
}
