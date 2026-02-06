import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PuzzleState } from "@/puzzle/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { STORAGE_KEY, computeTileSize } from "../playScreenUtils";
import type { TimeMode } from "../timeMode";
import type { SnapFromMap } from "@/puzzle/canvas/renderBoard";

export function usePlayScreenManager(
  grid: { rows: number; cols: number },
  pieceLockingEnabled: boolean,
  timeMode: TimeMode,
  countdownMinutes: number,
  lastInteractionRef: MutableRefObject<number>,
) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Pop animation timestamps (piece placed)
  const popMapRef = useRef<Map<string, number>>(new Map());

  // Snap-from animation cache used by renderBoard()
  const snapFromMapRef = useRef<SnapFromMap>(new Map());

  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const mainEl = mainRef.current;
    const boardEl = boardRef.current;
    if (!mainEl || !boardEl) return;

    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";
    if (!imageUrl) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      imgRef.current = img;

      const rect = mainEl.getBoundingClientRect();
      const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
      const isMobile = viewportW < 600;

      // Use real available space. Do not force a minimum on mobile.
      const padding = isMobile ? 12 : 24;
      const availW = Math.max(0, Math.floor(rect.width) - padding);
      const availH = Math.max(0, Math.floor(rect.height) - padding);

      // Base size from existing helper
      const basePieceSize = computeTileSize(availW, availH, grid, viewportW);

      // Mobile cap by difficulty so higher grids shrink naturally
      const pieceCount = grid.rows * grid.cols;
      const mobileMax =
        pieceCount >= 36
          ? 14 // 6x6+
          : pieceCount >= 26
            ? 16 // 5x5–5x7, 7x5 (35 pieces)
            : pieceCount >= 17
              ? 18 // 4x4, 5x5
              : pieceCount >= 10
                ? 20 // 4x4
                : 18; // 3x3 (9 pieces)

      const pieceSize = isMobile ? Math.min(basePieceSize, mobileMax) : basePieceSize;

      const minBoardW = grid.cols * pieceSize;
      const minBoardH = grid.rows * pieceSize;

      const fillRatio = isMobile ? 0.95 : 0.88;
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

      if (hasSavedGame && savedState) {
        setElapsedSeconds(savedState.elapsedSeconds);
      } else {
        const isCountdown = timeMode === "countdown";
        setElapsedSeconds(isCountdown ? countdownMinutes * 60 : 0);
      }

      // Reset animation caches when creating a new manager
      popMapRef.current.clear();
      snapFromMapRef.current.clear();

      const next = new PuzzleManager(
        {
          imageUrl,
          boardWidth: boardW,
          boardHeight: boardH,
          grid,
          pieceWidth: pieceSize,
          pieceHeight: pieceSize,
        },
        {
          onPiecePlaced: (piece) => {
            lastInteractionRef.current = performance.now();
            popMapRef.current.set(piece.id, performance.now());
            soundManager.play("place");
          },

          // Capture "from" positions BEFORE the snap occurs (for smooth snap animation)
          onBeforeSnap: (pieces: Piece[]) => {
            const now = performance.now();
            for (const p of pieces) {
              snapFromMapRef.current.set(p.id, {
                fromX: p.x,
                fromY: p.y,
                startMs: now,
              });
            }
          },

          onPieceSnapped: () => {
            lastInteractionRef.current = performance.now();
            soundManager.play("snap");
          },

          onPuzzleComplete: () => {
            clearPuzzleState();
            soundManager.play("complete");
            import("canvas-confetti").then((confetti) => {
              confetti.default({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
              });
            });
          },
        },
      );

      if (hasSavedGame && savedState) {
        next.restoreFromSaved(savedState.pieces);
      }

      next.setPieceLockingEnabled(pieceLockingEnabled);
      setManager(next);
      setState(next.getState());
    };
  }, [grid, pieceLockingEnabled, timeMode, countdownMinutes, lastInteractionRef]);

  useEffect(() => {
    manager?.setPieceLockingEnabled(pieceLockingEnabled);
  }, [manager, pieceLockingEnabled]);

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
    setState,
    elapsedSeconds,
    setElapsedSeconds,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    imgRef,
    popMapRef,
    snapFromMapRef,
  };
}
