import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { STORAGE_KEY } from "../playScreenUtils";
import type { TimeMode } from "../timeMode";

/**
 * Mobile-first tile sizing.
 * These values are intentionally large for touch accuracy.
 */
function getTileSize(viewportWidth: number) {
  if (viewportWidth <= 390) return 88; // iPhone SE / Mini
  if (viewportWidth <= 430) return 96; // iPhone Pro / Max
  if (viewportWidth <= 768) return 104; // tablets
  return 90; // desktop default
}

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

  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl) return;

    const imageUrl = localStorage.getItem(STORAGE_KEY);
    if (!imageUrl) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      imgRef.current = img;

      const viewportWidth = window.innerWidth;
      const tileSize = getTileSize(viewportWidth);

      // 🔒 Board size is derived ONLY from tile size
      const boardWidth = grid.cols * tileSize;
      const boardHeight = grid.rows * tileSize;

      boardEl.style.width = `${boardWidth}px`;
      boardEl.style.height = `${boardHeight}px`;

      const savedState = loadPuzzleState();
      const hasSavedGame =
        savedState &&
        savedState.imageUrl === imageUrl &&
        savedState.grid.rows === grid.rows &&
        savedState.grid.cols === grid.cols;

      setElapsedSeconds(
        hasSavedGame
          ? savedState.elapsedSeconds
          : timeMode === "countdown"
            ? countdownMinutes * 60
            : 0,
      );

      const next = new PuzzleManager(
        {
          imageUrl,
          boardWidth,
          boardHeight,
          grid,
          pieceWidth: tileSize,
          pieceHeight: tileSize,
        },
        {
          onPiecePlaced: () => {
            lastInteractionRef.current = performance.now();
            soundManager.play("place");
          },
          onPieceSnapped: () => {
            lastInteractionRef.current = performance.now();
            soundManager.play("snap");
          },
          onPuzzleComplete: () => {
            clearPuzzleState();
            soundManager.play("complete");
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
  };
}
