import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { STORAGE_KEY, CUT_TYPE_KEY } from "../playScreenUtils";
import type { TimeMode } from "../timeMode";
import type { Theme } from "@/hooks/useTheme";
import type { SnapParticle } from "@/puzzle/canvas/renderBoardHelpers";
import { CONFETTI_COLORS_BY_THEME } from "@/data/confettiColors";

export type ResumeChoice = "resume" | "fresh" | null;

const PLACEMENT_STREAK_MS = 3000;
const STREAK_COOLDOWN_MS = 5000;
const SNAP_COMBO_IDLE_MS = 2500;
const SNAP_PARTICLE_COUNT = 8;

/**
 * usePlayScreenManager – creates PuzzleManager, wires events, provides board/canvas refs.
 * Handles undo, snap particles, wrong-rotation hints, placement streaks.
 */
export function usePlayScreenManager(
  grid: { rows: number; cols: number },
  pieceLockingEnabled: boolean,
  timeMode: TimeMode,
  countdownMinutes: number,
  lastInteractionRef: MutableRefObject<number>,
  resumeChoice: ResumeChoice,
  options?: {
    initialSessionPieces?: import("@/puzzle/puzzleStorage").SavedPiece[];
    haptic?: (kind: "place" | "snap" | "rotate") => void;
    themeRef?: MutableRefObject<Theme | undefined>;
    onPlacementStreak?: () => void;
    /** Ref to viewport scale for zoom-adaptive snap tolerance. */
    snapScaleRef?: MutableRefObject<number>;
    /** Called each time snap logic is evaluated (for perf overlay). */
    onSnapCheck?: () => void;
    /** Ref updated when piece would snap but wrong rotation blocks it (position correct, rotation wrong). */
    wrongRotationHintRef?: MutableRefObject<{
      groupId: string;
      pieceIds: string[];
      triggeredAt: number;
    } | null>;
    /** Ref set to performance.now() when drag starts; used for piece_snapped analytics. */
    dragStartTimeRef?: MutableRefObject<number | null>;
    /** Called when piece snaps (place or merge) with time_to_snap_ms for analytics. */
    onPieceSnappedAnalytics?: (timeToSnapMs: number) => void;
    /** When true, reduce confetti and heavy animations (battery/data saver). */
    batterySaverMode?: boolean;
    /** When true, snap tolerance increases after ~15s without placement. */
    relaxedModeEnabled?: boolean;
  },
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
  const sizingCleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const relaxedModeEnabled = options?.relaxedModeEnabled ?? false;
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
  const [awaitingResumeChoice, setAwaitingResumeChoice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [puzzleKey, setPuzzleKey] = useState(0);

  // Initial setup: create manager with square tiles
  useEffect(() => {
    sizingCleanupRef.current = null;
    const mainEl = mainRef.current;
    const boardEl = boardRef.current;
    if (!mainEl || !boardEl) {
      setIsLoading(false);
      return;
    }

    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";
    if (!imageUrl) {
      setIsLoading(false);
      return;
    }

    // Show loading when user chose resume/fresh (async manager creation)
    if (resumeChoice === "fresh" || resumeChoice === "resume") {
      setIsLoading(true);
    }

    // Load image
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;

      const runSizing = () => {
        if (!mainEl || !boardEl) return;
        const rect = boardEl.getBoundingClientRect();
        const rectW = Math.floor(rect.width);
        const rectH = Math.floor(rect.height);
        if (rectW <= 0 || rectH <= 0) return;

        const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
        const isMobile = viewportW < 600;

        // Canvas drives piece size: piece dimensions from container rect
        const boardW = rectW;
        const boardH = rectH;
        const pieceWidth = boardW / grid.cols;
        const pieceHeight = boardH / grid.rows;

        const savedState = loadPuzzleState();
        const hasSavedGame =
          savedState &&
          savedState.imageUrl === imageUrl &&
          savedState.grid.rows === grid.rows &&
          savedState.grid.cols === grid.cols;

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
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        }
        setPuzzleKey((k) => k + 1);

        if (hasSavedGame && resumeChoice === "fresh") {
          clearPuzzleState();
        }

        const cutTypeRaw = localStorage.getItem(CUT_TYPE_KEY);
        const cutType =
          cutTypeRaw === "irregular" || cutTypeRaw === "hard"
            ? cutTypeRaw
            : "classic";

        const opts = optionsRef.current;
        const next = new PuzzleManager(
          {
            imageUrl,
            boardWidth: boardW,
            boardHeight: boardH,
            grid,
            pieceWidth,
            pieceHeight,
            isMobile,
            cutType,
            snapScaleRef: opts?.snapScaleRef,
            relaxedToleranceMultiplierRef,
          },
          {
            onPiecePlaced: (p) => {
              const now = performance.now();
              const opts = optionsRef.current;
              const startTime = opts?.dragStartTimeRef?.current;
              if (
                startTime != null &&
                typeof opts?.onPieceSnappedAnalytics === "function"
              ) {
                opts.onPieceSnappedAnalytics(Math.round(now - startTime));
              }
              lastInteractionRef.current = now;
              popMapRef.current.set(p.id, now);
              soundManager.play("place");
              opts?.haptic?.("place");
              placementTimesRef.current.push(now);
              const cutoff = now - PLACEMENT_STREAK_MS;
              const comboCutoff = now - SNAP_COMBO_IDLE_MS;
              placementTimesRef.current = placementTimesRef.current.filter(
                (t) => t > cutoff,
              );
              const combo = placementTimesRef.current.filter(
                (t) => t > comboCutoff,
              ).length;
              setSnapCombo(combo);
              if (
                placementTimesRef.current.length >= 3 &&
                (lastStreakAtRef.current == null ||
                  now - lastStreakAtRef.current > STREAK_COOLDOWN_MS)
              ) {
                lastStreakAtRef.current = now;
                opts?.onPlacementStreak?.();
              }
            },
            onPieceSnapped: (pieceIds, center) => {
              const now = performance.now();
              const opts = optionsRef.current;
              const startTime = opts?.dragStartTimeRef?.current;
              if (
                startTime != null &&
                typeof opts?.onPieceSnappedAnalytics === "function"
              ) {
                opts.onPieceSnappedAnalytics(Math.round(now - startTime));
              }
              lastInteractionRef.current = now;
              soundManager.play("snap", { groupSize: pieceIds.length });
              opts?.haptic?.("snap");
              for (const id of pieceIds) popMapRef.current.set(id, now);
              if (center) {
                const particles = snapParticlesRef.current;
                for (let i = 0; i < SNAP_PARTICLE_COUNT; i++) {
                  const angle = (i / SNAP_PARTICLE_COUNT) * Math.PI * 2 + (now % 1);
                  const r = 4 + (now % 3);
                  particles.push({
                    x: center.x + Math.cos(angle) * r,
                    y: center.y + Math.sin(angle) * r,
                    t0: now,
                  });
                }
                const maxAge = 500;
                snapParticlesRef.current = particles.filter((p) => now - p.t0 < maxAge);
              }
            },
            onPieceLocked: (ids) => {
              const now = performance.now();
              for (const id of ids) lockMapRef.current.set(id, now);
            },
            onSnapCheck: opts?.onSnapCheck,
            onWrongRotationHint: (groupId, pieceIds) => {
              const ref = opts?.wrongRotationHintRef;
              if (!ref) return;
              const now = performance.now();
              const cur = ref.current;
              if (cur && now - cur.triggeredAt < 5000) return;
              ref.current = { groupId, pieceIds, triggeredAt: now };
            },
            onPuzzleComplete: () => {
              clearPuzzleState();
              soundManager.play("complete");
              const opts = optionsRef.current;
              const prefersReducedMotion =
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              const batterySaver = opts?.batterySaverMode ?? false;
              if (!prefersReducedMotion && !batterySaver) {
                const pieceCount = grid.rows * grid.cols;
                const particleCount = Math.min(
                  280,
                  Math.max(60, Math.floor(pieceCount * 3.5)),
                );
                const spread = pieceCount <= 16 ? 50 : pieceCount <= 36 ? 65 : 80;
                const theme = optionsRef.current?.themeRef?.current ?? "light";
                const colors = CONFETTI_COLORS_BY_THEME[theme];
                import("canvas-confetti").then((confetti) => {
                  confetti.default({
                    particleCount,
                    spread,
                    origin: { y: 0.6 },
                    colors,
                  });
                });
              }
            },
          },
        );

        if (hasSavedGame && savedState && resumeChoice === "resume") {
          try {
            next.restoreFromSaved(savedState.pieces);
          } catch (e) {
            console.warn("Failed to restore puzzle state, starting fresh:", e);
            clearPuzzleState();
            // next already has fresh pieces; no need to recreate
          }
        } else if (options?.initialSessionPieces?.length) {
          try {
            next.restoreFromSaved(options.initialSessionPieces);
          } catch (e) {
            console.warn("Failed to restore session state:", e);
          }
        }

        next.setPieceLockingEnabled(pieceLockingEnabled);
        setManager(next);
        setState(next.getState());
        setIsLoading(false);
      };

      // ResizeObserver: measure board when CSS layout is stable (board sized by aspect-ratio).
      let didRun = false;
      const ro = new ResizeObserver(() => {
        if (didRun) return;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (didRun || !mainEl || !boardEl) return;
            const r = boardEl.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) return;
            didRun = true;
            ro.disconnect();
            clearTimeout(fallbackId);
            runSizing();
          });
        });
      });
      ro.observe(boardEl);
      const fallbackId = setTimeout(() => {
        if (!didRun) {
          didRun = true;
          ro.disconnect();
          runSizing();
        }
      }, 200);
      sizingCleanupRef.current = () => {
        ro.disconnect();
        clearTimeout(fallbackId);
      };
    };
    return () => {
      sizingCleanupRef.current?.();
      sizingCleanupRef.current = null;
    };
  }, [
    grid,
    pieceLockingEnabled,
    timeMode,
    countdownMinutes,
    lastInteractionRef,
    resumeChoice,
    options?.initialSessionPieces,
  ]);

  useEffect(() => {
    manager?.setPieceLockingEnabled(pieceLockingEnabled);
  }, [manager, pieceLockingEnabled]);

  // Decay combo when idle (recompute from placement times)
  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      const comboCutoff = now - SNAP_COMBO_IDLE_MS;
      const recent = placementTimesRef.current.filter((t) => t > comboCutoff);
      setSnapCombo((prev) => {
        const next = recent.length;
        return next !== prev ? next : prev;
      });
    }, 400);
    return () => clearInterval(id);
  }, []);

  // Resize observer: keep manager board size in sync with DOM (no min clamp so coordinate system matches canvas)
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl || !manager) return;

    let debounceId: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_MS = 80;

    const ro = new ResizeObserver(() => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        debounceId = null;
        const rect = boardEl.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        if (w <= 0 || h <= 0) return;
        manager.setBoardSize(w, h);
        setState(manager.getState());
      }, DEBOUNCE_MS);
    });

    ro.observe(boardEl);
    return () => {
      if (debounceId) clearTimeout(debounceId);
      ro.disconnect();
    };
  }, [manager]);

  return {
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
    snapCombo,
    setSnapCombo,
  };
}
