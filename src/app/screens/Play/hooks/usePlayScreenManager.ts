import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { STORAGE_KEY, computeTileSize } from "../playScreenUtils";
import type { TimeMode } from "../timeMode";
import type { Theme } from "@/hooks/useTheme";
import type { SnapParticle } from "@/puzzle/canvas/renderBoardHelpers";
import { CONFETTI_COLORS_BY_THEME } from "@/data/confettiColors";

export type ResumeChoice = "resume" | "fresh" | null;

const PLACEMENT_STREAK_MS = 3000;
const STREAK_COOLDOWN_MS = 5000;
const SNAP_PARTICLE_COUNT = 8;

export function usePlayScreenManager(
  grid: { rows: number; cols: number },
  pieceLockingEnabled: boolean,
  timeMode: TimeMode,
  countdownMinutes: number,
  lastInteractionRef: MutableRefObject<number>,
  resumeChoice: ResumeChoice,
  options?: {
    haptic?: (kind: "place" | "snap" | "rotate") => void;
    themeRef?: MutableRefObject<Theme | undefined>;
    onPlacementStreak?: () => void;
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
  const sizingCleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

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
        const isMobile = viewportW < 600;
        const minAvail = isMobile ? 260 : 400;
        const availW = Math.max(minAvail, Math.floor(rect.width) - 24);
        const availH = Math.max(minAvail, Math.floor(rect.height) - 24);

        // Compute square tile size (smaller on mobile for better fit)
        const pieceSize = computeTileSize(availW, availH, grid, viewportW);

        // Board: fit puzzle; scale by piece count so more pieces = bigger board for planning
        const minBoardW = grid.cols * pieceSize;
        const minBoardH = grid.rows * pieceSize;
        const pieceCount = grid.rows * grid.cols;
        const fillRatio = isMobile
          ? pieceCount >= 25
            ? 0.98
            : pieceCount >= 16
              ? 0.96
              : 0.95
          : 0.88;
        let boardW = Math.max(minBoardW, Math.floor(availW * fillRatio));
        let boardH = Math.max(minBoardH, Math.floor(availH * fillRatio));
        if (isMobile) {
          boardW = Math.min(boardW, Math.max(minBoardW, Math.floor(rect.width) - 16));
          boardH = Math.min(boardH, Math.max(minBoardH, Math.floor(rect.height) - 16));
        }

        boardEl.style.width = `${boardW}px`;
        boardEl.style.height = `${boardH}px`;

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

        // Snap tolerance: generous so "close" locks without feeling stiff.
        const snapTolerancePx = isMobile
          ? Math.min(60, Math.max(48, Math.round(pieceSize * 1.2)))
          : 48;

        const next = new PuzzleManager(
          {
            imageUrl,
            boardWidth: boardW,
            boardHeight: boardH,
            grid,
            pieceWidth: pieceSize,
            pieceHeight: pieceSize,
            snapTolerancePx,
          },
          {
            onPiecePlaced: (p) => {
              const now = performance.now();
              const opts = optionsRef.current;
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
            },
            onPieceSnapped: (pieceIds, center) => {
              const now = performance.now();
              const opts = optionsRef.current;
              lastInteractionRef.current = now;
              soundManager.play("snap");
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
            onPuzzleComplete: () => {
              clearPuzzleState();
              soundManager.play("complete");
              const theme = optionsRef.current?.themeRef?.current ?? "light";
              const colors = CONFETTI_COLORS_BY_THEME[theme];
              import("canvas-confetti").then((confetti) => {
                confetti.default({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors,
                });
              });
            },
          },
        );

        if (hasSavedGame && savedState && resumeChoice === "resume") {
          next.restoreFromSaved(savedState.pieces);
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
  };
}
