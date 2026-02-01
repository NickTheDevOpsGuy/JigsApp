import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState, GridSize } from "@/puzzle/types";
import {
  savePuzzleState,
  loadPuzzleState,
  clearPuzzleState,
} from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";

const STORAGE_KEY = "phuzzle:imageDataUrl";
const GRID_KEY = "phuzzle:gridSize";

function parseGrid(stored: string | null): GridSize {
  if (!stored) return { rows: 4, cols: 4 };
  const [r, c] = stored.split("x").map(Number);
  if (r && c) return { rows: r, cols: c };
  return { rows: 4, cols: 4 };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

interface UsePuzzleLifecycleOptions {
  boardRef: React.RefObject<HTMLDivElement | null>;
  isPaused: boolean;
  onPiecePlaced?: (pieceId: string) => void;
}

export function usePuzzleLifecycle({
  boardRef,
  isPaused,
  onPiecePlaced,
}: UsePuzzleLifecycleOptions) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const boardSizeRef = useRef({ w: 900, h: 520 });

  // Grid from localStorage
  const grid = useMemo(() => parseGrid(localStorage.getItem(GRID_KEY)), []);

  // Helper: compute tile size that makes puzzle fill board nicely
  const computeTileSize = useCallback(
    (boardW: number, boardH: number) => {
      const targetFill = 0.65;
      const tileFromW = (boardW * targetFill) / grid.cols;
      const tileFromH = (boardH * targetFill) / grid.rows;
      const tile = Math.floor(Math.min(tileFromW, tileFromH));
      return clamp(tile, 56, 160);
    },
    [grid],
  );

  // Timer effect - stops when complete or paused
  useEffect(() => {
    if (state?.isComplete) return;
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.isComplete, isPaused]);

  // Auto-save effect
  useEffect(() => {
    if (!state || state.isComplete) return;

    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";
    savePuzzleState(imageUrl, state.grid, state.pieces, elapsedSeconds);
  }, [state, elapsedSeconds]);

  // Initial setup: create manager once we know board size
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const boardW = Math.max(320, Math.floor(rect.width));
    const boardH = Math.max(240, Math.floor(rect.height));
    boardSizeRef.current = { w: boardW, h: boardH };

    const pieceSize = computeTileSize(boardW, boardH);
    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";

    // Check for saved game state
    const savedState = loadPuzzleState();
    const hasSavedGame =
      savedState &&
      savedState.imageUrl === imageUrl &&
      savedState.grid.rows === grid.rows &&
      savedState.grid.cols === grid.cols;

    // Restore elapsed time if we have a saved game
    if (hasSavedGame && savedState) {
      setElapsedSeconds(savedState.elapsedSeconds);
    } else {
      setElapsedSeconds(0);
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
          onPiecePlaced?.(p.id);
          soundManager.play("place");
        },
        onPieceSnapped: () => {
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

    // Restore piece positions if we have a saved game
    if (hasSavedGame && savedState) {
      next.restoreFromSaved(savedState.pieces);
    }

    // Load image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setManager(next);
      setState(next.getState());
    };
    img.onerror = () => {
      console.error("Failed to load puzzle image");
    };
    img.src = imageUrl;

    return () => {
      // Cleanup if needed
    };
  }, [boardRef, grid, computeTileSize, onPiecePlaced]);

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    clearPuzzleState();
    setElapsedSeconds(0);
    setManager(null);
    setState(null);
  }, []);

  return {
    manager,
    state,
    setState,
    elapsedSeconds,
    grid,
    imgRef,
    boardSizeRef,
    isComplete: state?.isComplete ?? false,
    resetPuzzle,
  };
}
