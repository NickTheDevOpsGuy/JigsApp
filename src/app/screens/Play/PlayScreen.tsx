// src/app/screens/Play/PlayScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PuzzleState } from "@/puzzle/types";

import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { renderBoard, type PopMap, type DebugFlags } from "@/puzzle/canvas/renderBoard";

const STORAGE_KEY = "phuzzle:imageDataUrl";

export function PlayScreen() {
  const nav = useNavigate();
  const imgUrl = localStorage.getItem(STORAGE_KEY);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const managerRef = useRef<PuzzleManager | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [state, setState] = useState<PuzzleState | null>(null);

  // snap pop animation tracking
  const popMapRef = useRef<PopMap>(new Map());

  // RAF loop control
  const rafRef = useRef<number | null>(null);

  // cached 2d context
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Debug toggles (do not put in React state, we do not want rerenders)
  const debugRef = useRef<DebugFlags>({ showGrid: false, showBounds: false, showIds: false });

  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);
  const pieceSize = useMemo(() => ({ w: 72, h: 72 }), []);

  const assembledW = useMemo(() => grid.cols * pieceSize.w, [grid.cols, pieceSize.w]);
  const assembledH = useMemo(() => grid.rows * pieceSize.h, [grid.rows, pieceSize.h]);

  function logMetrics(tag: string) {
    const c = canvasRef.current;
    const b = boardRef.current;
    const img = imageRef.current;

    if (!c || !b) return;

    const rect = b.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    console.info(`[Phuzzle] ${tag}`, {
      backingW: c.width,
      backingH: c.height,
      cssW: Math.round(rect.width),
      cssH: Math.round(rect.height),
      dpr,
      img: img
        ? { naturalW: img.naturalWidth, naturalH: img.naturalHeight }
        : { naturalW: 0, naturalH: 0 },
      debug: debugRef.current,
    });
  }

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

      // Seed pop animations on justSnapped
      for (const p of s.pieces) {
        if (p.justSnapped && !popMapRef.current.has(p.id)) {
          popMapRef.current.set(p.id, now);
        }
      }

      // Cleanup finished pop animations
      const popMap = popMapRef.current;
      let anyAnimating = false;

      for (const [id, start] of popMap) {
        const t = now - start;
        if (t < 170) {
          anyAnimating = true;
        } else {
          popMap.delete(id);
          mgr.clearJustSnapped(id);
        }
      }

      // Draw
      renderBoard(ctx, s, img, assembledW, assembledH, popMapRef.current, now, debugRef.current);

      // Continue drawing if dragging or animating
      const dragActive = mgr.getDragState().activeId != null;
      if (dragActive || anyAnimating) {
        ensureRaf();
      } else {
        setState(mgr.getState());
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }

  // Initialize image + manager once
  useEffect(() => {
    if (!imgUrl) return;
    if (managerRef.current) return;

    const looksLikeDataUrl = imgUrl.startsWith("data:image/");
    console.info("[Phuzzle] PlayScreen storage check", {
      hasImgUrl: !!imgUrl,
      prefix: imgUrl.slice(0, 30),
      length: imgUrl.length,
      looksLikeDataUrl,
    });

    const img = new Image();
    img.src = imgUrl;

    loadImageReliable(img)
      .then(() => {
        imageRef.current = img;

        console.info("[Phuzzle] Image loaded", {
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        });

        // placeholder sizes until ResizeObserver runs
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
            onPuzzleComplete: (s) => console.log("[Phuzzle] puzzle complete", s),
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

  // Setup canvas context + DPR resize
  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    if (!board || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const b = boardRef.current;
      const c = canvasRef.current;
      const context = ctxRef.current;
      if (!b || !c || !context) return;

      const rect = b.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Backing store in device pixels
      const nextW = Math.max(1, Math.floor(rect.width * dpr));
      const nextH = Math.max(1, Math.floor(rect.height * dpr));

      // Only set if changed (avoids nuking context state constantly)
      if (c.width !== nextW) c.width = nextW;
      if (c.height !== nextH) c.height = nextH;

      // Map drawing to CSS pixels
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mgr = managerRef.current;
      if (mgr) {
        mgr.setBoardSize(rect.width, rect.height);
        setState(mgr.getState());
      }

      if (debugRef.current.showGrid || debugRef.current.showBounds || debugRef.current.showIds) {
        logMetrics("Canvas resized");
      }

      ensureRaf();
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(board);

    // Important: force initial sizing even if ResizeObserver has not fired yet
    resize();

    return () => ro.disconnect();
  }, []);

  // Pointer events on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return;

    function boardCoords(e: PointerEvent) {
      const b = boardRef.current;
      if (!b) return null;
      const rect = b.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
    }

    function onPointerDown(e: PointerEvent) {
      const mgr = managerRef.current;
      const ctx = ctxRef.current;
      const b = boardRef.current;
      const c = canvasRef.current;
      if (!mgr || !ctx || !b || !c) return;

      const bc = boardCoords(e);
      if (!bc) return;

      // Right click rotate
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
      c.setPointerCapture(e.pointerId);

      const id = pickPieceId(ctx, mgr.getState().pieces, bc.x, bc.y);
      if (!id) return;

      const p = mgr.getState().pieces.find((pp) => pp.id === id) as Piece | undefined;
      if (!p) return;

      const pieceRect = new DOMRect(bc.rect.left + p.x, bc.rect.top + p.y, p.w, p.h);

      mgr.pointerDown(id, e.clientX, e.clientY, pieceRect);
      setState(mgr.getState());
      ensureRaf();
    }

    function onPointerMove(e: PointerEvent) {
      const mgr = managerRef.current;
      const b = boardRef.current;
      if (!mgr || !b) return;

      const rect = b.getBoundingClientRect();
      mgr.pointerMove(e.clientX, e.clientY, rect);
      setState(mgr.getState());
      ensureRaf();
    }

    function onPointerUp(e: PointerEvent) {
      const mgr = managerRef.current;
      const c = canvasRef.current;
      if (!mgr || !c) return;

      try {
        c.releasePointerCapture(e.pointerId);
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
      const b = boardRef.current;
      if (!mgr || !ctx || !b) return;

      const rect = b.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = pickPieceId(ctx, mgr.getState().pieces, x, y);
      if (id) {
        mgr.rotatePiece(id);
        setState(mgr.getState());
        ensureRaf();
      }
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
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
          <section className={styles.board}>No image selected. Go back and upload one.</section>
        </main>
      </div>
    );
  }

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
          <section className={styles.board} ref={boardRef}>
            <canvas ref={canvasRef} className={styles.canvas} />
          </section>
          <section className={styles.tray}>Loading…</section>
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
            // Toggle showGrid only (you can expand later)
            debugRef.current = {
              ...debugRef.current,
              showGrid: !debugRef.current.showGrid,
            };

            console.info("[Phuzzle] Debug toggled", debugRef.current);

            const mgr = managerRef.current;
            if (mgr) {
              console.info("[Phuzzle] Debug state", {
                placed: mgr.getState().placedCount,
                total: mgr.getState().totalCount,
                drag: mgr.getDragState(),
              });
            }

            logMetrics("Debug metrics");
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
          Double click or right click to rotate. Snaps when position and rotation match.
          <br />
          Debug prints canvas size in console and can show a grid.
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
    // fall back
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image load failed"));
  });
}