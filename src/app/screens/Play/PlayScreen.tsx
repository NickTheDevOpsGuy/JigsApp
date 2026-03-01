/**
 * PlayScreen – main puzzle play UI.
 *
 * Sections (approx): 76–140 session/grid init; 141–260 state refs; 261–400 effects
 * (save, remote, share); 401–600 canvas/pointer/viewport; 601–900 completion/share;
 * 901–1100 HUD/tray/top bar; 1100–1606 main JSX (board, tray, overlays, modals).
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
import { useShouldShowTutorial } from "@/components/HowToPlay";
import type { PuzzleState } from "@/puzzle/types";
import { clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { audioManager } from "@/audio/audioManager";
import {
  STORAGE_KEY,
  GRID_KEY,
  GRID_ONCE_KEY,
  SHOW_DEBUG,
  parseGrid,
} from "./playScreenUtils";
import { createUndoRedoHandler } from "./playUtils";
import { getBestTime, getQuadrantPb, setQuadrantPb } from "./timeMode";
import {
  isDailyPuzzleSession,
  getDailyVisualModifier,
  getDailyPreferredModifier,
} from "@/daily/dailyPuzzleCore";
import { startDailyPuzzle } from "@/daily/dailyPuzzle";
import { usePlayScreenManager, type ResumeChoice } from "./hooks/usePlayScreenManager";
import { usePlayScreenShortcuts } from "./hooks/usePlayScreenShortcuts";
import { usePlayScreenUI } from "./hooks/usePlayScreenUI";
import { usePlayScreenAnimation } from "./hooks/usePlayScreenAnimation";
import { usePlayScreenTimer } from "./hooks/usePlayScreenTimer";
import { usePlayScreenMilestones } from "./hooks/usePlayScreenMilestones";
import { useTimeModeConfig } from "./hooks/useTimeModeConfig";
import { useShareResults } from "./hooks/useShareResults";
import { useDownloadImage } from "./hooks/useDownloadImage";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePointerHandlers } from "./hooks/usePointerHandlers";
import { useViewport } from "./hooks/useViewport";
import { usePlayScreenTopBarProps } from "./hooks/usePlayScreenTopBarProps";
import { useReferenceTapHighlight } from "./hooks/useReferenceTapHighlight";
import { usePlayScreenSecondaryEffects } from "./hooks/usePlayScreenSecondaryEffects";
import { usePlayScreenPersistence } from "./hooks/usePlayScreenPersistence";
import { usePlayScreenSharePuzzle } from "./hooks/usePlayScreenSharePuzzle";
import { useHaptics } from "./hooks/useHaptics";
import { useCoarsePointer } from "./hooks/useCoarsePointer";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "../../hooks/useBatterySaver";
import {
  Minimap,
  PlayScreenCoopView,
  PlayScreenModals,
  PlayScreenOverlays,
  PlayScreenTopBar,
  CompletionOverlayGate,
  PauseOverlay,
  UndoRedoButtons,
} from "./components";
import { SnapComboMeter } from "./components/SnapComboMeter";
import { usePuzzleSession, SESSION_ID_PARAM } from "./hooks/usePuzzleSession";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

const DAILY_PARAM = "daily";
const GRID_PARAM = "grid";

export function PlayScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get(SESSION_ID_PARAM);
  /** E2E only: ?e2eCompletion=1 forces the completion overlay to show for snapshot/assertion. */
  const showE2ECompletion = searchParams.get("e2eCompletion") === "1";

  // Re-read from storage after applying /play?daily=1&grid=RxC so share links load same puzzle + difficulty
  const [dailyLinkApplied, setDailyLinkApplied] = React.useState(false);
  const localGrid = useMemo(() => {
    const once = safeLocalStorage.getItem(GRID_ONCE_KEY);
    return parseGrid(once ?? safeLocalStorage.getItem(GRID_KEY));
  }, [dailyLinkApplied]);
  const localImageUrl = useMemo(
    () => safeLocalStorage.getItem(STORAGE_KEY) ?? "",
    [dailyLinkApplied],
  );

  useLayoutEffect(() => {
    if (searchParams.get(DAILY_PARAM) !== "1") return;
    const gridParam = searchParams.get(GRID_PARAM);
    const grid = parseGrid(gridParam ?? null);
    const result = startDailyPuzzle(grid);
    if (result) {
      safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
      setDailyLinkApplied(true);
      navigate("/play", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    safeLocalStorage.removeItem(GRID_ONCE_KEY);
  }, []);

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

  useLayoutEffect(() => {
    if (session) {
      safeLocalStorage.setItem(STORAGE_KEY, session.imageUrl);
      safeLocalStorage.setItem(GRID_KEY, `${session.grid.rows}x${session.grid.cols}`);
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
    driftModeEnabled,
    toggleDriftMode,
    showGhostHint,
    setShowGhostHint,
    showAlignmentGrid,
    setShowAlignmentGrid,
    showGhostWhenIdle,
    toggleShowGhostWhenIdle,
    showEdgeHighlight,
    toggleShowEdgeHighlight,
    showClusterOutline,
    toggleShowClusterOutline,
    deliberateDetachEnabled,
    toggleDeliberateDetach,
    debug,
    showPreview,
    setShowPreview,
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    toggleMusic,
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
    pieceCutType,
    setPieceCutType,
    progressiveRevealMode,
    setProgressiveRevealMode,
    snapToleranceOverride,
    setSnapToleranceOverride,
    dailyPreferredModifier,
    setDailyPreferredModifier,
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
  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [immersiveReveal, setImmersiveReveal] = React.useState(false);
  const immersiveHideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = React.useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = React.useState(false);
  const [completionDismissed, setCompletionDismissed] = React.useState(false);
  const [boardSize, setBoardSize] = React.useState({ w: 800, h: 600 });
  const [lives, setLives] = React.useState(3);

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
  const moveCountRef = React.useRef(0);
  const usedHintRef = React.useRef(false);
  const abandonCapturedRef = React.useRef(false);
  const elapsedSecondsRef = React.useRef(0);
  const [quadrantTimes, setQuadrantTimes] = React.useState<
    Record<0 | 1 | 2 | 3, number | null>
  >({ 0: null, 1: null, 2: null, 3: null });

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
      snapToleranceOverride,
      wrongRotationHintRef,
      dragStartTimeRef,
      batterySaverMode,
      relaxedModeEnabled,
      elapsedSecondsRef,
      onQuadrantPlaced:
        timeMode === "speedrun" && grid
          ? (q, sec) => {
              setQuadrantTimes((prev) => {
                if (prev[q] != null) return prev;
                const next = { ...prev, [q]: sec };
                const pb = getQuadrantPb(grid.rows, grid.cols, q);
                if (pb == null || sec < pb) {
                  setQuadrantPb(grid.rows, grid.cols, q, sec);
                }
                return next;
              });
            }
          : undefined,
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
    snapCombo,
    announcerLine,
    imgRef,
    popMapRef,
    lockMapRef,
    snapParticlesRef,
  } = managerResult;

  stateRef.current = state;
  const { highlightedPieceIds, onPreviewTap } = useReferenceTapHighlight(
    state ?? null,
    lastInteractionRef,
  );

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => setBoardSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state?.pieces?.length]);

  useEffect(() => {
    undoCountRef.current = 0;
    moveCountRef.current = 0;
    abandonCapturedRef.current = false;
    usedHintRef.current = showGhostHint || showGhostWhenIdle;
    setQuadrantTimes({ 0: null, 1: null, 2: null, 3: null });
    setCompletionDismissed(false);
    setLives(3);
  }, [puzzleKey, showGhostHint, showGhostWhenIdle]);

  useEffect(() => {
    if (state?.isComplete) return;
    if (showGhostHint || showGhostWhenIdle) {
      usedHintRef.current = true;
    }
  }, [showGhostHint, showGhostWhenIdle, state?.isComplete]);

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

  elapsedSecondsRef.current = elapsedSeconds;

  const milestoneMessage = usePlayScreenMilestones(
    state,
    puzzleKey,
    isCoarsePointer,
    timeMode,
  );

  // Camera zoom-out on completion (600ms ease-out)
  const zoomOnCompleteRunRef = useRef(false);
  useEffect(() => {
    if (!state?.isComplete || zoomOnCompleteRunRef.current || batterySaverMode) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    zoomOnCompleteRunRef.current = true;
    viewport.zoomOutOnComplete();
  }, [state?.isComplete, batterySaverMode, viewport.zoomOutOnComplete]);

  const completionCapturedRef = useRef(false);
  const onFireCapturedRef = useRef(false);
  // Auto-clear piece selection after 1s so the blue border doesn’t stay until another click
  const [selectionExtendTrigger, setSelectionExtendTrigger] = React.useState(0);
  useEffect(() => {
    if (selectedPieceId == null) return;
    const t = setTimeout(() => {
      setSelectedPieceId(null);
      selectedIdRef.current = null;
      bump();
    }, 1000);
    return () => clearTimeout(t);
  }, [selectedPieceId, selectionExtendTrigger, setSelectedPieceId, selectedIdRef, bump]);

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
    onExtendSelection: () => setSelectionExtendTrigger((t) => t + 1),
    onSnapBackAnimate: (fromPositions) => {
      undoSnapBackRef.current = {
        fromPositions,
        startMs: performance.now(),
      };
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

  useEffect(() => {
    audioManager.setPaused(isPaused);
  }, [isPaused]);

  useEffect(() => {
    audioManager.tryStartAmbientIfEnabled();
    return () => {
      audioManager.leavePlayScreen();
    };
  }, []);

  usePlayScreenPersistence({
    state,
    elapsedSeconds,
    sessionId,
    pushState,
    remoteState,
    manager,
    setState,
    setElapsedSeconds,
    clearRemoteState,
    stateRef,
    elapsedSecondsRef,
    undoCountRef,
    abandonCapturedRef,
  });

  // First-snap: glow pulse + toast only (no confetti – premium, restrained feel)
  useEffect(() => {
    if (!onboarding.showFirstSnapToast) return;
    // Rely on existing snap glow + toast; no first-piece confetti per polish plan.
  }, [onboarding.showFirstSnapToast]);

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

  usePlayScreenSecondaryEffects({
    state,
    puzzleKey: puzzleKey != null ? String(puzzleKey) : null,
    elapsedSeconds,
    sessionId,
    isCoarsePointer,
    timeMode,
    showStreakToast,
    setShowStreakToast,
    shareToast,
    setShareToast,
    driftModeEnabled,
    manager,
    setState,
    isPaused,
    completionCapturedRef,
    onFireCapturedRef,
    firstSnapCapturedRef,
    zoomOnCompleteRunRef,
    stateRef,
  });

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
  const undoSnapBackRef = React.useRef<{
    fromPositions: import("./playUtils").UndoSnapBackFrom;
    startMs: number;
  } | null>(null);

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
      moveCountRef.current += 1;
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
    showClusterOutline,
    lastInteractionRef,
    viewport: viewport.viewport,
    perfStatsRef,
    wrongRotationHintRef,
    batterySaverMode,
    undoSnapBackRef,
    onUndoSnapBackComplete: () => {
      undoSnapBackRef.current = null;
    },
    dailyVisualModifier: isDailyPuzzleSession()
      ? getDailyVisualModifier()
      : (dailyPreferredModifier ?? getDailyPreferredModifier()),
  });

  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      lastInteractionRef.current = performance.now();
      moveCountRef.current += 1;
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

  // Create a share session when puzzle is complete (non-daily, no co-op) so share link opens /play with same puzzle + difficulty
  const [shareSessionId, setShareSessionId] = React.useState<string | null>(null);
  useEffect(() => {
    if (
      !state?.isComplete ||
      sessionId != null ||
      isDailyPuzzleSession() ||
      shareSessionId != null ||
      !grid
    )
      return;
    createSession(safeLocalStorage.getItem(STORAGE_KEY) ?? "", grid, [], 0).then((id) => {
      if (id) setShareSessionId(id);
    });
  }, [state?.isComplete, sessionId, grid, shareSessionId, createSession]);

  const puzzleShareUrl = useMemo(() => {
    if (shareSessionId) return `/play?${SESSION_ID_PARAM}=${shareSessionId}`;
    if (isDailyPuzzleSession() && grid)
      return `/play?${DAILY_PARAM}=1&${GRID_PARAM}=${grid.rows}x${grid.cols}`;
    if (sessionId) return `/play?${SESSION_ID_PARAM}=${sessionId}`;
    return "/";
  }, [sessionId, shareSessionId, grid]);

  const shareAccuracyPercent =
    state?.totalCount && state.totalCount > 0
      ? Math.round((state.totalCount / Math.max(moveCount, state.totalCount)) * 100)
      : 100;
  const share = useShareResults({
    elapsedSeconds,
    state,
    puzzleShareUrl,
    accuracyPercent: shareAccuracyPercent,
  });
  const handleSharePuzzle = usePlayScreenSharePuzzle({
    sessionId,
    nativeShare,
    copyShareLink,
    createSession,
    grid,
    isCoarsePointer,
    stateRef,
    elapsedSecondsRef,
    setShareToast,
  });
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
  const piecesOnBoard = state?.pieces.filter((p) => !p.inTray).length ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;
  const dailyVisualModifier = isDailyPuzzleSession()
    ? getDailyVisualModifier()
    : (dailyPreferredModifier ?? getDailyPreferredModifier());
  const fogStrength =
    dailyVisualModifier === "fog" && total > 0 ? (1 - placed / total) * 0.45 : 0;
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

  const handleToggleImmersiveMode = React.useCallback(() => {
    const willEnable = !immersiveMode;
    toggleImmersiveMode();
    if (willEnable) {
      setImmersiveReveal(true);
      if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
      immersiveHideTimerRef.current = setTimeout(() => {
        setImmersiveReveal(false);
      }, 1800);
    }
  }, [immersiveMode, toggleImmersiveMode]);

  const handleImmersiveReveal = React.useCallback(() => {
    if (!immersiveMode) return;
    setImmersiveReveal(true);
    if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
  }, [immersiveMode]);
  const bestTimeSeconds =
    timeMode === "best" && state?.grid
      ? getBestTime(state.grid.rows, state.grid.cols)
      : null;

  const topBarProps = usePlayScreenTopBarProps({
    theme,
    setTheme,
    timeMode,
    setTimeMode,
    countdownMinutes,
    setCountdownMinutes,
    showPreview,
    setShowPreview,
    soundEnabled,
    musicEnabled,
    hapticsEnabled,
    pieceLockingEnabled,
    setPieceLockingEnabled,
    showGhostHint,
    setShowGhostHint,
    showGhostWhenIdle,
    showEdgeHighlight,
    showClusterOutline,
    deliberateDetachEnabled,
    showAlignmentGrid,
    setShowAlignmentGrid,
    toggleRelaxedMode,
    toggleDriftMode,
    toggleShowClusterOutline,
    toggleDeliberateDetach,
    toggleShowGhostWhenIdle,
    toggleShowEdgeHighlight,
    toggleSound,
    toggleMusic,
    toggleHaptics,
    toggleFullscreen,
    toggleDebug,
    togglePerfOverlay,
    isFullscreen: ui.isFullscreen,
    isCoarsePointer,
    showDebug: SHOW_DEBUG,
    debug,
    setShowNewGameModal,
    setShowShortcuts,
    setShowHowToPlay,
    setShowThemeModal,
    setShowResetStatsConfirm,
    setShowClearCacheConfirm,
    manager,
    state,
    setState,
    isPaused,
    setIsPaused,
    playUndo: soundManager.play.bind(soundManager),
    undoCountRef,
    undoSnapBackRef,
    viewport,
    relaxedModeEnabled,
    driftModeEnabled,
    immersiveMode,
    handleToggleImmersiveMode,
    progressiveRevealMode,
    setProgressiveRevealMode,
    pieceCutType,
    setPieceCutType,
    handleSharePuzzle,
    creatingSession,
    dailyPreferredModifier,
    setDailyPreferredModifier,
    snapToleranceOverride,
    setSnapToleranceOverride,
    elapsedSeconds,
    piecesLeft: left,
    totalPieces: total,
    isComplete,
    grid,
    quadrantTimes,
    bestTimeSeconds,
    lives,
    sessionId,
    realtimeStatus,
    connectedCount: sessionResult.connectedCount,
    showImmersiveUi,
    scheduleImmersiveHide,
  });

  return (
    <PlayScreenCoopView
      isHost={isHost}
      sessionIdFromUrl={sessionIdFromUrl}
      sessionLoading={sessionLoading}
      session={session}
      joinError={joinError}
      retryJoin={retryJoin}
      navigate={navigate}
    >
      <div
        className={`${styles.page} ${
          dailyVisualModifier === "fog"
            ? styles.modifierFog
            : dailyVisualModifier === "night"
              ? styles.modifierNight
              : dailyVisualModifier === "sepia"
                ? styles.modifierSepia
                : ""
        }`}
        style={
          dailyVisualModifier === "fog"
            ? {
                ["--fog-strength" as string]: String(
                  Math.max(0, Math.min(0.45, fogStrength)),
                ),
              }
            : undefined
        }
        ref={pageRef}
      >
        {immersiveMode && (
          <div
            className={styles.immersivePeekTop}
            onPointerEnter={handleImmersiveReveal}
            onPointerDown={handleImmersiveReveal}
            role="button"
            tabIndex={-1}
            aria-label="Show menu and controls"
            title="Show menu and controls"
          />
        )}
        <PlayScreenTopBar
          headerMenuProps={topBarProps.headerMenuProps}
          sessionId={topBarProps.sessionId}
          realtimeStatus={topBarProps.realtimeStatus}
          connectedCount={topBarProps.connectedCount}
          showHud={topBarProps.showHud}
          hudProps={topBarProps.hudProps}
          topBarButtonsProps={topBarProps.topBarButtonsProps}
          immersiveMode={topBarProps.immersiveMode}
          showImmersiveUi={topBarProps.showImmersiveUi}
          onPointerLeave={topBarProps.onPointerLeave}
        />

        <PlayScreenModals
          awaitingResumeChoice={awaitingResumeChoice}
          resumeChoice={resumeChoice}
          setResumeChoice={setResumeChoice}
          showHelpChoice={showHelpChoice}
          setShowHelpChoice={setShowHelpChoice}
          setShowHowToPlay={setShowHowToPlay}
          setShowShortcuts={setShowShortcuts}
          showThemeModal={showThemeModal}
          setShowThemeModal={setShowThemeModal}
          hapticsEnabled={hapticsEnabled}
          showNewGameModal={showNewGameModal}
          setShowNewGameModal={setShowNewGameModal}
          onConfirmNewGame={handleNewGame}
          showResetStatsConfirm={showResetStatsConfirm}
          setShowResetStatsConfirm={setShowResetStatsConfirm}
          showClearCacheConfirm={showClearCacheConfirm}
          setShowClearCacheConfirm={setShowClearCacheConfirm}
        />

        <div className={styles.playBody}>
          <div className={styles.main} ref={mainRef}>
            <div className={styles.boardWrapper}>
              <div
                className={styles.boardProgressFrame}
                style={
                  total > 0
                    ? {
                        ["--progress" as string]: placed / total,
                        ["--progress-color" as string]:
                          "var(--color-progress-75, #22c55e)",
                      }
                    : undefined
                }
              >
                <div className={styles.board} ref={boardRef} data-testid="play-board">
                  {isLoading && (
                    <div className={styles.loadingOverlay} aria-label="Loading puzzle">
                      <div className={styles.spinner} />
                      <span>Loading puzzle…</span>
                    </div>
                  )}
                  <SnapComboMeter combo={snapCombo} />
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
                  {state?.pieces?.[0] && state.grid && (
                    <Minimap
                      pieces={state.pieces}
                      grid={state.grid}
                      assembledW={state.grid.cols * state.pieces[0].tileW}
                      assembledH={state.grid.rows * state.pieces[0].tileH}
                      viewport={viewport.viewport}
                      containerW={boardSize.w}
                      containerH={boardSize.h}
                      setViewport={viewport.setViewport}
                      visible={!isPaused && !isComplete}
                    />
                  )}
                  {isPaused && (
                    <PauseOverlay
                      onResume={() => setIsPaused(false)}
                      isCountdownExpired={
                        timeMode === "countdown" &&
                        elapsedSeconds <= 0 &&
                        !isComplete &&
                        isPaused
                      }
                      onNewPuzzle={
                        timeMode === "countdown" &&
                        elapsedSeconds <= 0 &&
                        !isComplete &&
                        isPaused
                          ? handleNewGame
                          : undefined
                      }
                    />
                  )}
                  {((isComplete && !completionDismissed) ||
                    (showE2ECompletion && !completionDismissed)) &&
                    state && (
                      <CompletionOverlayGate
                        show
                        elapsedSeconds={elapsedSeconds}
                        state={state}
                        imageUrl={
                          safeLocalStorage.getItem(STORAGE_KEY) ||
                          imgRef.current?.src ||
                          undefined
                        }
                        undoCount={undoCountRef.current}
                        moveCount={moveCountRef.current}
                        dailyVisualModifier={dailyVisualModifier}
                        pieceCutType={pieceCutType}
                        isNewBest={
                          timeMode === "best" &&
                          state.grid != null &&
                          (bestTimeSeconds == null || elapsedSeconds < bestTimeSeconds)
                        }
                        puzzleShareUrl={puzzleShareUrl}
                        share={{
                          copied: share.copied,
                          canNativeShare: share.canNativeShare,
                          handleCopyResults: share.handleCopyResults,
                          handleNativeShare: share.handleNativeShare,
                        }}
                        onDownloadImage={handleDownloadImage}
                        onClose={() => setCompletionDismissed(true)}
                        usedHint={usedHintRef.current}
                        isDaily={isDailyPuzzleSession()}
                        onGoHome={() => navigate("/")}
                        onPlayAgain={handleNewGame}
                      />
                    )}
                </div>
              </div>
            </div>
          </div>
          <div
            className={`${styles.trayArea} ${immersiveMode && !showImmersiveUi ? styles.immersiveHidden : ""}`}
            onPointerLeave={immersiveMode ? scheduleImmersiveHide : undefined}
          >
            {!isComplete && !isPaused && (
              <div className={styles.undoRedoPillsWrap}>
                <UndoRedoButtons
                  canUndo={!!(manager?.canUndo() && !isPaused && !state?.isComplete)}
                  onUndo={createUndoRedoHandler(
                    manager ?? null,
                    "undo",
                    setState,
                    () => Boolean(manager?.canUndo() && !isPaused && !state?.isComplete),
                    soundManager.play.bind(soundManager),
                    () => {
                      undoCountRef.current += 1;
                    },
                    (fromPositions) => {
                      undoSnapBackRef.current = {
                        fromPositions,
                        startMs: performance.now(),
                      };
                    },
                  )}
                  canRedo={!!(manager?.canRedo() && !isPaused && !state?.isComplete)}
                  onRedo={createUndoRedoHandler(
                    manager ?? null,
                    "redo",
                    setState,
                    () => Boolean(manager?.canRedo() && !isPaused && !state?.isComplete),
                    soundManager.play.bind(soundManager),
                    undefined,
                    (fromPositions) => {
                      undoSnapBackRef.current = {
                        fromPositions,
                        startMs: performance.now(),
                      };
                    },
                  )}
                />
              </div>
            )}
            <div
              className={`${styles.trayWrap} ${(state?.grid?.rows ?? 0) * (state?.grid?.cols ?? 0) >= 49 ? styles.trayWrapLarge : ""}`}
            >
              <PieceTray
                ref={trayRef}
                pieces={trayPieces}
                image={imgRef.current}
                grid={state?.grid ?? grid}
                onPieceClick={handleTrayPieceClick}
                highlightedPieceIds={
                  highlightedPieceIds.size > 0 ? highlightedPieceIds : undefined
                }
              />
            </div>
          </div>
        </div>

        <PlayScreenOverlays
          showPreview={showPreview}
          progressiveRevealMode={progressiveRevealMode}
          previewImage={imgRef.current}
          state={state}
          onPreviewTap={onPreviewTap}
          immersiveMode={immersiveMode}
          onImmersiveReveal={handleImmersiveReveal}
          showTutorial={showTutorial}
          showHowToPlay={showHowToPlay}
          dismissTutorial={dismissTutorial}
          setShowHowToPlay={setShowHowToPlay}
          showShortcuts={showShortcuts}
          setShowShortcuts={setShowShortcuts}
          manager={manager}
          isPaused={isPaused}
          dragPreviewPiece={dragPreviewPiece ?? null}
          dragPreview={dragPreview}
          onboarding={onboarding}
          showStreakToast={showStreakToast}
          milestoneMessage={milestoneMessage}
          announcerLine={announcerLine}
          shareToast={shareToast}
          showProfiler={
            import.meta.env.DEV ||
            SHOW_DEBUG ||
            searchParams.has("debug") ||
            searchParams.has("perf")
          }
          perfStatsRef={perfStatsRef}
          profilerVisible={
            debug.showPerfOverlay || searchParams.has("debug") || searchParams.has("perf")
          }
          sessionId={sessionId}
          connectedCount={sessionResult.connectedCount}
          lastEventTimestamp={lastEventTimestamp}
          lastDbWriteMs={lastDbWriteMs}
          channelName={channelName}
        />
      </div>
    </PlayScreenCoopView>
  );
}

export default PlayScreen;
