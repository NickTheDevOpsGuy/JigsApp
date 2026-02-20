import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import {
  STORAGE_KEY,
  computeTileSize,
  getStoredPieceCut,
} from "../playScreenUtils";
import { MAX_DEPTH_RATIO } from "@/puzzle/cutType";
import type { TimeMode } from "../timeMode";
import type { Theme } from "@/hooks/useTheme";
import type { SnapParticle } from "@/puzzle/canvas/renderBoardHelpers";
import { CONFETTI_COLORS_BY_THEME } from "@/data/confettiColors";
import { TIME_DECAY_COMBO_MS, TIME_DECAY_PLACEMENT_BONUS_BASE } from "../timeDecayScore";

export type ResumeChoice = "resume" | "fresh" | null;

const PLACEMENT_STREAK_MS = 3000;
const STREAK_COOLDOWN_MS = 5000;
const SNAP_PARTICLE_COUNT = 8;
/** Time Attack: bonus window in ms. Placements within this window get combo multiplier. */
const TIME_ATTACK_COMBO_MS = 4000;
/** Time Attack: base bonus points per fast placement. */
const TIME_ATTACK_BONUS_BASE = 5;

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
  /** When changed (e.g. replay with different cut), forces manager re-creation. */
  cutKey?: number,
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
    /** When true, track Time Attack bonus points and combo for scoring. */
    isTimeAttack?: boolean;
    /** Called when Time Attack combo changes (for combo meter UI). */
    onComboChange?: (combo: number) => void;
    /** When true, track Time Decay placement bonus (score decays over time, placements add). */
    isTimeDecay?: boolean;
    /** Called when Time Decay combo changes (for combo meter UI). */
    onTimeDecayComboChange?: (combo: number) => void;
    /** Ref to current elapsed ms (for replay recording). */
    elapsedMsRef?: MutableRefObject<number>;
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
  const timeAttackComboRef = useRef(0);
  const timeAttackLastPlacementRef = useRef<number | null>(null);
  const timeAttackBonusRef = useRef(0);
  const timeDecayLastPlacementRef = useRef<number | null>(null);
  const timeDecayComboRef = useRef(0);
  const timeDecayBonusRef = useRef(0);
  const placementSequenceRef = useRef<
    {
      elapsedMs: number;
      pieceIds: string[];
      timestampMs?: number;
      timeToSnapMs?: number;
    }[]
  >([]);
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
        const rect = mainEl.getBoundingClientRect();
        const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
        const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
        const isMobile = viewportW < 600;
        const minAvail = isMobile ? 260 : 400;
        // If container measures too early (tiny board on first paint), fall back to window dimensions
        const rectW = Math.floor(rect.width);
        const rectH = Math.floor(rect.height);
        const fallbackW =
          isMobile && (rectW < minAvail || rectW === 0) ? viewportW - 24 : rectW;
        const fallbackH =
          isMobile && (rectH < minAvail || rectH === 0) ? viewportH - 24 : rectH;
        const availW = Math.max(minAvail, fallbackW - 24);
        const availH = Math.max(minAvail, fallbackH - 24);

        // Compute square tile size (smaller on mobile for better fit)
        const pieceSize = computeTileSize(availW, availH, grid, viewportW);

        // Tabs extend beyond tile (up to 28% for irregular cut); board must fit assembled puzzle + pad margin
        const minPad = Math.ceil(pieceSize * MAX_DEPTH_RATIO);
        const boardPad = Math.max(18, minPad);

        // Board: fit puzzle; scale by piece count so more pieces = smaller relative canvas (9×9 shouldn't dominate)
        const assembledW = grid.cols * pieceSize;
        const assembledH = grid.rows * pieceSize;
        const minBoardW = assembledW + 2 * boardPad;
        const minBoardH = assembledH + 2 * boardPad;
        const pieceCount = grid.rows * grid.cols;
        const fillRatio = isMobile
          ? pieceCount >= 25
            ? 0.99
            : pieceCount >= 16
              ? 0.98
              : 0.97
          : 0.88;
        // Scale down canvas for larger puzzles so the board doesn't get huge (e.g. 9×9)
        const pieceCountScale =
          pieceCount <= 9
            ? 1
            : pieceCount <= 16
              ? isMobile
                ? 0.96
                : 0.92
              : pieceCount <= 25
                ? isMobile
                  ? 0.88
                  : 0.82
                : pieceCount <= 36
                  ? isMobile
                    ? 0.78
                    : 0.72
                  : pieceCount <= 49
                    ? isMobile
                      ? 0.7
                      : 0.65
                    : pieceCount <= 64
                      ? isMobile
                        ? 0.62
                        : 0.58
                      : isMobile
                        ? 0.56
                        : 0.52;
        const effectiveFill = fillRatio * pieceCountScale;
        let boardW = Math.max(minBoardW, Math.floor(availW * effectiveFill));
        let boardH = Math.max(minBoardH, Math.floor(availH * effectiveFill));
        if (isMobile) {
          const maxW = Math.max(minBoardW, (rectW > 0 ? rectW : viewportW) - 16);
          const maxH = Math.max(minBoardH, (rectH > 0 ? rectH : viewportH) - 16);
          boardW = Math.min(boardW, maxW);
          boardH = Math.min(boardH, maxH);
        }

        boardEl.style.width = `${boardW}px`;
        boardEl.style.height = `${boardH}px`;

        const cutType = getStoredPieceCut();
        const savedState = loadPuzzleState();
        const hasSavedGame =
          savedState &&
          savedState.imageUrl === imageUrl &&
          savedState.grid.rows === grid.rows &&
          savedState.grid.cols === grid.cols &&
          (savedState.cutType ?? "classic") === cutType;

        if (hasSavedGame && savedState && resumeChoice === "resume") {
          setElapsedSeconds(savedState.elapsedSeconds);
        } else {
          const isCountdown = timeMode === "countdown" || timeMode === "timeAttack";
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
        timeAttackComboRef.current = 0;
        timeAttackLastPlacementRef.current = null;
        timeAttackBonusRef.current = 0;
        timeDecayLastPlacementRef.current = null;
        timeDecayComboRef.current = 0;
        timeDecayBonusRef.current = 0;
        placementSequenceRef.current = [];
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

        const opts = optionsRef.current;
        const next = new PuzzleManager(
          {
            imageUrl,
            boardWidth: boardW,
            boardHeight: boardH,
            grid,
            pieceWidth: pieceSize,
            pieceHeight: pieceSize,
            isMobile,
            snapScaleRef: opts?.snapScaleRef,
            relaxedToleranceMultiplierRef,
            cutType,
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
              // Placement streak: 3+ placements in 3s triggers "On fire!"
              placementTimesRef.current.push(now);
              const cutoff = now - PLACEMENT_STREAK_MS;
              placementTimesRef.current = placementTimesRef.current.filter(
                (t) => t > cutoff,
              );
              if (
                placementTimesRef.current.length >= 3 &&
                (lastStreakAtRef.current == null ||
                  now - lastStreakAtRef.current > STREAK_COOLDOWN_MS)
              ) {
                lastStreakAtRef.current = now;
                opts?.onPlacementStreak?.();
              }
              if (opts?.isTimeAttack) {
                const last = timeAttackLastPlacementRef.current;
                if (last != null && now - last <= TIME_ATTACK_COMBO_MS) {
                  timeAttackComboRef.current += 1;
                } else {
                  timeAttackComboRef.current = 1;
                }
                timeAttackLastPlacementRef.current = now;
                const bonus = TIME_ATTACK_BONUS_BASE * timeAttackComboRef.current;
                timeAttackBonusRef.current += bonus;
                opts?.onComboChange?.(timeAttackComboRef.current);
              }
              if (opts?.isTimeDecay) {
                const last = timeDecayLastPlacementRef.current;
                if (last != null && now - last <= TIME_DECAY_COMBO_MS) {
                  timeDecayComboRef.current += 1;
                  timeDecayBonusRef.current += TIME_DECAY_PLACEMENT_BONUS_BASE * 2;
                } else {
                  timeDecayComboRef.current = 1;
                  timeDecayBonusRef.current += TIME_DECAY_PLACEMENT_BONUS_BASE;
                }
                timeDecayLastPlacementRef.current = now;
                opts?.onTimeDecayComboChange?.(timeDecayComboRef.current);
              }
              const elapsedMs = opts?.elapsedMsRef?.current ?? 0;
              const timeToSnapMs =
                startTime != null ? Math.round(now - startTime) : undefined;
              placementSequenceRef.current.push({
                elapsedMs,
                pieceIds: [p.id],
                timestampMs: now,
                timeToSnapMs,
              });
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
              if (opts?.isTimeAttack) {
                const last = timeAttackLastPlacementRef.current;
                if (last != null && now - last <= TIME_ATTACK_COMBO_MS) {
                  timeAttackComboRef.current += 1;
                } else {
                  timeAttackComboRef.current = 1;
                }
                timeAttackLastPlacementRef.current = now;
                const bonus = TIME_ATTACK_BONUS_BASE * timeAttackComboRef.current;
                timeAttackBonusRef.current += bonus;
                opts?.onComboChange?.(timeAttackComboRef.current);
              }
              if (opts?.isTimeDecay) {
                const last = timeDecayLastPlacementRef.current;
                if (last != null && now - last <= TIME_DECAY_COMBO_MS) {
                  timeDecayComboRef.current += 1;
                  timeDecayBonusRef.current += TIME_DECAY_PLACEMENT_BONUS_BASE * 2;
                } else {
                  timeDecayComboRef.current = 1;
                  timeDecayBonusRef.current += TIME_DECAY_PLACEMENT_BONUS_BASE;
                }
                timeDecayLastPlacementRef.current = now;
                opts?.onTimeDecayComboChange?.(timeDecayComboRef.current);
              }
              const elapsedMs = opts?.elapsedMsRef?.current ?? 0;
              const timeToSnapMs =
                startTime != null ? Math.round(now - startTime) : undefined;
              placementSequenceRef.current.push({
                elapsedMs,
                pieceIds,
                timestampMs: now,
                timeToSnapMs,
              });
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

      // ResizeObserver: measure when layout is stable (more reliable than rAF on mobile).
      // Observer fires after layout; double rAF inside callback if it fires too early.
      let didRun = false;
      const ro = new ResizeObserver(() => {
        if (didRun) return;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (didRun || !mainEl || !boardEl) return;
            didRun = true;
            ro.disconnect();
            clearTimeout(fallbackId);
            runSizing();
          });
        });
      });
      ro.observe(mainEl);
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
    cutKey,
    options?.initialSessionPieces,
  ]);

  useEffect(() => {
    manager?.setPieceLockingEnabled(pieceLockingEnabled);
  }, [manager, pieceLockingEnabled]);

  // Resize observer
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl || !manager) return;

    const ro = new ResizeObserver(() => {
      const rect = boardEl.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      manager.setBoardSize(w, h);
      setState(manager.getState());
    });

    ro.observe(boardEl);
    return () => ro.disconnect();
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
    timeAttackBonusRef,
    timeDecayBonusRef,
    placementSequenceRef,
    timeAttackComboRef,
    timeAttackLastPlacementRef,
    timeDecayComboRef,
    timeDecayLastPlacementRef,
  };
}
