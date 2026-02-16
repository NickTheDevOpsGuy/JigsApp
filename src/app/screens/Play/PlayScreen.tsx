/**
 * PlayScreen – main puzzle play UI.
 *
 * Responsibilities:
 * - Session loading (local or co-op via URL param)
 * - Puzzle state via usePlayScreenManager
 * - Pointer/touch handling, viewport zoom/pan
 * - Toasts (milestones, share, onboarding), modals, auto-save
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import posthog from "posthog-js";
import styles from "./PlayScreen.module.css";

import { PieceTray } from "@/components/PieceTray/PieceTray";
import { ConfirmModal } from "@/components/Modal/Modal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal";
import { TutorialOverlay, useShouldShowTutorial } from "@/components/HowToPlay";
import type { Piece, PuzzleState } from "@/puzzle/types";
import { savePuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { consumeCurrentPuzzleId, recordPuzzleCompletion } from "@/data/packCompletion";
import { soundManager } from "@/audio/sounds";
import { ShortcutsModal } from "@/components/ShortcutsModal/ShortcutsModal";
import { ThemeModal } from "@/components/ThemeModal";

import { STORAGE_KEY, GRID_KEY, SHOW_DEBUG, parseGrid } from "./playScreenUtils";
import { createUndoRedoHandler } from "./playUtils";
import { getBestTime, BEST_TIME_PREFIX } from "./timeMode";
import { isDailyPuzzleSession } from "@/daily/dailyPuzzleCore";
import { usePlayScreenManager, type ResumeChoice } from "./hooks/usePlayScreenManager";
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
  DragPreview,
  PlayHUD,
  CompletionOverlay,
  PauseOverlay,
  PlayToasts,
  TopBarButtons,
  HeaderMenu,
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
    createSession,
    copyShareLink,
    nativeShare,
    pushState,
    remoteState,
    clearRemoteState,
  } = sessionResult;

  const grid = session ? session.grid : localGrid;

  useLayoutEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, session.imageUrl);
      localStorage.setItem(GRID_KEY, `${session.grid.rows}x${session.grid.cols}`);
      clearPuzzleState();
    }
  }, [session]);

  if (sessionIdFromUrl && sessionLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingOverlay} aria-label="Loading session">
          <div className={styles.spinner} />
          <span>Joining puzzle session…</span>
        </div>
      </div>
    );
  }

  if (sessionIdFromUrl && !session && !sessionLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={{ padding: 24 }}>
          <h2>Session not found</h2>
          <p>The puzzle session may have expired or the link is invalid.</p>
          <button type="button" onClick={() => navigate("/")}>
            Back to menu
          </button>
        </div>
      </div>
    );
  }

  // ─── UI state (persisted in localStorage where applicable) ───
  const ui = usePlayScreenUI();
  const {
    pieceLockingEnabled,
    setPieceLockingEnabled,
    showGhostHint,
    setShowGhostHint,
    showAlignmentGrid,
    setShowAlignmentGrid,
    showGhostWhenIdle,
    toggleShowGhostWhenIdle,
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
  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const lastMilestoneRef = React.useRef<number>(0);
  const [immersiveReveal, setImmersiveReveal] = React.useState(false);
  const immersiveHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = React.useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = React.useState(false);

  const viewportKey = grid != null ? `vp:${grid.rows}x${grid.cols}` : null;
  const viewport = useViewport(viewportKey);
  const snapScaleRef = React.useRef(1);
  snapScaleRef.current = viewport.viewport.scale;

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

  const managerResult = usePlayScreenManager(
    grid,
    pieceLockingEnabled,
    timeMode,
    countdownMinutes,
    lastInteractionRef,
    resumeChoice,
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
      onPieceSnappedAnalytics: (timeToSnapMs) => {
        const g = stateRef.current?.grid;
        const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
        posthog.capture("piece_snapped", {
          grid_size: gridSize,
          device_type: isCoarsePointer ? "mobile" : "desktop",
          time_to_snap_ms: timeToSnapMs,
        });
      },
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
  } = managerResult;

  stateRef.current = state;

  useEffect(() => {
    undoCountRef.current = 0;
    abandonCapturedRef.current = false;
  }, [puzzleKey]);

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

  // Milestone callouts at 25%, 33%, 50%, 66%, 75%
  const MILESTONE_THRESHOLDS = [25, 33, 50, 66, 75] as const;
  const milestoneMessages: Record<number, string> = {
    25: "🥉 25% Early win.",
    33: "📈 33% Making progress.",
    50: "🥈 50% Big motivation spike.",
    66: "💪 66% Momentum building.",
    75: "🥇 75% Almost there!",
  };
  useEffect(() => {
    if (!state || state.isComplete) return;
    const placed = state.placedCount ?? 0;
    const total = state.totalCount ?? 0;
    if (total === 0) return;
    const pct = (placed / total) * 100;
    const hit = MILESTONE_THRESHOLDS.find(
      (t) => pct >= t && lastMilestoneRef.current < t,
    );
    if (hit) {
      lastMilestoneRef.current = hit;
      setMilestoneMessage(milestoneMessages[hit]);
      const g = state.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("milestone_popup_shown", {
        milestone_percent: hit,
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
      });
    }
  }, [
    state?.placedCount,
    state?.totalCount,
    state?.isComplete,
    state?.grid,
    isCoarsePointer,
    timeMode,
  ]);

  useEffect(() => {
    if (!milestoneMessage) return;
    const t = setTimeout(() => setMilestoneMessage(null), 2000);
    return () => clearTimeout(t);
  }, [milestoneMessage]);

  useEffect(() => {
    if (!state) return;
    if (state.placedCount === 0) lastMilestoneRef.current = 0;
  }, [state?.placedCount, puzzleKey]);

  // Record pack puzzle completion when puzzle is finished
  const completionCapturedRef = useRef(false);
  useEffect(() => {
    if (!state?.isComplete) return;
    const puzzleId = consumeCurrentPuzzleId();
    if (puzzleId) recordPuzzleCompletion(puzzleId);
    if (!completionCapturedRef.current) {
      completionCapturedRef.current = true;
      const g = state?.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("puzzle_complete", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
        elapsed_seconds: elapsedSeconds,
      });
    }
  }, [state?.isComplete, state?.grid, elapsedSeconds, isCoarsePointer, timeMode]);

  // Analytics: on_fire_toast_shown when placement streak toast appears
  const onFireCapturedRef = useRef(false);
  useEffect(() => {
    if (showStreakToast && !onFireCapturedRef.current) {
      onFireCapturedRef.current = true;
      const g = state?.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("on_fire_toast_shown", {
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
      });
    }
  }, [showStreakToast, state?.grid, isCoarsePointer, timeMode]);

  useEffect(() => {
    if (!showStreakToast) return;
    const t = setTimeout(() => setShowStreakToast(false), 2000);
    return () => clearTimeout(t);
  }, [showStreakToast]);

  useEffect(() => {
    if (!shareToast) return;
    const t = setTimeout(() => setShareToast(null), 3000);
    return () => clearTimeout(t);
  }, [shareToast]);

  // Reset analytics refs when starting a new puzzle
  useEffect(() => {
    firstSnapCapturedRef.current = false;
    onFireCapturedRef.current = false;
    completionCapturedRef.current = false;
  }, [puzzleKey]);

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
      savePuzzleState(url, state.grid, state.pieces, elapsedSeconds);
      lastSavedPlacedCountRef.current = placed;
      return;
    }

    // Otherwise debounce
    const id = setTimeout(
      () => savePuzzleState(url, state.grid, state.pieces, elapsedSeconds),
      SAVE_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [state, elapsedSeconds]);

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
      savePuzzleState(url, s.grid, s.pieces, elapsedSecondsRef.current);

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

  // Analytics: first piece placed
  const firstSnapCapturedRef = useRef(false);
  useEffect(() => {
    if (!state || firstSnapCapturedRef.current) return;
    const placed = state.placedCount ?? 0;
    if (placed >= 1) {
      firstSnapCapturedRef.current = true;
      const g = state.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("first_piece_placed", {
        time_to_first_snap_seconds: elapsedSeconds,
        grid_size: gridSize,
        device_type: isCoarsePointer ? "mobile" : "desktop",
        time_mode: timeMode,
      });
    }
  }, [state?.placedCount, state?.grid, elapsedSeconds, isCoarsePointer, timeMode]);

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
    viewport,
  });

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
    debug,
    showGhostHint,
    showAlignmentGrid,
    showGhostWhenIdle,
    showEdgeHighlight,
    lastInteractionRef,
    viewport: viewport.viewport,
    perfStatsRef,
    wrongRotationHintRef,
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

  const handleNewGame = useCallback(() => {
    clearPuzzleState();
    navigate("/new");
  }, [navigate]);

  const share = useShareResults({ elapsedSeconds, state });
  const handleSharePuzzle = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setShareToast(null);
    try {
      if (sessionId) {
        const ok = await (typeof navigator.share === "function"
          ? nativeShare()
          : copyShareLink());
        if (ok && typeof navigator.share !== "function") {
          setShareToast("Link copied!");
        }
        return;
      }
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
      const shareUrl = `${window.location.origin}/play?${SESSION_ID_PARAM}=${id}`;
      try {
        await (typeof navigator.share === "function"
          ? navigator.share({
              title: "Join my Phuzzle",
              text: "Solve this puzzle with me!",
              url: shareUrl,
            })
          : navigator.clipboard.writeText(shareUrl));
        if (typeof navigator.share !== "function") {
          setShareToast("Link copied!");
        }
      } catch {
        /* user cancelled or failed */
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Share failed:", err);
      setShareToast(msg || "Share failed. Try again.");
    }
  }, [sessionId, nativeShare, copyShareLink, createSession, grid]);
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
  const left = Math.max(0, total - placed);
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
      ? getBestTime(state.grid.rows, state.grid.cols)
      : null;

  return (
    <div className={styles.page} ref={pageRef}>
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
              immersiveMode={immersiveMode}
              onToggleImmersiveMode={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                toggleImmersiveMode();
              }}
              onSharePuzzle={isSupabaseConfigured() ? handleSharePuzzle : undefined}
              onOpenThemeModal={() => {
                if (hapticsEnabled && navigator.vibrate) navigator.vibrate(10);
                setShowThemeModal(true);
              }}
              onResetStats={() => setShowResetStatsConfirm(true)}
              onClearCache={() => setShowClearCacheConfirm(true)}
            />
          </div>
          <div className={styles.topBarCenter}>
            <PlayHUD
              elapsedSeconds={elapsedSeconds}
              piecesLeft={left}
              totalPieces={total}
              isPaused={isPaused}
              isComplete={isComplete}
              timeMode={timeMode}
              countdownMinutes={countdownMinutes}
              bestTimeSeconds={bestTimeSeconds}
              onTogglePause={() => setIsPaused((p) => !p)}
            />
          </div>
          <TopBarButtons
            showPreview={showPreview}
            soundEnabled={soundEnabled}
            isFullscreen={ui.isFullscreen}
            showDebug={SHOW_DEBUG}
            isCoarsePointer={isCoarsePointer}
            onTogglePreview={() => setShowPreview((p) => !p)}
            onToggleSound={toggleSound}
            onToggleFullscreen={toggleFullscreen}
            onShowShortcuts={() => setShowShortcuts(true)}
            onToggleDebug={toggleDebug}
            onNewPuzzle={() => setShowNewGameModal(true)}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={awaitingResumeChoice && resumeChoice === null}
        onClose={() => setResumeChoice("fresh")}
        onConfirm={() => setResumeChoice("resume")}
        title="Resume Your Puzzle?"
        message="You have a puzzle in progress. Would you like to continue where you left off?"
        confirmText="Resume"
        cancelText="Start Fresh"
        variant="default"
        primaryOnlyConfirm
      />

      <HelpChoiceModal
        isOpen={showHelpChoice}
        onClose={() => setShowHelpChoice(false)}
        onHowToPlay={() => setShowHowToPlay(true)}
        onKeyboardShortcuts={() => setShowShortcuts(true)}
      />

      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        hapticsEnabled={hapticsEnabled}
      />

      <ConfirmModal
        isOpen={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onConfirm={handleNewGame}
        title="Start New Puzzle?"
        message="Your current progress will be lost. Are you sure you want to start a new puzzle?"
        confirmText="New Puzzle"
        cancelText="Keep Playing"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showResetStatsConfirm}
        onClose={() => setShowResetStatsConfirm(false)}
        onConfirm={() => {
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k?.startsWith(BEST_TIME_PREFIX)) keysToRemove.push(k);
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
          } catch {
            /* ignore */
          }
          setShowResetStatsConfirm(false);
        }}
        title="Reset Local Stats?"
        message="This will clear all local best times. This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showClearCacheConfirm}
        onClose={() => setShowClearCacheConfirm(false)}
        onConfirm={() => {
          clearPuzzleState();
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (
                k?.startsWith("phuzzle:viewport:") ||
                k === "phuzzle:puzzleState" ||
                k === "phuzzle:puzzleStateBackup"
              )
                keysToRemove.push(k);
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
          } catch {
            /* ignore */
          }
          setShowClearCacheConfirm(false);
          navigate("/");
        }}
        title="Clear Cache?"
        message="This will clear saved puzzle state and viewport settings. You will return to the menu."
        confirmText="Clear"
        cancelText="Cancel"
        variant="danger"
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
          {showPreview && imgRef.current && (
            <div className={styles.previewOverlay}>
              <img
                src={imgRef.current.src}
                alt="Puzzle preview"
                className={styles.previewImage}
              />
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
              grid={state?.grid}
              undoCount={undoCountRef.current}
              isNewBest={
                timeMode === "best" &&
                state?.grid != null &&
                (bestTimeSeconds == null || elapsedSeconds < bestTimeSeconds)
              }
              isDaily={isDailyPuzzleSession()}
              shareUrls={share.shareUrls}
              copied={share.copied}
              canNativeShare={share.canNativeShare}
              onOpenShareWindow={share.openShareWindow}
              onCopyResults={share.handleCopyResults}
              onNativeShare={share.handleNativeShare}
              onDownloadImage={handleDownloadImage}
              onNewPuzzle={handleNewGame}
              onMenu={() => navigate("/")}
            />
          )}
        </div>
      </div>

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
          onPieceClick={handleTrayPieceClick}
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
        shareToast={shareToast}
        classNames={{
          engagementToast: styles.engagementToast,
          toastDismiss: styles.toastDismiss,
          onboardingOverlay: styles.onboardingOverlay,
          onboardingOverlayTray: styles.onboardingOverlayTray,
        }}
      />
      {(import.meta.env.DEV || SHOW_DEBUG) && (
        <ProfilerOverlay statsRef={perfStatsRef} visible={debug.showPerfOverlay} />
      )}
    </div>
  );
}

export default PlayScreen;
