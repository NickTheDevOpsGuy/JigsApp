import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import {
  savePuzzleState,
  loadPuzzleState,
  clearPuzzleState,
} from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import {
  STORAGE_KEY,
  GRID_KEY,
  PIECE_LOCKING_KEY,
  computeTileSize,
} from "../playScreenUtils";

export function usePlayScreenManager(
  grid: { rows: number; cols: number },
  pieceLockingEnabled: boolean,
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

  // Initial setup: create manager. Board size = assembled puzzle dimensions.
  useEffect(() => {
    const mainEl = mainRef.current;
    const boardEl = boardRef.current;
    if (!mainEl || !boardEl) return;

    const rect = mainEl.getBoundingClientRect();
    const availW = Math.max(320, Math.floor(rect.width));
    const availH = Math.max(240, Math.floor(rect.height));

    const pieceSize = computeTileSize(availW, availH, grid);
    const boardW = grid.cols * pieceSize;
    const boardH = grid.rows * pieceSize;

    boardEl.style.width = `${boardW}px`;
    boardEl.style.height = `${boardH}px`;
    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";

    const savedState = loadPuzzleState();
    const hasSavedGame =
      savedState &&
      savedState.imageUrl === imageUrl &&
      savedState.grid.rows === grid.rows &&
      savedState.grid.cols === grid.cols;

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
          popMapRef.current.set(p.id, performance.now());
          soundManager.play("place");
        },
        onPieceSnapped: () => soundManager.play("snap"),
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
  }, [grid, pieceLockingEnabled]);

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

  // Load image
  useEffect(() => {
    const dataUrl = localStorage.getItem(STORAGE_KEY);
    if (!dataUrl) return;
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      imgRef.current = img;
    };
  }, []);

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
