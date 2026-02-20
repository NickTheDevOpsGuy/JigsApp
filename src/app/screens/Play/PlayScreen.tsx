/**
 * PlayScreen – main puzzle play UI.
 *
 * Responsibilities:
 * - Session loading (local or co-op via URL param)
 * - Puzzle state via usePlayScreenManager
 * - Pointer/touch handling, viewport zoom/pan
 * - Toasts (milestones, share, onboarding), modals, auto-save
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import posthog from "posthog-js";
import styles from "./PlayScreen.module.css";

import { PieceTray } from "@/components/PieceTray/PieceTray";
import { TutorialOverlay, useShouldShowTutorial } from "@/components/HowToPlay";
import type { Piece, PuzzleState } from "@/puzzle/types";
import { savePuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";

import {
  STORAGE_KEY,
  GRID_KEY,
  SHOW_DEBUG,
  parseGrid,
  getStoredPieceCut,
  setStoredPieceCut,
} from "./playScreenUtils";
import { createUndoRedoHandler } from "./playUtils";
import { getBestTime } from "./timeMode";
import { computeTimeDecayScore } from "./timeDecayScore";
import { computeSessionMetrics, saveLastSessionMetrics } from "./placementMetrics";
import { isDailyPuzzleSession } from "@/daily/dailyPuzzleCore";
import { usePlayScreenManager, type ResumeChoice } from "./hooks/usePlayScreenManager";
import { usePlayScreenEffects } from "./hooks/usePlayScreenEffects";
import { usePlayScreenShortcuts } from "./hooks/usePlayScreenShortcuts";
import { usePlayScreenUI } from "./hooks/usePlayScreenUI";
import { usePlayScreenAnimation } from "./hooks/usePlayScreenAnimation";
import { usePlayScreenTimer } from "./hooks/usePlayScreenTimer";
import { useTimeModeConfig } from "./hooks/useTimeModeConfig";
import { useShareResults } from "./hooks/useShareResults";
import { useDownloadImage } from "./hooks/useDownloadImage";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePointerHandlers } from "./hooks/usePointerHandlers";
import { useViewport } from "./hooks/useViewport";
import { useHaptics } from "./hooks/useHaptics";
import { useCoarsePointer } from "./hooks/useCoarsePointer";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "../../hooks/useBatterySaver";
import {
  CoopDebugPanel,
  CoopStatusIndicator,
  DragPreview,
  PlayHUD,
  PlayScreenModals,
  CompletionOverlay,
  ReplayModal,
  PauseOverlay,
  PlayToasts,
  HeaderMenu,
  PuzzleGradientBackground,
} from "./components";
import { ProfilerOverlay } from "./components";
import { CONFETTI_COLORS_BY_THEME } from "@/data/confettiColors";
import { usePuzzleSession, SESSION_ID_PARAM } from "./hooks/usePuzzleSession";
import { isSupabaseConfigured } from "@/supabase/client";

export function PlayScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get(SESSION_ID_PARAM);

  const localGrid = useMemo(() => parseGrid(localStorage.getItem(GRID_KEY)), []);
  const localImageUrl = localStorage.getItem(STORAGE_KEY) ?? "";

  const sessionResult = usePuzzleSession(localImageUrl, localGrid);
  const {
    sessionId,
    session,
    sessionLoading,
    creatingSession,
    realtimeStatus,
    isHost,
    createSession,
    copyShareLink,
    nativeShare,
    pushState,
    remoteState,
    clearRemoteState,
    retryJoin,
    joinError,
    lastEventTimestamp,
    lastDbWriteMs,
    channelName,
  } = sessionResult;

  const grid = session ? session.grid : localGrid;
  const cutType = getStoredPieceCut();

  useLayoutEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, session.imageUrl);
      localStorage.setItem(GRID_KEY, `${session.grid.rows}x${session.grid.cols}`);
      clearPuzzleState();
    }
  }, [session]);

  // ─── UI state (persisted in localStorage where applicable) ───
  const ui = usePlayScreenUI();
  const {
    pieceLockingEnabled,
    setPieceLockingEnabled,
    relaxedModeEnabled,
    toggleRelaxedMode,
    challengeModeEnabled,
    toggleChallengeMode,
    showGhostHint,
    setShowGhostHint,
    showAlignmentGrid,
    setShowAlignmentGrid,
    showGhostWhenIdle,
    toggleShowGhostWhenIdle,
    showGhostImage,
    toggleShowGhostImage,
    showEdgeHighlight,
    toggleShowEdgeHighlight,
    debug,
    showPreview,
    setShowPreview,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
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
    toggleSnapTolerance,
    immersiveMode,
    toggleImmersiveMode,
  } = ui;

  const { timeMode, setTimeMode, countdownMinutes, setCountdownMinutes } =
    useTimeModeConfig();
  const lastInteractionRef = React.useRef(performance.now());
  const [resumeChoice, setResumeChoice] = React.useState<ResumeChoice>(null);
  const { theme, setTheme } = useTheme();
  const batterySaverMode = useBatterySaver();
  const themeRef = React.useRef(theme);
  themeRef.current = theme;
  const haptics = useHaptics();
  const isCoarsePointer = useCoarsePointer();
  const [showStreakToast, setShowStreakToast] = React.useState(false);
  const [milestoneMessage, setMilestoneMessage] = React.useState<string | null>(null);
  const [borderCompleteToast, setBorderCompleteToast] = React.useState<string | null>(
    null,
  );
  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [immersiveReveal, setImmersiveReveal] = React.useState(false);
  const immersiveHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = React.useState(false);
  const [timeAttackCombo, setTimeAttackCombo] = React.useState(0);
  const [timeDecayCombo, setTimeDecayCombo] = React.useState(0);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = React.useState(false);
  const [showReplayModal, setShowReplayModal] = React.useState(false);
  const [cutKey, setCutKey] = React.useState(0);
  const [clusterMode, setClusterMode] = React.useState(false);
  const [selectedTrayIds, setSelectedTrayIds] = React.useState<Set<string>>(new Set());

  const viewportKey = grid != null ? `vp:${grid.rows}x${grid.cols}` : null;
  const viewport = useViewport(viewportKey);
  const snapScaleRef = React.useRef(1);
  snapScaleRef.current = viewport.viewport.scale;
  const elapsedMsRef = React.useRef(0);

  const perfStatsRef = React.useRef({
    fps: 0,
    drawsPerSec: 0,
    activeGroups: 0,
    snapCheckCount: 0,
    snapChecksPerSec: 0,
  });
  const wrongRotationHintRef = React.useRef<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>(null);
  const dragStartTimeRef = React.useRef<number | null>(null);
  const stateRef = React.useRef<PuzzleState | null>(null);
  const undoCountRef = React.useRef(0);
  const abandonCapturedRef = React.useRef(false);
  const rotationAnimRef = React.useRef<{
    pieceIds: string[];
    from: number;
    to: number;
    startMs: number;
  } | null>(null);
  const snapPositionAnimRef = React.useRef<{
    items: Array<{ id: string; from: { x: number; y: number }; to: { x: number; y: number } }>;
    startMs: number;
  } | null>(null);

  const managerResult = usePlayScreenManager(
    grid,
    pieceLockingEnabled,
    timeMode,
    countdownMinutes,
    lastInteractionRef,
    resumeChoice,
    cutKey,
    {
      haptic: hapticsEnabled ? haptics.vibrate : undefined,
      themeRef,
      onPlacementStreak: () => setShowStreakToast(true),
      initialSessionPieces: session?.state?.pieces?.length
        ? session.state.pieces
        : undefined,
      snapScaleRef,
      onSnapCheck: () => {
        perfStatsRef.current.snapCheckCount++;
      },
      wrongRotationHintRef,
      dragStartTimeRef,
      batterySaverMode,
      relaxedModeEnabled,
      isTimeAttack: timeMode === "timeAttack",
      isTimeDecay: timeMode === "timeDecay",
      onComboChange: timeMode === "timeAttack" ? setTimeAttackCombo : undefined,
      onTimeDecayComboChange: timeMode === "timeDecay" ? setTimeDecayCombo : undefined,
      elapsedMsRef,
      onPieceSnappedAnalytics: (timeToSnapMs) => {
        const g = stateRef.current?.grid;
        const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
        posthog.capture("piece_snapped", {
          grid_size: gridSize,
          device_type: isCoarsePointer ? "mobile" : "desktop",
          time_to_snap_ms: timeToSnapMs,
        });
      },
      snapPositionAnimRef,
    },
  );
  const {
    manager,
    state,
    puzzleKey,
    setState,
    elapsedSeconds,
    setElapsedSeconds,
    awaitingResumeChoice,
    isLoading,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    imgRef,
    popMapRef,
    lockMapRef,
    snapParticlesRef,
    timeAttackBonusRef,
    timeDecayBonusRef,
    placementSequenceRef,
    timeAttackLastPlacementRef,
    timeDecayLastPlacementRef,
  } = managerResult;

  stateRef.current = state;

  // Time Attack: reset combo display when idle > 4s (combo window)
  useEffect(() => {
    if (timeMode !== "timeAttack") return;
    const id = setInterval(() => {
      const last = timeAttackLastPlacementRef?.current;
      if (last != null && performance.now() - last > 4000) {
        setTimeAttackCombo((c) => (c > 0 ? 0 : c));
      }
    }, 500);
    return () => clearInterval(id);
  }, [timeMode, timeAttackLastPlacementRef]);

  // Time Decay: reset combo display when idle > 3.5s (combo window)
  useEffect(() => {
    if (timeMode !== "timeDecay") return;
    const id = setInterval(() => {
      const last = timeDecayLastPlacementRef?.current;
      if (last != null && performance.now() - last > 3500) {
        setTimeDecayCombo((c) => (c > 0 ? 0 : c));
      }
    }, 500);
    return () => clearInterval(id);
  }, [timeMode, timeDecayLastPlacementRef]);

  useEffect(() => {
    setTimeAttackCombo(0);
    setTimeDecayCombo(0);
  }, [puzzleKey]);

  useEffect(() => {
    undoCountRef.current = 0;
    abandonCapturedRef.current = false;
  }, [puzzleKey]);

  // Challenge mode: show full image for 5 seconds at puzzle start, then remove preview
  const [showChallengePreview, setShowChallengePreview] = React.useState(true);
  useEffect(() => {
    if (challengeModeEnabled) setShowChallengePreview(true);
  }, [puzzleKey, challengeModeEnabled]);
  useEffect(() => {
    if (
      !challengeModeEnabled ||
      !state ||
      isLoading ||
      state.isComplete ||
      !showChallengePreview
    )
      return;
    const id = setTimeout(() => setShowChallengePreview(false), 5000);
    return () => clearTimeout(id);
  }, [challengeModeEnabled, state, isLoading, showChallengePreview]);

  useEffect(() => {
    if (!isHost && sessionIdFromUrl && session && !sessionLoading) {
      posthog.capture("coop_join_success", {
        grid_size: session.grid ? `${session.grid.rows}x${session.grid.cols}` : "unknown",
        device_type: isCoarsePointer ? "mobile" : "desktop",
      });
    }
  }, [isHost, sessionIdFromUrl, session, sessionLoading, isCoarsePointer]);

  useEffect(() => {
    if (!isHost && sessionIdFromUrl && sessionLoading) {
      posthog.capture("coop_join_opened", { retry: false });
    }
  }, [isHost, sessionIdFromUrl, sessionLoading]);

  // ─── Onboarding & milestone toasts ───
  const placedForOnboarding = state?.placedCount ?? 0;
  const totalForOnboarding = state?.totalCount ?? 0;
  const onboarding = useOnboarding(placedForOnboarding, totalForOnboarding);

  useEffect(() => {
    if (onboarding.needsZoomTip && viewport.viewport.scale !== 1) {
      onboarding.dismissZoomTip();
    }
  }, [viewport.viewport.scale, onboarding.needsZoomTip, onboarding.dismissZoomTip]);

  const elapsedSecondsRef = React.useRef(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;
  React.useEffect(() => {
    elapsedMsRef.current = elapsedSeconds * 1000;
  }, [elapsedSeconds]);

  // Save placement speed metrics on completion
  useEffect(() => {
    if (!state?.isComplete || !state?.grid || !placementSequenceRef) return;
    const seq = placementSequenceRef.current;
    const sessionDurationMs = elapsedSeconds * 1000;
    const metrics = computeSessionMetrics(seq, sessionDurationMs);
    if (metrics) saveLastSessionMetrics(metrics, state.grid, seq, elapsedSeconds);
  }, [state?.isComplete, state?.grid, elapsedSeconds, placementSequenceRef]);

  usePlayScreenEffects({
    state,
    puzzleKey,
    elapsedSeconds,
    sessionId: sessionId ?? null,
    isCoarsePointer,
    timeMode,
    milestoneMessage,
    setMilestoneMessage,
    borderCompleteToast,
    setBorderCompleteToast,
    showStreakToast,
    setShowStreakToast,
    shareToast,
    setShareToast,
    batterySaverMode,
    themeRef,
  });

  // Auto-clear piece selection after 1s so the blue border doesn’t stay until another click
  useEffect(() => {
    if (selectedPieceId == null) return;
    const t = setTimeout(() => {
      setSelectedPieceId(null);
      selectedIdRef.current = null;
      bump();
    }, 1000);
    return () => clearTimeout(t);
  }, [selectedPieceId, setSelectedPieceId, selectedIdRef, bump]);

  const [showTutorial, dismissTutorial] = useShouldShowTutorial();

  useEffect(() => {
    viewport.reset();
  }, [puzzleKey, viewport.reset]);

  const getSelectable = useCallback(() => {
    if (!manager) return [];
    return manager.getState().pieces.filter((p) => !p.inTray && !p.isPlaced);
  }, [manager]);

  const selectCycle = useCallback(
    (dir: 1 | -1) => {
      if (!manager) return;
      const pieces = getSelectable().sort((a, b) => b.z - a.z);
      if (!pieces.length) {
        selectedIdRef.current = null;
        bump();
        return;
      }
      const idx = selectedIdRef.current
        ? pieces.findIndex((p) => p.id === selectedIdRef.current)
        : -1;
      const next = pieces[(idx + dir + pieces.length) % pieces.length];
      selectedIdRef.current = next.id;
      bump();
    },
    [manager, getSelectable, selectedIdRef, bump],
  );

  usePlayScreenShortcuts({
    manager,
    state,
    setState,
    isPaused,
    showShortcuts,
    showHelpChoice,
    showNewGameModal,
    showTutorial,
    selectedPieceId,
    setSelectedPieceId,
    setShowShortcuts,
    setShowHelpChoice,
    setShowNewGameModal,
    setShowPreview,
    setShowGhostHint,
    setIsPaused,
    setSoundEnabled,
    setHapticsEnabled,
    toggleFullscreen,
    selectCycle,
    selectedIdRef,
    rotationAnimRef,
    onUndoSuccess: () => {
      undoCountRef.current += 1;
    },
  });

  usePlayScreenTimer({
    state,
    isPaused,
    setIsPaused,
    timeMode,
    elapsedSeconds,
    setElapsedSeconds,
    lastInteractionRef,
  });

  // ─── Persistence (auto-save every N placements + debounce, co-op sync, tab hide flush) ───
  const SAVE_DEBOUNCE_MS = 500;
  const SAVE_EVERY_N_MOVES = 3;
  const lastSavedPlacedCountRef = React.useRef(0);

  useEffect(() => {
    if (!state || state.isComplete) return;
    const url = localStorage.getItem(STORAGE_KEY) || "";
    if (!url) return;
    const placed = state.placedCount ?? 0;

    // Save immediately every N placements
    const movesSinceSave = placed - lastSavedPlacedCountRef.current;
    if (movesSinceSave >= SAVE_EVERY_N_MOVES) {
      savePuzzleState(url, state.grid, state.pieces, elapsedSeconds, cutType);
      lastSavedPlacedCountRef.current = placed;
      return;
    }

    // Otherwise debounce
    const id = setTimeout(
      () => savePuzzleState(url, state.grid, state.pieces, elapsedSeconds, cutType),
      SAVE_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [state, elapsedSeconds, cutType]);

  // Co-op: push state to server when in session
  useEffect(() => {
    if (!sessionId || !state || state.isComplete) return;
    pushState(state.pieces, elapsedSeconds, state.isComplete);
  }, [sessionId, state, elapsedSeconds, pushState]);

  // Co-op: apply remote state when we receive an update from another participant
  useEffect(() => {
    if (!remoteState || !manager) return;
    try {
      manager.restoreFromSaved(remoteState.pieces);
      setState(manager.getState());
      setElapsedSeconds(remoteState.elapsedSeconds);
      clearRemoteState();
    } catch (e) {
      console.warn("Failed to apply remote state:", e);
      clearRemoteState();
    }
  }, [remoteState, manager, setState, setElapsedSeconds, clearRemoteState]);

  // Save before tab hide / refresh (visibilitychange, pagehide)
  useEffect(() => {
    const flush = () => {
      const s = stateRef.current;
      if (!s || s.isComplete) return;
      const url = localStorage.getItem(STORAGE_KEY) || "";
      if (!url) return;
      savePuzzleState(
        url,
        s.grid,
        s.pieces,
        elapsedSecondsRef.current,
        getStoredPieceCut(),
      );

      const placed = s.placedCount ?? 0;
      const total = s.totalCount ?? 1;
      const elapsed = elapsedSecondsRef.current;
      const undos = undoCountRef.current;
      const pct = total > 0 ? (placed / total) * 100 : 0;
      const looksAbandoned =
        placed === 0 ||
        (elapsed < 45 && pct < 5) ||
        (undos > 0 && placed > 0 && undos >= placed * 2);
      if (looksAbandoned && !abandonCapturedRef.current) {
        abandonCapturedRef.current = true;
        posthog.capture("puzzle_abandoned", {
          placed_count: placed,
          total_count: total,
          elapsed_seconds: elapsed,
          undo_count: undos,
          grid: s.grid ? `${s.grid.rows}x${s.grid.cols}` : "unknown",
        });
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => flush();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // First-snap celebration (lightweight confetti for onboarding)
  useEffect(() => {
    if (!onboarding.showFirstSnapToast) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion && !batterySaverMode) {
      import("canvas-confetti").then((confetti) => {
        const colors = CONFETTI_COLORS_BY_THEME[themeRef.current ?? "light"];
        confetti.default({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.6 },
          colors,
        });
      });
    }
  }, [onboarding.showFirstSnapToast, batterySaverMode]);

  // Analytics: exit before completion (on unmount)
  useEffect(() => {
    return () => {
      if (stateRef.current && !stateRef.current.isComplete) {
        posthog.capture("exit_before_completion");
      }
    };
  }, []);

  const didDragRef = React.useRef(false);
  const [dragPreview, setDragPreview] = React.useState<{
    clientX: number;
    clientY: number;
    pieceId: string;
  } | null>(null);
  const dragPreviewPieceIdRef = React.useRef<string | null>(null);
  dragPreviewPieceIdRef.current = dragPreview?.pieceId ?? null;

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    handleContextMenu,
  } = usePointerHandlers({
    manager,
    canvasRef,
    boardRef,
    trayRef,
    setState,
    selectCycle,
    setSelectedPieceId,
    selectedIdRef,
    bump,
    didDragRef,
    rotationAnimRef,
    haptic: haptics.vibrate,
    onDragPreview: setDragPreview,
    onPieceInteraction: () => {
      lastInteractionRef.current = performance.now();
    },
    onDragStarted: () => {
      const now = performance.now();
      dragStartTimeRef.current = now;
      const g = stateRef.current?.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("drag_started", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
      });
    },
    onDragEnded: () => {
      dragStartTimeRef.current = null;
    },
    screenToBoard: viewport.screenToBoard,
    isCoarsePointer,
    viewport,
  });

  const isCompetitiveOrDaily = isDailyPuzzleSession() || timeMode === "timeAttack";

  usePlayScreenAnimation({
    manager,
    setState,
    boardRef,
    canvasRef,
    imgRef,
    popMapRef,
    lockMapRef,
    selectedIdRef,
    dragPreviewPieceIdRef,
    snapParticlesRef,
    snapPositionAnimRef,
    themeRef,
    debug,
    showGhostHint,
    showAlignmentGrid,
    showGhostWhenIdle,
    showGhostImage,
    showEdgeHighlight,
    isCompetitiveOrDaily,
    challengeModeEnabled,
    lastInteractionRef,
    viewport: viewport.viewport,
    perfStatsRef,
    wrongRotationHintRef,
    rotationAnimRef,
  });

  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      lastInteractionRef.current = performance.now();
      manager.movePieceFromTray(pieceId);
      setState(manager.getState());
      selectedIdRef.current = pieceId;
      setSelectedPieceId(pieceId);
      bump();
    },
    [manager, setState, selectedIdRef, setSelectedPieceId, bump],
  );

  const handleTraySelectionToggle = useCallback((pieceId: string) => {
    setSelectedTrayIds((prev) => {
      const next = new Set(prev);
      if (next.has(pieceId)) next.delete(pieceId);
      else next.add(pieceId);
      return next;
    });
  }, []);

  const handleCreateCluster = useCallback(
    (pieceIds: string[]) => {
      if (!manager) return;
      manager.mergeTrayPiecesIntoCluster(pieceIds);
      setState(manager.getState());
      setSelectedTrayIds(new Set());
      setClusterMode(false);
      bump();
    },
    [manager, setState, bump],
  );

  const handleNewGame = useCallback(() => {
    clearPuzzleState();
    navigate("/new");
  }, [navigate]);

  const share = useShareResults({ elapsedSeconds, state });
  const handleSharePuzzle = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setShareToast(null);
    const gridSize = stateRef.current?.grid
      ? `${stateRef.current.grid.rows}x${stateRef.current.grid.cols}`
      : "unknown";
    try {
      if (sessionId) {
        posthog.capture("coop_share_clicked", { grid_size: gridSize });
        let ok = false;
        let usedNative = false;
        if (typeof navigator.share === "function") {
          ok = await nativeShare();
          usedNative = ok;
          if (!ok) ok = await copyShareLink();
        } else {
          ok = await copyShareLink();
        }
        if (ok) setShareToast(usedNative ? "Shared!" : "Link copied!");
        return;
      }
      posthog.capture("coop_share_clicked", { grid_size: gridSize });
      const s = stateRef.current;
      const pieces = s?.pieces
        ? s.pieces.map((p: Piece) => ({
            id: p.id,
            row: p.row,
            col: p.col,
            x: p.x,
            y: p.y,
            z: p.z,
            rotation: p.rotation,
            isPlaced: p.isPlaced,
            locked: p.locked,
            groupId: p.groupId,
            inTray: p.inTray,
          }))
        : [];
      const id = await createSession(
        s?.imageUrl ?? localStorage.getItem(STORAGE_KEY) ?? "",
        s?.grid ?? grid,
        pieces,
        elapsedSecondsRef.current,
      );
      if (!id) {
        setShareToast("Couldn't create share link. Check your connection.");
        return;
      }
      posthog.capture("coop_session_created", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
      });
      const shareUrl = `${window.location.origin}/play?${SESSION_ID_PARAM}=${id}`;
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: "Join my Phuzzle",
            text: "Solve this puzzle with me!",
            url: shareUrl,
          });
          setShareToast("Shared!");
        } catch {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setShareToast("Link copied!");
          } catch {
            setShareToast("Share failed. Link is in address bar.");
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareToast("Link copied!");
        } catch {
          setShareToast("Couldn't copy. Link is in address bar.");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Share failed:", err);
      setShareToast(msg || "Share failed. Try again.");
    }
  }, [sessionId, nativeShare, copyShareLink, createSession, grid, isCoarsePointer]);
  const handleDownloadImage = useDownloadImage({
    canvasRef,
    imgRef,
    state,
    elapsedSeconds,
  });

  const trayPieces = useMemo(
    () => (state ? state.pieces.filter((p) => p.inTray) : []),
    [state],
  );
  const dragPreviewPiece =
    dragPreview && state ? state.pieces.find((p) => p.id === dragPreview.pieceId) : null;
  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const isComplete = state?.isComplete ?? false;
  const showImmersiveUi = !immersiveMode || immersiveReveal;
  const scheduleImmersiveHide = React.useCallback(() => {
    if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
    immersiveHideTimerRef.current = setTimeout(() => {
      setImmersiveReveal(false);
    }, 2200);
  }, []);

  React.useEffect(
    () => () => {
      if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
    },
    [],
  );
  const handleImmersiveReveal = React.useCallback(() => {
    if (!immersiveMode) return;
    setImmersiveReveal(true);
    if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
  }, [immersiveMode]);
  const bestTimeSeconds =
    timeMode === "best" && state?.grid
      ? getBestTime(state.grid.rows, state.grid.cols, cutType)
      : null;

  // Early-exit UI for co-op join flow (must be after all hooks to avoid React #300)
  // Skip for host: they created the session, no need to show loading/error
  if (!isHost && sessionIdFromUrl && sessionLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingOverlay} aria-label="Loading session">
          <div className={styles.spinner} />
          <span>Joining puzzle session…</span>
        </div>
      </div>
    );
  }
  if (!isHost && sessionIdFromUrl && !session && !sessionLoading) {
    const debugInfo = `sessionId=${sessionIdFromUrl}\ntime=${new Date().toISOString()}`;
    const copyDebug = () => navigator.clipboard.writeText(debugInfo).catch(() => {});
    posthog.capture("coop_join_failed", {
      session_id: sessionIdFromUrl,
      error_type: joinError?.message ?? "session_not_found",
    });
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ padding: 24, maxWidth: 360 }}>
          <h2>Couldn't join session</h2>
          <p>
            The puzzle session may have expired, the link is invalid, or realtime is
            blocked (e.g. by a browser extension).
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                posthog.capture("coop_join_opened", { retry: true });
                retryJoin();
              }}
            >
              Try again
            </button>
            <button type="button" onClick={() => navigate("/")}>
              Back to menu
            </button>
            <button type="button" className={styles.secondaryButton} onClick={copyDebug}>
              Copy debug info
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} ref={pageRef}>
      <PuzzleGradientBackground img={imgRef.current} puzzleKey={puzzleKey} />
      {immersiveMode && (
        <div
          className={styles.immersivePeekTop}
          onPointerEnter={handleImmersiveReveal}
          onPointerDown={handleImmersiveReveal}
          role="button"
          tabIndex={-1}
          aria-label="Show menu and controls"
        />
      )}
      <div
        className={`${styles.topBarWrap} ${immersiveMode && !showImmersiveUi ? styles.immersiveTopHidden : ""}`}
        onPointerLeave={immersiveMode ? scheduleImmersiveHide : undefined}
      >
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <HeaderMenu
              title="Phuzzle"
              theme={theme}
              setTheme={setTheme}
              canUndo={!!(manager?.canUndo() && !isPaused && !state?.isComplete)}
              onUndo={createUndoRedoHandler(
                manager ?? null,
                "undo",
                setState,
                () => Boolean(manager?.canUndo()),
                soundManager.play.bind(soundManager),
                () => {
                  undoCountRef.current += 1;
                },
              )}
              canRedo={!!(manager?.canRedo() && !isPaused && !state?.isComplete)}
              onRedo={createUndoRedoHandler(
                manager ?? null,
                "redo",
                setState,
                () => Boolean(manager?.canRedo()),
                soundManager.play.bind(soundManager),
              )}
              timeMode={timeMode}
              setTimeMode={(modeOrFn) => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                setTimeMode(modeOrFn);
              }}
              countdownMinutes={countdownMinutes}
              setCountdownMinutes={setCountdownMinutes}
              showPreview={showPreview}
              soundEnabled={soundEnabled}
              hapticsEnabled={hapticsEnabled}
              pieceLockingEnabled={pieceLockingEnabled}
              showGhostHint={showGhostHint}
              showGhostWhenIdle={showGhostWhenIdle}
              showGhostImage={showGhostImage}
              onToggleGhostImage={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                toggleShowGhostImage();
              }}
              showEdgeHighlight={showEdgeHighlight}
              showAlignmentGrid={showAlignmentGrid}
              isFullscreen={ui.isFullscreen}
              canShowHaptics={isCoarsePointer && typeof navigator?.vibrate === "function"}
              canShowFullscreen={!!document.fullscreenEnabled}
              canShowShortcuts={!isCoarsePointer}
              canShowDebug={SHOW_DEBUG}
              debug={debug}
              onNewPuzzle={() => setShowNewGameModal(true)}
              onTogglePreview={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                setShowPreview((p) => !p);
              }}
              onToggleSound={toggleSound}
              onToggleHaptics={toggleHaptics}
              onTogglePieceLocking={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                setPieceLockingEnabled((p) => !p);
              }}
              relaxedModeEnabled={relaxedModeEnabled}
              onToggleRelaxedMode={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                toggleRelaxedMode();
              }}
              challengeModeEnabled={challengeModeEnabled}
              onToggleChallengeMode={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                toggleChallengeMode();
              }}
              onToggleGhostHint={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                setShowGhostHint((g) => !g);
              }}
              onToggleGhostWhenIdle={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                toggleShowGhostWhenIdle();
              }}
              onToggleEdgeHighlight={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                toggleShowEdgeHighlight();
              }}
              onToggleAlignmentGrid={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                setShowAlignmentGrid((a) => !a);
              }}
              onToggleFullscreen={toggleFullscreen}
              onCenterBoard={() => viewport.reset()}
              onZoomIn={() => viewport.zoomIn()}
              onZoomOut={() => viewport.zoomOut()}
              onShowShortcuts={() => setShowShortcuts(true)}
              onShowHowToPlay={() => setShowHowToPlay(true)}
              onToggleDebug={toggleDebug}
              onTogglePerfOverlay={togglePerfOverlay}
              onToggleSnapTolerance={toggleSnapTolerance}
              immersiveMode={immersiveMode}
              onToggleImmersiveMode={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                toggleImmersiveMode();
              }}
              onSharePuzzle={isSupabaseConfigured() ? handleSharePuzzle : undefined}
              shareDisabled={creatingSession}
              onOpenThemeModal={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                setShowThemeModal(true);
              }}
              onResetStats={() => setShowResetStatsConfirm(true)}
              onClearCache={() => setShowClearCacheConfirm(true)}
            />
          </div>
          <div className={styles.topBarCenter}>
            {sessionId && (
              <CoopStatusIndicator
                status={realtimeStatus}
                connectedCount={sessionResult.connectedCount}
              />
            )}
            <PlayHUD
              elapsedSeconds={elapsedSeconds}
              placedCount={placed}
              totalPieces={total}
              isPaused={isPaused}
              isComplete={isComplete}
              timeMode={timeMode}
              countdownMinutes={countdownMinutes}
              bestTimeSeconds={bestTimeSeconds}
              timeDecayScore={
                timeMode === "timeDecay" && state?.grid
                  ? computeTimeDecayScore(
                      elapsedSeconds,
                      state.grid.rows * state.grid.cols,
                      timeDecayBonusRef?.current ?? 0,
                    )
                  : undefined
              }
              timeAttackCombo={timeMode === "timeAttack" ? timeAttackCombo : 0}
              timeDecayCombo={timeMode === "timeDecay" ? timeDecayCombo : 0}
              onTogglePause={() => setIsPaused((p) => !p)}
            />
          </div>
        </div>
      </div>

      <PlayScreenModals
        awaitingResumeChoice={awaitingResumeChoice}
        resumeChoice={resumeChoice}
        setResumeChoice={setResumeChoice}
        showHelpChoice={showHelpChoice}
        setShowHelpChoice={setShowHelpChoice}
        onShowHowToPlay={() => setShowHowToPlay(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
        showThemeModal={showThemeModal}
        setShowThemeModal={setShowThemeModal}
        showNewGameModal={showNewGameModal}
        setShowNewGameModal={setShowNewGameModal}
        showResetStatsConfirm={showResetStatsConfirm}
        setShowResetStatsConfirm={setShowResetStatsConfirm}
        showClearCacheConfirm={showClearCacheConfirm}
        setShowClearCacheConfirm={setShowClearCacheConfirm}
        hapticsEnabled={hapticsEnabled}
        onNewGame={handleNewGame}
      />

      <div className={styles.main} ref={mainRef}>
        <div className={styles.board} ref={boardRef}>
          {isLoading && (
            <div className={styles.loadingOverlay} aria-label="Loading puzzle">
              <div className={styles.spinner} />
              <span>Loading puzzle…</span>
            </div>
          )}
          <canvas
            key={puzzleKey}
            className={styles.canvas}
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handleLostPointerCapture}
            onContextMenu={handleContextMenu}
            onWheel={(e) => viewport.handleWheel(e, boardRef.current)}
          />
          {showChallengePreview &&
            challengeModeEnabled &&
            imgRef.current &&
            !state?.isComplete && (
              <div
                className={styles.challengePreviewOverlay}
                role="img"
                aria-label="Puzzle preview - memorize the image"
              >
                <img
                  src={imgRef.current.src}
                  alt=""
                  className={styles.challengePreviewImage}
                />
                <span className={styles.challengePreviewLabel}>Memorize… 5s</span>
              </div>
            )}
          {showPreview && imgRef.current && (
            <div className={styles.previewOverlay}>
              <div className={styles.previewWithRing}>
                <svg className={styles.previewRing} viewBox="0 0 128 128" aria-hidden>
                  <circle
                    className={styles.previewRingBg}
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    strokeWidth="4"
                  />
                  <circle
                    className={styles.previewRingFill}
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    strokeWidth="4"
                    strokeDasharray={377}
                    strokeDashoffset={
                      377 * (1 - (state && total > 0 ? Math.min(1, placed / total) : 0))
                    }
                  />
                </svg>
                <img
                  src={imgRef.current.src}
                  alt="Puzzle preview"
                  className={styles.previewImage}
                />
              </div>
            </div>
          )}
          {isPaused && (
            <PauseOverlay
              onResume={() => setIsPaused(false)}
              isCountdownExpired={
                timeMode === "countdown" && elapsedSeconds <= 0 && !isComplete && isPaused
              }
              onNewPuzzle={
                timeMode === "countdown" && elapsedSeconds <= 0 && !isComplete && isPaused
                  ? handleNewGame
                  : undefined
              }
            />
          )}
          {isComplete && (
            <CompletionOverlay
              elapsedSeconds={elapsedSeconds}
              countdownMinutes={countdownMinutes}
              timeAttackBonus={timeAttackBonusRef?.current ?? 0}
              timeDecayBonus={timeDecayBonusRef?.current ?? 0}
              grid={state?.grid}
              imageUrl={
                localStorage.getItem(STORAGE_KEY) || imgRef.current?.src || undefined
              }
              undoCount={undoCountRef.current}
              timeMode={timeMode}
              isNewBest={
                timeMode === "best" &&
                state?.grid != null &&
                (bestTimeSeconds == null || elapsedSeconds < bestTimeSeconds)
              }
              isDaily={isDailyPuzzleSession()}
              isTimeAttack={timeMode === "timeAttack"}
              isTimeDecay={timeMode === "timeDecay"}
              shareUrls={share.shareUrls}
              copied={share.copied}
              canNativeShare={share.canNativeShare}
              onOpenShareWindow={share.openShareWindow}
              onCopyResults={share.handleCopyResults}
              onNativeShare={share.handleNativeShare}
              onDownloadImage={handleDownloadImage}
              onNewPuzzle={handleNewGame}
              onMenu={() => navigate("/")}
              onReplay={() => setShowReplayModal(true)}
              cutType={cutType}
              onReplayWithCut={(cut) => {
                setStoredPieceCut(cut);
                clearPuzzleState();
                setCutKey((k) => k + 1);
              }}
            />
          )}
        </div>
      </div>

      {showReplayModal && state && (
        <ReplayModal
          isOpen={showReplayModal}
          onClose={() => setShowReplayModal(false)}
          state={state}
          imageUrl={localStorage.getItem(STORAGE_KEY) || imgRef.current?.src || ""}
          placementSequence={placementSequenceRef?.current ?? []}
        />
      )}

      {immersiveMode && (
        <div
          className={styles.immersivePeekBottom}
          onPointerEnter={handleImmersiveReveal}
          onPointerDown={handleImmersiveReveal}
          role="button"
          tabIndex={-1}
          aria-label="Show piece drawer"
        />
      )}
      <div
        className={`${styles.trayWrap} ${immersiveMode && !showImmersiveUi ? styles.immersiveHidden : ""}`}
        onPointerLeave={immersiveMode ? scheduleImmersiveHide : undefined}
      >
        <PieceTray
          ref={trayRef}
          pieces={trayPieces}
          image={imgRef.current}
          grid={state?.grid ?? grid}
          puzzleKey={puzzleKey}
          onPieceClick={handleTrayPieceClick}
          clusterMode={clusterMode}
          selectedIds={selectedTrayIds}
          onSelectionToggle={handleTraySelectionToggle}
          onCreateCluster={handleCreateCluster}
          onClusterModeToggle={() => {
            setClusterMode((c) => !c);
            setSelectedTrayIds(new Set());
          }}
        />
      </div>

      <TutorialOverlay
        isOpen={showTutorial || showHowToPlay}
        onComplete={() => {
          if (showTutorial) dismissTutorial();
          setShowHowToPlay(false);
        }}
        showSkipLink={showTutorial}
      />

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {dragPreviewPiece && dragPreview && imgRef.current && (
        <DragPreview
          clientX={dragPreview.clientX}
          clientY={dragPreview.clientY}
          piece={dragPreviewPiece}
          image={imgRef.current}
          grid={state!.grid}
        />
      )}

      <PlayToasts
        onboarding={onboarding}
        placed={placed}
        showFirstSnapToast={onboarding.showFirstSnapToast}
        showStreakToast={showStreakToast}
        milestoneMessage={milestoneMessage}
        borderCompleteToast={borderCompleteToast}
        shareToast={shareToast}
        classNames={{
          engagementToast: styles.engagementToast,
          engagementToastStartTip: styles.engagementToastStartTip,
          toastDismiss: styles.toastDismiss,
          onboardingOverlay: styles.onboardingOverlay,
          onboardingOverlayTray: styles.onboardingOverlayTray,
        }}
      />
      {(import.meta.env.DEV || SHOW_DEBUG) && (
        <ProfilerOverlay statsRef={perfStatsRef} visible={debug.showPerfOverlay} />
      )}
      {sessionId && (
        <CoopDebugPanel
          sessionId={sessionId}
          connectedCount={sessionResult.connectedCount}
          lastEventTimestamp={lastEventTimestamp}
          lastDbWriteMs={lastDbWriteMs}
          channelName={channelName}
        />
      )}
    </div>
  );
}

export default PlayScreen;
