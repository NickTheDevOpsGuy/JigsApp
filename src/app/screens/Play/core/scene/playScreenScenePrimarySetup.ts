import React, { useLayoutEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import posthog from "posthog-js";

import {
  usePuzzleSession,
  SESSION_ID_PARAM,
} from "@/screens/Play/hooks/gameplay/usePuzzleSession";
import { usePlayScreenUI } from "@/screens/Play/hooks/state/usePlayScreenUI";
import { useTimeModeConfig } from "@/screens/Play/hooks/gameplay/useTimeModeConfig";
import { usePlayScreenSceneState } from "@/screens/Play/hooks/state/usePlayScreenSceneState";
import { usePlayScreenManager } from "@/screens/Play/hooks/manager/usePlayScreenManager";
import { buildPlayScreenManagerConfig } from "@/screens/Play/core/utils/playScreenManagerConfig";
import { getQuadrantPb, setQuadrantPb } from "@/screens/Play/core/time/timeMode";
import {
  parseGrid,
  STORAGE_KEY,
  GRID_KEY,
  GRID_ONCE_KEY,
} from "@/screens/Play/core/utils/playScreenUtils";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { startDailyPuzzle } from "@/daily/dailyPuzzle";
import { isDailyPuzzleSession } from "@/daily/dailyPuzzleCore";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";

const DAILY_PARAM = "daily";
const GRID_PARAM = "grid";

export function usePlayScreenPrimarySetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get(SESSION_ID_PARAM);
  const showE2ECompletion = searchParams.get("e2eCompletion") === "1";

  const [dailyLinkApplied, setDailyLinkApplied] = React.useState(false);
  const [isDailySession, setIsDailySession] = React.useState(
    () => searchParams.get(DAILY_PARAM) === "1" || isDailyPuzzleSession(),
  );
  const searchParamsKey = searchParams.toString();
  const gridParamFromUrl = searchParams.get(GRID_PARAM);
  const localGrid = useMemo(() => {
    // Read GRID_ONCE_KEY atomically: consume it immediately so StrictMode double-render
    // and back-navigation don't re-apply a stale grid size.
    const onceVal = safeLocalStorage.getItem(GRID_ONCE_KEY);
    if (onceVal) safeLocalStorage.removeItem(GRID_ONCE_KEY);
    const fromStorage = parseGrid(onceVal ?? safeLocalStorage.getItem(GRID_KEY));
    if (fromStorage) return fromStorage;
    const fromUrl = parseGrid(gridParamFromUrl ?? null);
    if (fromUrl) return fromUrl;
    return parseGrid(null);
  }, [dailyLinkApplied, gridParamFromUrl, searchParamsKey]);
  const localImageUrl = useMemo(
    () => safeLocalStorage.getItem(STORAGE_KEY) ?? "",
    [dailyLinkApplied, searchParamsKey],
  );

  useLayoutEffect(() => {
    if (searchParams.get(DAILY_PARAM) !== "1") return;
    const gridParam = searchParams.get(GRID_PARAM);
    const grid = parseGrid(gridParam ?? null);
    const result = startDailyPuzzle(grid);
    if (result) {
      setIsDailySession(true);
      safeLocalStorage.setItem(GRID_ONCE_KEY, `${grid.rows}x${grid.cols}`);
      setDailyLinkApplied(true);
      navigate("/play", { replace: true });
    }
  }, [searchParams, navigate]);

  const puzzleParam = searchParams.get("puzzle");
  useLayoutEffect(() => {
    if (!puzzleParam || sessionIdFromUrl) return;
    const imageUrl = safeLocalStorage.getItem(STORAGE_KEY) ?? "";
    if (imageUrl) return;
    navigate("/", { replace: true });
  }, [puzzleParam, sessionIdFromUrl, navigate]);

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
    if (!session) return;
    safeLocalStorage.setItem(STORAGE_KEY, session.imageUrl);
    safeLocalStorage.setItem(GRID_KEY, `${session.grid.rows}x${session.grid.cols}`);
    clearPuzzleState();
  }, [session]);

  const ui = usePlayScreenUI();
  const { timeMode, setTimeMode, countdownMinutes, setCountdownMinutes } =
    useTimeModeConfig();
  const scene = usePlayScreenSceneState(grid);

  const managerConfig = buildPlayScreenManagerConfig({
    haptic: ui.hapticsEnabled ? scene.haptics.vibrate : undefined,
    themeRef: scene.themeRef,
    onPlacementStreak: () => scene.setShowStreakToast(true),
    initialSessionPieces: session != null ? session.state.pieces : undefined,
    snapScaleRef: scene.snapScaleRef,
    onSnapCheck: () => {
      scene.perfStatsRef.current.snapCheckCount++;
    },
    snapToleranceOverride: ui.snapToleranceOverride,
    wrongRotationHintRef: scene.wrongRotationHintRef,
    dragStartTimeRef: scene.dragStartTimeRef,
    batterySaverMode: scene.batterySaverMode,
    relaxedModeEnabled: ui.relaxedModeEnabled,
    elapsedSecondsRef: scene.elapsedSecondsRef,
    quadrantCompleteSeenRef: scene.quadrantCompleteSeenRef,
    onQuadrantPlaced: grid
      ? (q, sec) => {
          scene.setQuadrantTimes((prev) => {
            if (prev[q] != null) return prev;
            const next = { ...prev, [q]: sec };
            if (timeMode === "speedrun") {
              const pb = getQuadrantPb(grid.rows, grid.cols, q);
              if (pb == null || sec < pb) setQuadrantPb(grid.rows, grid.cols, q, sec);
            }
            return next;
          });
        }
      : undefined,
    onPieceSnappedAnalytics: (timeToSnapMs) => {
      const g = scene.stateRef.current?.grid;
      const gridSize = g ? `${g.rows}x${g.cols}` : "unknown";
      posthog.capture("piece_snapped", {
        grid_size: gridSize,
        device_type: scene.isCoarsePointer ? "mobile" : "desktop",
        time_to_snap_ms: timeToSnapMs,
      });
    },
    onPrecisionSnap: ui.precisionModeEnabled
      ? (precisionPx) => {
          scene.precisionSnapsRef.current = [
            ...scene.precisionSnapsRef.current,
            precisionPx,
          ];
        }
      : undefined,
    dynamicDifficultyMultiplierRef: ui.dynamicDifficultyEnabled
      ? scene.dynamicDifficultyMultiplierRef
      : undefined,
    onRecordReplaySnapshot: () => scene.recordSnapshotRef.current?.(),
    stateRef: scene.stateRef,
  });

  const managerResult = usePlayScreenManager(
    grid,
    ui.pieceLockingEnabled,
    ui.autoRotateOnSnap,
    timeMode,
    countdownMinutes,
    scene.lastInteractionRef,
    scene.resumeChoice,
    scene.stateRef,
    managerConfig,
    scene.restartSamePuzzleKey,
  );

  const boardSizeRef = React.useRef(scene.boardSize);
  boardSizeRef.current = scene.boardSize;
  scene.viewportBoundsRef.current = () => {
    if (!managerResult.boardRef.current) return null;
    const r = managerResult.boardRef.current.getBoundingClientRect();
    const sz = boardSizeRef.current;
    return { contentW: sz.w, contentH: sz.h, containerW: r.width, containerH: r.height };
  };

  scene.stateRef.current = managerResult.state;

  return {
    navigate,
    searchParams,
    sessionIdFromUrl,
    showE2ECompletion,
    sessionResult,
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
    grid,
    ui,
    timeMode,
    setTimeMode,
    countdownMinutes,
    setCountdownMinutes,
    scene,
    managerResult,
    isDailySession,
  };
}
