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

  const popMapRef = useRef<PopMap>(new Map());
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const lastBoardSizeRef = useRef<{ w: number; h: number } | null>(null);

  const debugRef = useRef<DebugFlags>({
    showGrid: false,
    showBounds: false,
    showIds: false,
  });

  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);
  const pieceSize = useMemo(() => ({ w: 100, h: 100 }), []);

  const assembledW = useMemo(() => grid.cols * pieceSize.w, [grid.cols, pieceSize.w]);
  const assembledH = useMemo(() => grid.rows * pieceSize.h, [grid.rows, pieceSize.h]);

  function logState(tag: string) {
    const mgr = managerRef.current;
    if (!mgr) return;
    const s = mgr.getState();
    const drag = mgr.getDragState();
    console.log(`[Phuzzle][${tag}]`, {
      pieces: s.pieces.length,
      placed: s.placedCount,
      complete: s.isComplete,
      dragActiveId: drag.activeId,
      board: lastBoardSizeRef.current,
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

      for (const p of s.pieces) {
        if (p.justSnapped && !popMapRef.current.has(p.id)) {
          popMapRef.current.set(p.id, now);
        }
      }

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

      renderBoard(
        ctx,
        s,
        img,
        assembledW,
        assembledH,
        popMapRef.current,
        now,
        debugRef.current,
      );

      const dragActive = mgr.getDragState().activeId != null;
      if (dragActive || anyAnimating) {
        ensureRaf();
      } else {
        setState(mgr.getState());
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (!imgUrl) return;
    if (managerRef.current) return;

    const img = new Image();
    img.src = imgUrl;

    loadImageReliable(img)
      .then(() => {
        imageRef.current = img;

        managerRef.current = new PuzzleManager(
          {
            imageUrl: imgUrl,
            boardWidth: 900,
            boardHeight: 520,
            grid,
            pieceWidth: pieceSize.w,
            pieceHeight: pieceSize.h,
            pad: 18,
            scatterPadding: 16,
            snapTolerancePx: 35,
            scatterStartYRatio: 0.3,
            rotationStepDeg: 90,
          },
          {
            onPuzzleComplete: (s) => console.log("[Phuzzle] puzzle complete", s),
            onPiecePlaced: (p) => console.log("[Phuzzle] piece placed", p.id),
          },
        );

        setState(managerRef.current.getState());
        logState("init");
        ensureRaf();
      })
      .catch((err) => {
        console.error("[Phuzzle] Failed to load image", err);
      });
  }, [grid, imgUrl, pieceSize.w, pieceSize.h]);

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
      const mgr = managerRef.current;
      if (!b || !c || !context) return;

      const rect = b.getBoundingClientRect();
      const next = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };

      const prev = lastBoardSizeRef.current;
      const changed =
        !prev || Math.abs(prev.w - next.w) > 0.5 || Math.abs(prev.h - next.h) > 0.5;
      if (!changed) return;

      lastBoardSizeRef.current = next;

      const dpr = window.devicePixelRatio || 1;
      c.width = Math.max(1, Math.floor(next.w * dpr));
      c.height = Math.max(1, Math.floor(next.h * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Avoid jitter: do not clamp pieces while actively dragging
      if (mgr && mgr.getDragState().activeId == null) {
        mgr.setBoardSize(next.w, next.h);
        setState(mgr.getState());
      }

      ensureRaf();

      if (debugRef.current.showBounds) {
        console.log("[Phuzzle][resize]", {
          css: next,
          backing: { w: c.width, h: c.height },
          dpr,
        });
      }
    });

    ro.observe(board);
    return () => ro.disconnect();
  }, []);

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
          <section className={styles.board}>
            No image selected. Go back and upload one.
          </section>
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
          <section className={styles.board}>Loading…</section>
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
            debugRef.current = {
              showGrid: !debugRef.current.showGrid,
              showBounds: !debugRef.current.showBounds,
              showIds: !debugRef.current.showIds,
            };
            logState("debug-toggle");
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
          <div>Double click or right click to rotate.</div>
          <div>Snaps when position and rotation match.</div>
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
    // fall through
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image load failed"));
  });
}
