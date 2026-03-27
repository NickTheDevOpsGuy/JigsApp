import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { PuzzleState } from "@/puzzle/core/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { STORAGE_KEY } from "@/screens/Play/core/utils/playScreenUtils";
import type { TimeMode } from "@/screens/Play/core/time/timeMode";
import type { SnapParticle } from "@/puzzle/canvas/utils/renderBoardHelpers";
import { useSnapComboAnnouncer } from "@/screens/Play/hooks/gameplay/useSnapComboAnnouncer";
import type {
  PlayScreenManagerOptions,
  ResumeChoice,
} from "@/screens/Play/hooks/manager/playScreenManagerTypes";
import {
  clearCanvas,
  createManagerWithLayout,
  deriveBoardLayout,
  maybeRestoreManagerState,
} from "@/screens/Play/hooks/manager/playScreenManagerInitHelpers";
import { useBoardRefsReady } from "@/screens/Play/hooks/system/useBoardRefsReady";
import { useManagerBoardResize } from "@/screens/Play/hooks/manager/useManagerBoardResize";

export function usePlayScreenManager(
  grid: { rows: number; cols: number },
  pieceLockingEnabled: boolean,
  autoRotateOnSnap: boolean,
  timeMode: TimeMode,
  countdownMinutes: number,
  lastInteractionRef: MutableRefObject<number>,
  resumeChoice: ResumeChoice,
  stateRef?: MutableRefObject<PuzzleState | null>,
  options?: PlayScreenManagerOptions,
  /** Increment to force re-init with same puzzle (fresh board). Clears saved state so user can escape unwinnable resume. */
  restartSamePuzzleKey?: number,
) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const popMapRef = useRef<Map<string, number>>(new Map());
  const lockMapRef = useRef<Map<string, number>>(new Map());
  const snapParticlesRef = useRef<SnapParticle[]>([]);
  const placementTimesRef = useRef<number[]>([]);
  const lastStreakAtRef = useRef<number | null>(null);
  const relaxedToleranceMultiplierRef = useRef<number>(1);
  const snapToleranceOverrideRef = useRef<number>(1);
  const sizingCleanupRef = useRef<(() => void) | null>(null);
  const managerRef = useRef<PuzzleManager | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const relaxedModeEnabled = options?.relaxedModeEnabled ?? false;
  useEffect(() => {
    snapToleranceOverrideRef.current = options?.snapToleranceOverride ?? 1;
  }, [options?.snapToleranceOverride]);
  useEffect(() => {
    if (!relaxedModeEnabled) {
      relaxedToleranceMultiplierRef.current = 1;
      return;
    }
    const RELAXED_IDLE_MS = 15000;
    const interval = setInterval(() => {
      const idle = performance.now() - lastInteractionRef.current;
      relaxedToleranceMultiplierRef.current = idle > RELAXED_IDLE_MS ? 1.5 : 1;
    }, 2000);
    return () => clearInterval(interval);
  }, [relaxedModeEnabled]);

  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [snapCombo, setSnapCombo] = useState(0);
  const announcerLine = useSnapComboAnnouncer(
    placementTimesRef,
    snapCombo,
    setSnapCombo,
    state?.isComplete ?? false,
  );
  const [awaitingResumeChoice, setAwaitingResumeChoice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const refsReady = useBoardRefsReady(mainRef, boardRef);

  // Eagerly start loading the puzzle image as soon as possible (before refs are ready)
  // so that by the time the board is sized and ready, the image is already in browser cache.
  useEffect(() => {
    const imageUrl = safeLocalStorage.getItem(STORAGE_KEY);
    if (!imageUrl) return;
    const img = new Image();
    img.src = imageUrl;
    // No-op: just primes the browser cache. The main effect will create its own Image().
  }, []);

  // Initial setup: create manager with square tiles
  useEffect(() => {
    sizingCleanupRef.current = null;
    const mainEl = mainRef.current;
    const boardEl = boardRef.current;
    if (!mainEl || !boardEl) {
      return;
    }

    const imageUrl = safeLocalStorage.getItem(STORAGE_KEY) || "";
    if (!imageUrl) {
      setIsLoading(false);
      return;
    }

    // Clear image ref so tray never shows a previous puzzle's image while the new one loads (fixes own-image tray glitch).
    imgRef.current = null;

    // Show loading when user chose resume/fresh (async manager creation)
    if (resumeChoice === "fresh" || resumeChoice === "resume") {
      setIsLoading(true);
    }

    // Load image
    const img = new Image();
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;

      const didRunRef = { current: false };
      const runSizing = () => {
        if (didRunRef.current || !mainEl || !boardEl) return;
        // Never tear down when puzzle is complete (prevents win bounce-back when effect re-runs)
        if (stateRef?.current?.isComplete) return;
        const rect = boardEl.getBoundingClientRect();
        const rectW = Math.floor(rect.width);
        const rectH = Math.floor(rect.height);
        if (rectW <= 0 || rectH <= 0) return;

        const layout = deriveBoardLayout(rectW, rectH, grid, img);

        const savedState = loadPuzzleState();
        const hasSavedGame = Boolean(
          savedState &&
          savedState.imageUrl === imageUrl &&
          savedState.grid.rows === grid.rows &&
          savedState.grid.cols === grid.cols,
        );

        if (hasSavedGame && savedState && resumeChoice === "resume") {
          setElapsedSeconds(savedState.elapsedSeconds);
        } else {
          const isCountdown = timeMode === "countdown";
          setElapsedSeconds(isCountdown ? countdownMinutes * 60 : 0);
        }

        // If saved game exists and user hasn't chosen, wait for choice
        if (hasSavedGame && resumeChoice === null) {
          setAwaitingResumeChoice(true);
          setIsLoading(false);
          return;
        }
        setAwaitingResumeChoice(false);

        // Reset and clear before creating manager (fixes double puzzle on mobile)
        setManager(null);
        setState(null);
        popMapRef.current.clear();
        lockMapRef.current.clear();
        snapParticlesRef.current = [];
        placementTimesRef.current = [];
        setSnapCombo(0);
        clearCanvas(canvasRef.current);
        setPuzzleKey((k) => k + 1);

        if (hasSavedGame && resumeChoice === "fresh") {
          clearPuzzleState();
        }

        managerRef.current = null;
        const next = createManagerWithLayout({
          imageUrl,
          grid,
          layout,
          optionsRef,
          lastInteractionRef,
          popMapRef,
          lockMapRef,
          snapParticlesRef,
          placementTimesRef,
          lastStreakAtRef,
          setSnapCombo,
          relaxedToleranceMultiplierRef,
          snapToleranceOverrideRef,
          getManager: () => managerRef.current,
        });
        managerRef.current = next;
        maybeRestoreManagerState(
          next,
          hasSavedGame,
          savedState ? { pieces: savedState.pieces } : null,
          resumeChoice,
          options?.initialSessionPieces,
        );

        next.setPieceLockingEnabled(pieceLockingEnabled);
        next.setAutoRotateOnSnap(autoRotateOnSnap);
        didRunRef.current = true;
        ro.disconnect();
        clearTimeout(fallbackId);
        setManager(next);
        setState(next.getState());
        setIsLoading(false);
      };

      // ResizeObserver: measure board when CSS layout is stable (board sized by aspect-ratio).
      // Only mark "did run" and disconnect after we actually create the manager (so on mobile,
      // if board is 0x0 at fallback time, ResizeObserver can still fire when layout completes).
      // Declare ro, fallbackId, retryIdRef before tryRun so runSizing() can safely reference them (avoids TDZ).
      const RETRY_MS = 200;
      const MAX_WAIT_MS = 2400;
      const retryIdRef = { current: null as ReturnType<typeof setInterval> | null };
      const ro = new ResizeObserver(() => {
        if (didRunRef.current) return;
        requestAnimationFrame(() => {
          requestAnimationFrame(tryRun);
        });
      });
      const fallbackId = setTimeout(() => {
        if (didRunRef.current) return;
        runSizing();
        if (didRunRef.current) return;
        let elapsed = 0;
        retryIdRef.current = setInterval(() => {
          elapsed += RETRY_MS;
          if (didRunRef.current || elapsed > MAX_WAIT_MS) {
            if (retryIdRef.current) {
              clearInterval(retryIdRef.current);
              retryIdRef.current = null;
            }
            return;
          }
          runSizing();
        }, RETRY_MS);
        sizingCleanupRef.current = () => {
          ro.disconnect();
          clearTimeout(fallbackId);
          if (retryIdRef.current) {
            clearInterval(retryIdRef.current);
            retryIdRef.current = null;
          }
        };
      }, 0);
      const tryRun = () => {
        if (didRunRef.current || !mainEl || !boardEl) return;
        const r = boardEl.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        runSizing();
      };
      ro.observe(boardEl);
      tryRun();
      /* Board can be 0×0 for a frame after image load; retry over a few paints before 48ms fallback. */
      let chain = 0;
      const chainRun = () => {
        if (didRunRef.current || chain++ >= 5) return;
        tryRun();
        if (!didRunRef.current) requestAnimationFrame(chainRun);
      };
      requestAnimationFrame(chainRun);
      sizingCleanupRef.current = () => {
        ro.disconnect();
        clearTimeout(fallbackId);
        if (retryIdRef.current) {
          clearInterval(retryIdRef.current);
        }
      };
    };
    return () => {
      sizingCleanupRef.current?.();
      sizingCleanupRef.current = null;
    };
  }, [
    refsReady,
    grid,
    pieceLockingEnabled,
    autoRotateOnSnap,
    timeMode,
    countdownMinutes,
    lastInteractionRef,
    resumeChoice,
    options?.initialSessionPieces,
    restartSamePuzzleKey ?? 0,
  ]);

  useEffect(() => {
    manager?.setPieceLockingEnabled(pieceLockingEnabled);
  }, [manager, pieceLockingEnabled]);

  useEffect(() => {
    manager?.setAutoRotateOnSnap(autoRotateOnSnap);
  }, [manager, autoRotateOnSnap]);

  useManagerBoardResize(boardRef, manager, setState);

  return {
    manager,
    state,
    puzzleKey,
    setState,
    elapsedSeconds,
    setElapsedSeconds,
    snapCombo,
    announcerLine,
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
  };
}
