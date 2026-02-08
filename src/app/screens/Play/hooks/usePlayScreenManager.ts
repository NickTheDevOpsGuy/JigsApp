import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import {
  loadPuzzleState,
  clearPuzzleState,
  incrementLocalCompletions,
} from "@/puzzle/puzzleStorage";
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

  // Initial setup: create manager and compute an appropriate board/piece size.
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
      const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;
      const isMobile = viewportW < 600;

      // On iOS, initial layout measurements can be 0. If we size from 0, pieces
      // become tiny and the initial scatter can stack pieces.
      const padding = isMobile ? 8 : 12;
      const trayReserveH = isMobile ? 120 : 0; // approximate Piece Drawer height on mobile
      const topBarReserveH = isMobile ? 56 : 64;

      const fallbackW = viewportW - padding * 2;
      const fallbackH = viewportH - padding * 2 - trayReserveH - topBarReserveH;

      const availW = Math.max(
        260,
        Math.floor((rect.width > 50 ? rect.width : fallbackW) - padding * 2),
      );
      const availH = Math.max(
        260,
        Math.floor((rect.height > 50 ? rect.height : fallbackH) - padding * 2),
      );

      // Compute square tile size.
      const basePieceSize = computeTileSize(availW, availH, grid, viewportW);
      const mobileMax = isMobile ? 56 : Infinity;
      const pieceSize = Math.min(basePieceSize, mobileMax);

      // Board size: always at least the assembled puzzle, plus a bit of extra room so
      // the initial shuffle does not collapse into one position.
      const minBoardW = grid.cols * pieceSize;
      const minBoardH = grid.rows * pieceSize;
      const extraScatter = pieceSize * (isMobile ? 1.0 : 1.5);

      const boardW = Math.max(Math.floor(availW), Math.floor(minBoardW + extraScatter));
      const boardH = Math.max(Math.floor(availH), Math.floor(minBoardH + extraScatter));

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
            incrementLocalCompletions();
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

  // Resize observer: keep manager in sync with board size.
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
