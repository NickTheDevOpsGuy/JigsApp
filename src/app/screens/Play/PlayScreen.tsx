// src/app/screens/Play/PlayScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PuzzleState } from "@/puzzle/types";

import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { renderBoard, type PopMap } from "@/puzzle/canvas/renderBoard";

const STORAGE_KEY = "phuzzle:imageDataUrl";

/**
 * Canvas PlayScreen
 *
 * One canvas:
 * - PuzzleManager owns all state + snapping + grouping
 * - Canvas does drawing + hit testing
 */
export function PlayScreen() {
  const nav = useNavigate();
  const imgUrl = localStorage.getItem(STORAGE_KEY);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const managerRef = useRef<PuzzleManager | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Just used for "Loading..." and for Debug snapshots.
  const [state, setState] = useState<PuzzleState | null>(null);

  // pieceId -> animation start time
  const popMapRef = useRef<PopMap>(new Map());

  // RAF handle
  const rafRef = useRef<number | null>(null);

  // 2D context cache
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Debug toggle (no React state so it doesn't cause re-render spam)
  const debugRef = useRef(false);

  // Puzzle config
  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);
  const pieceSize = useMemo(() => ({ w: 72, h: 72 }), []);

  const assembledW = useMemo(() => grid.cols * pieceSize.w, [grid.cols, pieceSize.w]);
  const assembledH = useMemo(() => grid.rows * pieceSize.h, [grid.rows, pieceSize.h]);

  /**
   * Request a draw loop. We keep drawing while:
   * - dragging is active OR
   * - snap pop is animating
   */
  function ensureRaf() {
    if (rafRef.current != null) return;

    const tick = () => {
      rafRef.current = null;

      const mgr = managerRef.current;
      const ctx = ctxRef.current;
      const img = imageRef.current;

      if (!mgr || !ctx || !img) return;

      const s = mgr.getState();
      const now = performance.now();

      // Seed pop animations whenever a piece becomes justSnapped
      for (const p of s.pieces) {
        if (p.justSnapped && !popMapRef.current.has(p.id)) {
          popMapRef.current.set(p.id, now);
        }
      }

      // Remove finished pops + clear justSnapped in manager
      let anyAnimating = false;
      for (const [id, start] of popMapRef.current) {
        const t = now - start;
        if (t < 170) {
          anyAnimating = true;
        } else {
          popMapRef.current.delete(id);
          mgr.clearJustSnapped(id);
        }
      }

      // Draw
      renderBoard(ctx, s, img, assembledW, assembledH, popMapRef.current, now, {
        showGrid: debugRef.current,
        showBounds: debugRef.current,
        showIds: debugRef.current,
      });

      // Continue loop?
      const dragActive = mgr.getDragState().activeId != null;
      if (dragActive || anyAnimating) {
        ensureRaf();
      } else {
        // Keep React state in sync for Debug button snapshots etc.
        setState(mgr.getState());
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }

  // Init image + manager (once)
  useEffect(() => {
    if (!imgUrl) return;
    if (managerRef.current) return;

    const looksLikeDataUrl = imgUrl.startsWith("data:image/");
    console.info("[Phuzzle] PlayScreen storage check", {
      hasImgUrl: !!imgUrl,
      prefix: imgUrl.slice(0, 24),
      length: imgUrl.length,
      looksLikeDataUrl,
    });

    if (!looksLikeDataUrl) {
      console.warn(
        "[Phuzzle] Stored image is not a data URL. Re-upload in SetupScreen.",
        { storageKey: STORAGE_KEY },
      );
    }

    const img = new Image();
    img.src = imgUrl;

    loadImageReliable(img)
      .then(() => {
        imageRef.current = img;

        console.info("[Phuzzle] Image loaded", {
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        });

        // Placeholder until ResizeObserver gives real board size
        const initialBoardWidth = 900;
        const initialBoardHeight = 520;

        managerRef.current = new PuzzleManager(
          {
            imageUrl: imgUrl,
            boardWidth: initialBoardWidth,
            boardHeight: initialBoardHeight,
            grid,
            pieceWidth: pieceSize.w,
            pieceHeight: pieceSize.h,
            pad: 18,
            scatterPadding: 16,
            snapTolerancePx: 18,
            scatterStartYRatio: 0.3,
            rotationStepDeg: 90,
          },
          {
            onPuzzleComplete: (s2) => console.log("[Phuzzle] puzzle complete", s2),
            onPiecePlaced: (p) => console.log("[Phuzzle] piece placed", p.id),
          },
        );

        setState(managerRef.current.getState());
        ensureRaf();
      })
      .catch((err) => {
        console.error("[Phuzzle] Failed to load image", err);
      });
  }, [grid, imgUrl, pieceSize.w, pieceSize.h]);

  // Setup canvas context + DPR sizing via ResizeObserver
  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    if (!board || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const ro = new ResizeObserver(() => {
      const b = boardRef.current;
      const c = canvasRef.current;
      const context = ctxRef.current;
      if (!b || !c || !context) return;

      const rect = b.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // IMPORTANT:
      // canvas.width/height must be in device pixels
      c.width = Math.max(1, Math.floor(rect.width * dpr));
      c.height = Math.max(1, Math.floor(rect.height * dpr));

      // Then map drawing units to CSS pixels
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      console.info("[Phuzzle] Canvas resize", {
        cssW: Math.round(rect.width),
        cssH: Math.round(rect.height),
        dpr,
        backW: c.width,
        backH: c.height,
      });

      // Update manager board size (CSS pixels)
      const mgr = managerRef.current;
      if (mgr) {
        mgr.setBoardSize(rect.width, rect.height);
        setState(mgr.getState());
      }

      ensureRaf();
    });

    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  // Pointer events on canvas (hit test + forward to manager)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    function boardCoords(e: PointerEvent) {
      const board = boardRef.current;
      if (!board) return null;
      const rect = board.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
    }

    function onPointerDown(e: PointerEvent) {
      const mgr = managerRef.current;
      const ctx = ctxRef.current;
      const canvasEl = canvasRef.current;
      if (!mgr || !ctx || !canvasEl) return;

      const bc = boardCoords(e);
      if (!bc) return;

      // Right click rotates
      if (e.button === 2) {
        e.preventDefault();
        const id = pickPieceId(ctx, mgr.getState().pieces, bc.x, bc.y);
        if (id) {
          mgr.rotatePiece(id);
          setState(mgr.getState());
          ensureRaf();
        }
        return;
      }

      if (e.button !== 0) return;

      e.preventDefault();
      canvasEl.setPointerCapture(e.pointerId);

      const id = pickPieceId(ctx, mgr.getState().pieces, bc.x, bc.y);
      if (!id) return;

      const p = mgr.getState().pieces.find((pp) => pp.id === id) as Piece | undefined;
      if (!p) return;

      // Synthesize DOMRect for manager.pointerDown (expects screen coords)
      const pieceRect = new DOMRect(bc.rect.left + p.x, bc.rect.top + p.y, p.w, p.h);

      mgr.pointerDown(id, e.clientX, e.clientY, pieceRect);
      setState(mgr.getState());
      ensureRaf();
    }

    function onPointerMove(e: PointerEvent) {
      const mgr = managerRef.current;
      const board = boardRef.current;
      if (!mgr || !board) return;

      const rect = board.getBoundingClientRect();
      mgr.pointerMove(e.clientX, e.clientY, rect);

      // During drag we can avoid setState spam, but keeping it is fine for now.
      setState(mgr.getState());
      ensureRaf();
    }

    function onPointerUp(e: PointerEvent) {
      const mgr = managerRef.current;
      const canvasEl = canvasRef.current;
      if (!mgr || !canvasEl) return;

      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      mgr.pointerUp();
      setState(mgr.getState());
      ensureRaf();
    }

    function onDblClick(e: MouseEvent) {
      const mgr = managerRef.current;
      const ctx = ctxRef.current;
      const board = boardRef.current;
      if (!mgr || !ctx || !board) return;

      const rect = board.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = pickPieceId(ctx, mgr.getState().pieces, x, y);
      if (id) {
        mgr.rotatePiece(id);
        setState(mgr.getState());
        ensureRaf();
      }
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("dblclick", onDblClick);
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("dblclick", onDblClick);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [assembledW, assembledH]);

  // No image selected
  if (!imgUrl) {
    return (
      <div className={styles.page}>
        <header className={styles.topBar}>
          <button className={styles.iconBtn} onClick={() => nav("/")}>
            Back
          </button>
          <div className={styles.title}>Phuzzle</div>
          <div />
        </header>

        <main className={styles.main}>
          <section className={styles.board}>
            No image selected. Go back and upload one.
          </section>
        </main>
      </div>
    );
  }

  // Still booting
  if (!state) {
    return (
      <div className={styles.page}>
        <header className={styles.topBar}>
          <button className={styles.iconBtn} onClick={() => nav("/")}>
            Back
          </button>
          <div className={styles.title}>Phuzzle</div>
          <div />
        </header>

        <main className={styles.main}>
          <section className={styles.board}>Loading…</section>
          <section className={styles.tray}>Piece tray placeholder</section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => nav("/")}>
          Back
        </button>

        <div className={styles.title}>Phuzzle</div>

        <button
          className={styles.iconBtn}
          onClick={() => {
            debugRef.current = !debugRef.current;

            const mgr = managerRef.current;
            console.log("[Phuzzle] Debug toggled", {
              debug: debugRef.current,
              hasManager: !!mgr,
              pieces: mgr?.getState().pieces.length,
              drag: mgr?.getDragState(),
              imgReady: !!imageRef.current && imageRef.current.naturalWidth > 0,
            });

            // Force redraw immediately
            ensureRaf();
          }}
        >
          Debug
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.board} ref={boardRef}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </section>

        <section className={styles.tray}>
          Tip: Double click or right click to rotate. Snaps when position and rotation
          match.
          <div style={{ marginTop: 8, opacity: 0.8 }}>
            Debug prints canvas size in console on resize.
          </div>
        </section>
      </main>
    </div>
  );
}

async function loadImageReliable(img: HTMLImageElement) {
  try {
    await img.decode();
    return;
  } catch {
    // fall back below
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image load failed"));
  });
}
