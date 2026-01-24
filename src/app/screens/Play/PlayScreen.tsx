// src/app/screens/Play/PlayScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";
import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { PieceTray } from "@/components/PieceTray/PieceTray";
import { getAverageColor } from "@/puzzle/colorUtils";
import {
  savePuzzleState,
  loadPuzzleState,
  clearPuzzleState,
} from "@/puzzle/puzzleStorage";

const STORAGE_KEY = "phuzzle:imageDataUrl";
const GRID_KEY = "phuzzle:gridSize";

// Debug mode from environment variable
const SHOW_DEBUG = import.meta.env.VITE_SHOW_DEBUG === "true";

function parseGrid(stored: string | null): { rows: number; cols: number } {
  if (!stored) return { rows: 4, cols: 4 }; // default
  const [r, c] = stored.split("x").map(Number);
  if (r && c) return { rows: r, cols: c };
  return { rows: 4, cols: 4 };
}

type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function PlayScreen() {
  const navigate = useNavigate();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const popMapRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number | null>(null);

  const [debug, setDebug] = useState<DebugFlags>({
    showGrid: false,
    showBounds: false,
    showIds: false,
  });

  // Preview image visibility
  const [showPreview, setShowPreview] = useState(false);

  // Track completion time for animation
  const completedAtRef = useRef<number | null>(null);

  // Grid from localStorage
  const grid = useMemo(() => parseGrid(localStorage.getItem(GRID_KEY)), []);

  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track board size in CSS pixels
  const boardSizeRef = useRef({ w: 900, h: 520 });

  // Helper: compute a tile size that makes the assembled puzzle fill the board nicely
  function computeTileSize(boardW: number, boardH: number) {
    // make the assembled puzzle about ~65% of board's smaller dimension
    const targetFill = 0.65;

    const tileFromW = (boardW * targetFill) / grid.cols;
    const tileFromH = (boardH * targetFill) / grid.rows;

    // Use the limiting axis so it fits both dimensions
    const tile = Math.floor(Math.min(tileFromW, tileFromH));

    // Clamp so it doesn't get ridiculous on tiny/huge screens
    return clamp(tile, 56, 160);
  }

  // Timer effect - stops when complete
  useEffect(() => {
    if (state?.isComplete) return; // Don't run timer if complete

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.isComplete]);

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
        },
        onPuzzleComplete: () => {
          // Clear saved state on completion
          clearPuzzleState();

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

    setManager(next);
    setState(next.getState());
  }, [grid]);

  // Auto-save puzzle state when pieces change (debounced)
  useEffect(() => {
    if (!state || state.isComplete) return;

    const imageUrl = localStorage.getItem(STORAGE_KEY) || "";
    if (!imageUrl) return;

    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(() => {
      savePuzzleState(imageUrl, state.grid, state.pieces, elapsedSeconds);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state, elapsedSeconds]);

  // Resize observer: keep canvas + manager board size synced
  useEffect(() => {
    const el = boardRef.current;
    if (!el || !manager) return;

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const boardW = Math.max(320, Math.floor(rect.width));
      const boardH = Math.max(240, Math.floor(rect.height));
      boardSizeRef.current = { w: boardW, h: boardH };

      // Keep manager board size in CSS pixels
      manager.setBoardSize(boardW, boardH);
      setState(manager.getState());
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [manager]);

  // Animation loop: draw canvas
  useEffect(() => {
    if (!manager) return;

    const tick = () => {
      const canvas = canvasRef.current;
      const boardEl = boardRef.current;
      const img = imgRef.current;
      if (!canvas || !boardEl || !img) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const rect = boardEl.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      // Size backing store
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Draw everything in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const st = manager.getState();

      // assembled dims are puzzle-space, based on tile sizes
      const firstPiece = st.pieces[0];
      if (!firstPiece) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const assembledW = st.grid.cols * firstPiece.tileW;
      const assembledH = st.grid.rows * firstPiece.tileH;

      // Track completion time for glow animation
      if (st.isComplete && !completedAtRef.current) {
        completedAtRef.current = performance.now();
      } else if (!st.isComplete) {
        completedAtRef.current = null;
      }

      renderBoard(
        ctx,
        st,
        img,
        assembledW,
        assembledH,
        popMapRef.current,
        performance.now(),
        debug,
        manager.getDragState(),
        {
          draggedGroupId: null,
          hoveredPieceId: null,
          isComplete: st.isComplete,
          completedAtMs: completedAtRef.current,
        },
      );

      // keep react state reasonably fresh
      setState(st);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [manager, debug]);

  // Load image from localStorage
  useEffect(() => {
    const dataUrl = localStorage.getItem(STORAGE_KEY);
    if (!dataUrl) {
      console.warn("No image in localStorage");
      return;
    }

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      imgRef.current = img;
    };
  }, []);

  // ========== POINTER EVENT HANDLERS ==========

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current || !boardRef.current) return;

      const canvas = canvasRef.current;
      const boardRect = boardRef.current.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get CSS-space coordinates
      const cssX = e.clientX - boardRect.left;
      const cssY = e.clientY - boardRect.top;

      const st = manager.getState();
      // Only pick from pieces NOT in tray
      const boardPieces = st.pieces.filter((p) => !p.inTray);

      const pieceId = pickPieceId(ctx, boardPieces, cssX, cssY);

      if (!pieceId) return;

      // Middle click (button 1) = send to tray
      if (e.button === 1) {
        e.preventDefault();
        manager.movePieceToTray(pieceId);
        setState(manager.getState());
        return;
      }

      // Left click = start drag
      if (e.button === 0) {
        const piece = st.pieces.find((p) => p.id === pieceId);
        if (!piece) return;

        // Create a fake rect for the piece (manager expects this)
        const pieceRect = new DOMRect(
          boardRect.left + piece.x,
          boardRect.top + piece.y,
          piece.w,
          piece.h,
        );

        manager.pointerDown(pieceId, e.clientX, e.clientY, pieceRect);
        setState(manager.getState());

        // Capture pointer for smooth dragging
        canvas.setPointerCapture(e.pointerId);
      }

      // Right click = rotate
      if (e.button === 2) {
        e.preventDefault();
        manager.rotatePiece(pieceId);
        setState(manager.getState());
      }
    },
    [manager],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !boardRef.current) return;

      const boardRect = boardRef.current.getBoundingClientRect();
      manager.pointerMove(e.clientX, e.clientY, boardRect);
    },
    [manager],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!manager || !canvasRef.current) return;

      manager.pointerUp();
      setState(manager.getState());

      // Release pointer capture
      canvasRef.current.releasePointerCapture(e.pointerId);
    },
    [manager],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent right-click menu
  }, []);

  // Handle clicking a piece in the tray to bring it back to board
  const handleTrayPieceClick = useCallback(
    (pieceId: string) => {
      if (!manager) return;
      manager.movePieceFromTray(pieceId);
      setState(manager.getState());
    },
    [manager],
  );

  // Handle starting a new puzzle (clears saved state and reloads)
  const handleNewGame = useCallback(() => {
    if (!confirm("Start a new puzzle? Your current progress will be lost.")) return;
    clearPuzzleState();
    window.location.reload();
  }, []);

  // Get tray pieces sorted by color
  const trayPieces = useMemo(() => {
    if (!state || !imgRef.current) return [];

    const inTray = state.pieces.filter((p) => p.inTray);
    if (inTray.length === 0) return [];

    const img = imgRef.current;

    // Sort by average color (hue)
    return [...inTray].sort((a, b) => {
      const colorA = getAverageColor(img, a, state.grid);
      const colorB = getAverageColor(img, b, state.grid);
      return colorA.hue - colorB.hue;
    });
  }, [state]);

  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);
  const isComplete = state?.isComplete ?? false;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => navigate("/")}>
          Menu
        </button>
        <div className={styles.title}>Phuzzle</div>

        <div className={styles.hud}>
          <div className={styles.hudPill}>⏱ {formatTime(elapsedSeconds)}</div>
          <div className={styles.hudPill}>🧩 {left} left</div>
          <div className={isComplete ? styles.hudPillDone : styles.hudPillLive}>
            {isComplete ? "Complete!" : "In progress"}
          </div>
        </div>

        <button className={styles.iconBtn} onClick={() => setShowPreview((p) => !p)}>
          {showPreview ? "Hide" : "Preview"}
        </button>
        {SHOW_DEBUG && (
          <button
            className={styles.iconBtn}
            onClick={() =>
              setDebug((d) => ({
                ...d,
                showGrid: !d.showGrid,
                showBounds: !d.showBounds,
                showIds: !d.showIds,
              }))
            }
          >
            Debug
          </button>
        )}
        <button className={styles.iconBtn} onClick={handleNewGame}>
          Start New Puzzle
        </button>
      </div>

      <div className={styles.main}>
        <div className={styles.board} ref={boardRef}>
          <canvas
            className={styles.canvas}
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={handleContextMenu}
          />

          {/* Reference preview image */}
          {showPreview && imgRef.current && (
            <div className={styles.previewOverlay}>
              <img
                src={imgRef.current.src}
                alt="Puzzle preview"
                className={styles.previewImage}
              />
            </div>
          )}
        </div>
      </div>

      <PieceTray
        pieces={trayPieces}
        image={imgRef.current}
        grid={state?.grid ?? grid}
        onPieceClick={handleTrayPieceClick}
      />
    </div>
  );
}
