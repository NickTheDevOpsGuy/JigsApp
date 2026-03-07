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
import type { Piece, PuzzleState } from "@/puzzle/types";
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
import { createUndoRedoHandler, formatTime } from "./playUtils";
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
import { useReplay, type ReplayStateRef } from "./hooks/useReplay";
import { useHaptics } from "./hooks/useHaptics";
import { useCoarsePointer } from "./hooks/useCoarsePointer";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "../../hooks/useBatterySaver";
import { FeedbackChoiceModal } from "@/components/FeedbackChoiceModal";
import {
  Minimap,
  PlayScreenCoopView,
  PlayScreenModals,
  PlayScreenOverlays,
  PlayScreenTopBar,
  CompletionOverlayGate,
  PauseOverlay,
  UndoRedoButtons,
  ReplayBar,
} from "./components";
import { SnapComboMeter } from "./components/SnapComboMeter";
import { usePuzzleSession, SESSION_ID_PARAM } from "./hooks/usePuzzleSession";
import { createPuzzleSession } from "@/services/puzzleSessionService";
import { getToleranceMultiplier } from "@/services/adaptiveDifficultyService";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { getCurrentPuzzleId } from "@/data/packCompletion";

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
    autoRotateOnSnap,
    setAutoRotateOnSnap,
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
    showFeedbackChoice,
    setShowFeedbackChoice,
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
    minimapPosition,
    cycleMinimapPosition,
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
  const [completionImageUrl, setCompletionImageUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [boardSize, setBoardSize] = React.useState({ w: 800, h: 600 });
  const [lives, setLives] = React.useState(3);

  const viewportKey = grid != null ? `vp:${grid.rows}x${grid.cols}` : null;
  const viewportBoundsRef = React.useRef<
    | (() => {
        contentW: number;
        contentH: number;
        containerW: number;
        containerH: number;
      } | null)
    | null
  >(null);
  const viewport = useViewport(viewportKey, viewportBoundsRef);
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
  const trayPiecesKeyRef = React.useRef<{ key: string; pieces: Piece[] }>({
    key: "",
    pieces: [],
  });
  const undoCountRef = React.useRef(0);
  const moveCountRef = React.useRef(0);
  const precisionSnapsRef = React.useRef<number[]>([]);
  const dynamicDifficultyMultiplierRef = React.useRef<number>(1);
  const usedHintRef = React.useRef(false);
  const abandonCapturedRef = React.useRef(false);
  const elapsedSecondsRef = React.useRef(0);
  const replayStateRef = React.useRef<ReplayStateRef | null>(null);
  const recordSnapshotRef = React.useRef<() => void>(() => {});
  const initialSnapshotRecordedRef = React.useRef(false);
  const [quadrantTimes, setQuadrantTimes] = React.useState<
    Record<0 | 1 | 2 | 3, number | null>
  >({ 0: null, 1: null, 2: null, 3: null });

  const managerResult = usePlayScreenManager(
    grid,
    pieceLockingEnabled,
    autoRotateOnSnap,
    timeMode,
    countdownMinutes,
    lastInteractionRef,
    resumeChoice,
    stateRef,
    {
      haptic: hapticsEnabled ? haptics.vibrate : undefined,
      themeRef,
      onPlacementStreak: () => setShowStreakToast(true),
      /* When joining via share link, use session state only (empty = new game). Never use localStorage. */
      initialSessionPieces: session != null ? session.state.pieces : undefined,
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
      onPrecisionSnap: precisionModeEnabled
        ? (precisionPx) => {
            precisionSnapsRef.current = [...precisionSnapsRef.current, precisionPx];
          }
        : undefined,
      dynamicDifficultyMultiplierRef: dynamicDifficultyEnabled
        ? dynamicDifficultyMultiplierRef
        : undefined,
      onRecordReplaySnapshot: () => recordSnapshotRef.current?.(),
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

  const boardSizeRef = React.useRef(boardSize);
  boardSizeRef.current = boardSize;
  viewportBoundsRef.current = () => {
    if (!boardRef.current) return null;
    const r = boardRef.current.getBoundingClientRect();
    const sz = boardSizeRef.current;
    return {
      contentW: sz.w,
      contentH: sz.h,
      containerW: r.width,
      containerH: r.height,
    };
  };

  stateRef.current = state;
  replayStateRef.current = {
    getState: () => manager?.getState() ?? null,
    elapsedSeconds,
    moveCount: moveCountRef.current,
  };
  const replay = useReplay(manager, setState, replayStateRef, state?.isComplete ?? false);
  React.useEffect(() => {
    recordSnapshotRef.current = replay.recordSnapshot;
  }, [replay.recordSnapshot]);
  React.useEffect(() => {
    if (
      state?.placedCount === 0 &&
      (state?.pieces?.length ?? 0) > 0 &&
      !initialSnapshotRecordedRef.current
    ) {
      initialSnapshotRecordedRef.current = true;
      replay.recordSnapshot();
    }
  }, [state?.placedCount, state?.pieces?.length, replay.recordSnapshot]);
  React.useEffect(() => {
    if (puzzleKey != null) initialSnapshotRecordedRef.current = false;
  }, [puzzleKey]);
  const { highlightedPieceIds, onPreviewTap, clearHighlight } = useReferenceTapHighlight(
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
  }, [state?.pieces?.length, completionDismissed]);

  useEffect(() => {
    undoCountRef.current = 0;
    moveCountRef.current = 0;
    precisionSnapsRef.current = [];
    abandonCapturedRef.current = false;
    usedHintRef.current = showGhostHint || showGhostWhenIdle;
    setQuadrantTimes({ 0: null, 1: null, 2: null, 3: null });
    setCompletionDismissed(false);
    setCompletionImageUrl(undefined);
    setLives(3);
  }, [puzzleKey, showGhostHint, showGhostWhenIdle]);

  useEffect(() => {
    if (!dynamicDifficultyEnabled || !grid) {
      dynamicDifficultyMultiplierRef.current = 1;
      return;
    }
    dynamicDifficultyMultiplierRef.current = getToleranceMultiplier(grid.rows, grid.cols);
  }, [dynamicDifficultyEnabled, grid?.rows, grid?.cols]);

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

  // When game is complete, clear any toast state so no toasts show
  useEffect(() => {
    if (state?.isComplete) {
      setShowStreakToast(false);
      setShareToast(null);
    }
  }, [state?.isComplete]);

  const milestoneMessage = usePlayScreenMilestones(
    state,
    puzzleKey,
    isCoarsePointer,
    timeMode,
  );

  const zoomOnCompleteRunRef = useRef(false);
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

  // Capture completed puzzle from canvas for overlay (avoids broken blob/data URLs)
  useEffect(() => {
    if (!state?.isComplete || completionDismissed || !state) return;
    const id = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        setCompletionImageUrl(dataUrl);
      } catch {
        // toDataURL can fail (e.g. tainted); leave completionImageUrl undefined to use fallback
      }
    });
    return () => cancelAnimationFrame(id);
  }, [state?.isComplete, completionDismissed, state]);

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

  const screenToBoard = React.useCallback(
    (clientX: number, clientY: number, boardRect: DOMRect) => {
      const cssX = clientX - boardRect.left;
      const cssY = clientY - boardRect.top;
      const cssW = boardRect.width;
      const cssH = boardRect.height;
      const first = state?.pieces?.[0];
      const assembledW = first && state?.grid ? state.grid.cols * first.tileW : 0;
      const assembledH = first && state?.grid ? state.grid.rows * first.tileH : 0;
      const piece00 = state?.pieces?.find((p) => p.row === 0 && p.col === 0);
      const pad = piece00?.pad ?? 18;
      const boardOffsetX = piece00 ? piece00.pad - piece00.targetX : 0;
      const boardOffsetY = piece00 ? piece00.pad - piece00.targetY : 0;
      const contentW = assembledW + 2 * pad;
      const contentH = assembledH + 2 * pad;
      const fitScale =
        contentW > 0 && contentH > 0 ? Math.min(1, cssW / contentW, cssH / contentH) : 1;
      const drawW = contentW * fitScale;
      const drawH = contentH * fitScale;
      const fitOffsetX = (cssW - drawW) / 2;
      const fitOffsetY = (cssH - drawH) / 2;
      let vx = (cssX - fitOffsetX) / fitScale;
      let vy = (cssY - fitOffsetY) / fitScale;
      vx = (vx - viewport.viewport.panX) / viewport.viewport.scale;
      vy = (vy - viewport.viewport.panY) / viewport.viewport.scale;
      return {
        x: vx - boardOffsetX,
        y: vy - boardOffsetY,
      };
    },
    [
      state?.pieces,
      state?.grid,
      viewport.viewport.panX,
      viewport.viewport.panY,
      viewport.viewport.scale,
      viewport.screenToBoard,
    ],
  );

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
      clearHighlight();
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
    screenToBoard,
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
      // Subtle spawn pop so tray→board placement feels intentional on mobile.
      popMapRef.current.set(pieceId, performance.now());
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

  // Create a share-only session when puzzle is complete (non-daily, no co-op) so share link opens a new game with same puzzle + difficulty. Do not switch current session.
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
    const imgUrl = safeLocalStorage.getItem(STORAGE_KEY) ?? "";
    if (!imgUrl) return;
    createPuzzleSession(imgUrl, grid, {
      pieces: [],
      elapsedSeconds: 0,
      isComplete: false,
    })
      .then((result) => {
        if (!("error" in result)) setShareSessionId(result.sessionId);
      })
      .catch(() => {});
  }, [state?.isComplete, sessionId, grid, shareSessionId]);

  const puzzleShareUrl = useMemo(() => {
    if (shareSessionId) return `/play?${SESSION_ID_PARAM}=${shareSessionId}`;
    if (isDailyPuzzleSession() && grid)
      return `/play?${DAILY_PARAM}=1&${GRID_PARAM}=${grid.rows}x${grid.cols}`;
    if (sessionId) return `/play?${SESSION_ID_PARAM}=${sessionId}`;
    return "/";
  }, [sessionId, shareSessionId, grid]);

  const challengeShareUrl = useMemo(() => {
    if (!grid) return puzzleShareUrl;
    if (isDailyPuzzleSession())
      return `/play?${DAILY_PARAM}=1&${GRID_PARAM}=${grid.rows}x${grid.cols}`;
    const puzzleId = getCurrentPuzzleId();
    if (puzzleId) {
      return `/new?source=gallery&puzzle=${encodeURIComponent(puzzleId)}&grid=${grid.rows}x${grid.cols}`;
    }
    return puzzleShareUrl;
  }, [grid, puzzleShareUrl]);

  const shareAccuracyPercent =
    state?.totalCount && state.totalCount > 0
      ? Math.round(
          (state.totalCount / Math.max(moveCountRef.current, state.totalCount)) * 100,
        )
      : 100;
  const share = useShareResults({
    elapsedSeconds,
    state,
    progressShareUrl: puzzleShareUrl,
    challengeShareUrl,
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

  // Stable reference when only board state changed (avoids tray thumbs re-running and "spinning")
  const trayPieces = useMemo(() => {
    const next = state ? state.pieces.filter((p) => p.inTray) : [];
    const key =
      next.length === 0
        ? ""
        : next
            .map((p) => `${p.id}:${p.rotation}`)
            .sort()
            .join(",");
    const ref = trayPiecesKeyRef.current;
    if (ref.key === key && ref.pieces.length === next.length) return ref.pieces;
    ref.key = key;
    ref.pieces = next;
    return next;
  }, [state]);
  const dragPreviewPiece =
    dragPreview && state ? state.pieces.find((p) => p.id === dragPreview.pieceId) : null;
  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  /** Progress ring: only fill when pieces have actually snapped (locked), not when merely dragged into place or nudged. */
  const progressCount =
    pieceLockingEnabled && state?.pieces
      ? state.pieces.filter((p) => p.locked).length
      : placed;
  const _piecesOnBoard = state?.pieces.filter((p) => !p.inTray).length ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;
  const displayElapsedSeconds = replay.isReplaying
    ? replay.replayElapsedSeconds
    : elapsedSeconds;
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
    autoRotateOnSnap,
    setAutoRotateOnSnap,
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
    elapsedSeconds: displayElapsedSeconds,
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
        className={`${styles.page} ${zenModeEnabled ? styles.zenMode : ""} ${
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
          onOpenFeedback={() => {
            setShowHelpChoice(false);
            setShowFeedbackChoice(true);
          }}
          hapticsEnabled={hapticsEnabled}
          showNewGameModal={showNewGameModal}
          setShowNewGameModal={setShowNewGameModal}
          onConfirmNewGame={handleNewGame}
          showResetStatsConfirm={showResetStatsConfirm}
          setShowResetStatsConfirm={setShowResetStatsConfirm}
          showClearCacheConfirm={showClearCacheConfirm}
          setShowClearCacheConfirm={setShowClearCacheConfirm}
        />

        <FeedbackChoiceModal
          isOpen={showFeedbackChoice}
          onClose={() => setShowFeedbackChoice(false)}
          environmentSnippet={
            state?.grid
              ? `Grid: ${state.grid.rows}x${state.grid.cols}\nSession: ${sessionIdFromUrl ?? "—"}`
              : undefined
          }
        />

        {((isComplete && !completionDismissed) ||
          (showE2ECompletion && !completionDismissed)) &&
          state && (
            <CompletionOverlayGate
              show
              elapsedSeconds={displayElapsedSeconds}
              state={state}
              imageUrl={
                completionImageUrl ??
                safeLocalStorage.getItem(STORAGE_KEY) ??
                imgRef.current?.src ??
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
                handleCopyChallenge: share.handleCopyChallenge,
                handleNativeChallengeShare: share.handleNativeChallengeShare,
              }}
              onDownloadImage={handleDownloadImage}
              onClose={() => {
                setCompletionDismissed(true);
                setCompletionImageUrl(undefined);
                viewport.reset();
              }}
              usedHint={usedHintRef.current}
              isDaily={isDailyPuzzleSession()}
              precisionModeEnabled={precisionModeEnabled}
              precisionSnaps={precisionSnapsRef.current}
              adaptivePersonalityEnabled={adaptivePersonalityEnabled}
              canReplay={replay.canReplay}
              onReplayClick={() => {
                replay.startReplay();
                setCompletionDismissed(true);
                setCompletionImageUrl(undefined);
              }}
              onNextPuzzle={handleNewGame}
            />
          )}

        {replay.isReplaying && (
          <ReplayBar
            isPaused={replay.isReplayPaused}
            onPlay={replay.resumeReplay}
            onPause={replay.pauseReplay}
            speed={replay.replaySpeed}
            onSpeedChange={replay.setReplaySpeed}
            currentIndex={replay.replayIndex}
            totalSnapshots={replay.snapshots.length}
            elapsedSeconds={replay.replayElapsedSeconds}
            onClose={replay.stopReplay}
          />
        )}

        <div className={styles.playBody}>
          <div className={styles.main} ref={mainRef}>
            <div className={styles.boardWrapper}>
              <div
                className={styles.boardProgressFrame}
                data-complete={isComplete ? "true" : undefined}
                style={
                  total > 0 && !isComplete
                    ? {
                        ["--progress" as string]: progressCount / total,
                        ["--progress-color" as string]:
                          "var(--color-progress-75, #22c55e)",
                      }
                    : undefined
                }
              >
                <div className={styles.board} ref={boardRef} data-testid="play-board">
                  {isComplete && (
                    <div
                      className={styles.boardCompleteMessage}
                      role="status"
                      aria-live="polite"
                    >
                      <div className={styles.boardCompleteBanner}>
                        <span className={styles.boardCompleteBannerLine}>
                          Solved in {formatTime(elapsedSeconds)}!
                        </span>
                        <span className={styles.boardCompleteBannerSub}>
                          {moveCountRef.current === 1
                            ? "1 move"
                            : `${moveCountRef.current} moves`}
                        </span>
                      </div>
                    </div>
                  )}
                  {isLoading && (
                    <div className={styles.loadingOverlay} aria-label="Loading puzzle">
                      <div className={styles.spinner} />
                      <span>Loading puzzle…</span>
                    </div>
                  )}
                  {!state?.isComplete && <SnapComboMeter combo={snapCombo} />}
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
                  {state?.pieces?.[0] &&
                    state.grid &&
                    minimapVisible &&
                    state.grid.rows * state.grid.cols >= 25 && (
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
                        position={minimapPosition}
                        onCyclePosition={cycleMinimapPosition}
                      />
                    )}
                  {isPaused && <PauseOverlay onResume={() => setIsPaused(false)} />}
                </div>
              </div>
            </div>
          </div>
          {!isComplete && (
            <div
              className={`${styles.trayArea} ${immersiveMode && !showImmersiveUi ? styles.immersiveHidden : ""}`}
              onPointerLeave={immersiveMode ? scheduleImmersiveHide : undefined}
            >
              {!isPaused && (
                <div className={styles.undoRedoPillsWrap}>
                  <UndoRedoButtons
                    canUndo={!!(manager?.canUndo() && !isPaused && !state?.isComplete)}
                    onUndo={createUndoRedoHandler(
                      manager ?? null,
                      "undo",
                      setState,
                      () =>
                        Boolean(manager?.canUndo() && !isPaused && !state?.isComplete),
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
                      () =>
                        Boolean(manager?.canRedo() && !isPaused && !state?.isComplete),
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
          )}
        </div>

        <PlayScreenOverlays
          showPreview={showPreview && !mysteryModeEnabled}
          progressiveRevealMode={progressiveRevealMode || mysteryModeEnabled}
          previewImage={imgRef.current}
          state={state}
          isComplete={isComplete}
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
