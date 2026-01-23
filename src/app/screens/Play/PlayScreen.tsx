// src/app/screens/Play/PlayScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState, DragState } from "@/puzzle/types";
import { renderBoard } from "@/puzzle/canvas/renderBoard";

type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function PlayScreen() {
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

  // Your grid
  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);

  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Track board size in CSS pixels
  const boardSizeRef = useRef({ w: 900, h: 520 });

  // Helper: compute a tile size that makes the assembled puzzle fill the board nicely
  function computeTileSize(boardW: number, boardH: number) {
    // make the assembled puzzle about ~65% of board’s smaller dimension
    const targetFill = 0.65;

    const tileFromW = (boardW * targetFill) / grid.cols;
    const tileFromH = (boardH * targetFill) / grid.rows;

    // Use the limiting axis so it fits both dimensions
    const tile = Math.floor(Math.min(tileFromW, tileFromH));

    // Clamp so it doesn’t get ridiculous on tiny/huge screens
    return clamp(tile, 56, 160);
  }

  // Initial setup: create manager once we know board size
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const boardW = Math.max(320, Math.floor(rect.width));
    const boardH = Math.max(240, Math.floor(rect.height));
    boardSizeRef.current = { w: boardW, h: boardH };

    const pieceSize = computeTileSize(boardW, boardH);

    const next = new PuzzleManager(
      {
        imageUrl: "/phuzzle.png",
        boardWidth: boardW,
        boardHeight: boardH,
        grid,
        pieceWidth: pieceSize,
        pieceHeight: pieceSize,
        // keep your defaults inside PuzzleManager/config
      },
      {
        onPiecePlaced: (p) => {
          popMapRef.current.set(p.id, performance.now());
        },
        onPuzzleComplete: () => {
          // confetti hook can go here if you want it
        },
      },
    );

    setManager(next);
    setState(next.getState());
    setDrag(next.getDragState());
  }, [grid]);

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
      setDrag(manager.getDragState());
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
      const assembledW = st.grid.cols * st.pieces[0].tileW;
      const assembledH = st.grid.rows * st.pieces[0].tileH;

      renderBoard(
        ctx,
        st,
        img,
        assembledW,
        assembledH,
        popMapRef.current,
        performance.now(),
        debug,
      );

      // keep react state reasonably fresh (avoid re-render every frame if you want)
      setState(st);
      setDrag(manager.getDragState());

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [manager, debug]);

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.src = "/phuzzle.png";
    img.onload = () => {
      imgRef.current = img;
    };
  }, []);

  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => history.back()}>
          Back
        </button>
        <div className={styles.title}>Phuzzle</div>

        <div className={styles.hud}>
          <div className={styles.hudPill}>⏱ {Math.floor(performance.now() / 1000)}s</div>
          <div className={styles.hudPill}>🧩 {left} left</div>
          <div className={styles.hudPillLive}>In progress</div>
        </div>

        <button
          className={styles.iconBtn}
          onClick={() =>
            setDebug((d) => ({
              ...d,
              showGrid: !d.showGrid,
            }))
          }
        >
          Debug
        </button>
      </div>

      <div className={styles.main}>
        <div className={styles.board} ref={boardRef}>
          <canvas className={styles.canvas} ref={canvasRef} />
        </div>

        {/* if you have a tray component, it should be rendered here.
            your screenshot shows tray label but 0 pieces; that's logic, not CSS. */}
      </div>
    </div>
  );
}
