// src/app/screens/Play/hooks/usePlayScreenManager.ts

import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { STORAGE_KEY, computeTileSize } from "../playScreenUtils";
import type { TimeMode } from "../timeMode";

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
  const popMapRef = useRef<Map<string, number>>(new Map());

  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Initial setup: create manager with square tiles
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

      // Use real available space. On mobile, reserve room for tray below the board.
      const padding = isMobile ? 12 : 24;
      const trayReserve = isMobile ? 120 : 0; // tray height + gap + padding
      const availW = Math.max(0, Math.floor(rect.width) - padding);
      const availH = Math.max(0, Math.floor(rect.height) - padding - trayReserve);

      // Base size from existing helper
      const basePieceSize = computeTileSize(availW, availH, grid, viewportW);

      // Mobile cap by difficulty – keep pieces small so puzzle fits on screen
      const pieceCount = grid.rows * grid.cols;
      const mobileMax =
        pieceCount >= 36
          ? 34 // 6x6+
          : pieceCount >= 25
            ? 38 // 5x5+
            : 44; // 4x4 and lower

      const pieceSize = isMobile ? Math.min(basePieceSize, mobileMax) : basePieceSize;

      const minBoardW = grid.cols * pieceSize;
      const minBoardH = grid.rows * pieceSize;

      // Size the board to the available play area while ensuring the grid fits
      const boardW = Math.max(Math.floor(availW), minBoardW);
      const boardH = Math.max(Math.floor(availH), minBoardH);

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
          onPiecePlaced: (p) => {
            lastInteractionRef.current = performance.now();
            popMapRef.current.set(p.id, performance.now());
            soundManager.play("place");
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
    setState,
    elapsedSeconds,
    setElapsedSeconds,
    boardRef,
    canvasRef,
    trayRef,
    mainRef,
    imgRef,
    popMapRef,
  };
}
