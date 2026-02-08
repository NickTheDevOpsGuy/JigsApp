import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { loadPuzzleState, clearPuzzleState } from "@/puzzle/puzzleStorage";
import { soundManager } from "@/audio/sounds";
import { STORAGE_KEY, computeTileSize } from "../playScreenUtils";
import type { TimeMode } from "../timeMode";

export type ResumeChoice = "resume" | "fresh" | null;

export function usePlayScreenManager(
  grid: { rows: number; cols: number },
  pieceLockingEnabled: boolean,
  timeMode: TimeMode,
  countdownMinutes: number,
  lastInteractionRef: MutableRefObject<number>,
  resumeChoice: ResumeChoice,
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
  const [awaitingResumeChoice, setAwaitingResumeChoice] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [puzzleKey, setPuzzleKey] = useState(0);

  // Initial setup: create manager with square tiles
  useEffect(() => {
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

      const rect = mainEl.getBoundingClientRect();
      const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
      const isMobile = viewportW < 600;
      const minAvail = isMobile ? 260 : 400;
      const availW = Math.max(minAvail, Math.floor(rect.width) - 24);
      const availH = Math.max(minAvail, Math.floor(rect.height) - 24);

      // Compute square tile size (smaller on mobile for better fit)
      const pieceSize = computeTileSize(availW, availH, grid, viewportW);

      // Board: fit puzzle; on mobile cap to available space so it doesn't overflow
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

      if (hasSavedGame && resumeChoice === "fresh") {
        clearPuzzleState();
        setPuzzleKey((k) => k + 1);
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

      if (hasSavedGame && savedState && resumeChoice === "resume") {
        next.restoreFromSaved(savedState.pieces);
      }

      next.setPieceLockingEnabled(pieceLockingEnabled);
      setManager(next);
      setState(next.getState());
      setIsLoading(false);
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
  };
}
