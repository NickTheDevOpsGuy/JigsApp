// src/app/screens/Play/PlayScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { Piece, PuzzleState } from "@/puzzle/types";

import { pickPieceId } from "@/puzzle/canvas/pickPiece";
import { renderBoard, type PopMap, type DebugFlags } from "@/puzzle/canvas/renderBoard";

const STORAGE_KEY = "phuzzle:imageDataUrl";

type Hud = {
  startedAtMs: number | null;
  elapsedMs: number;
};

function formatClock(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/**
 * PlayScreen (Canvas)
 *
 * - Canvas renders everything
 * - PuzzleManager is the single source of truth for:
 *   - snapping rules (position + rotation)
 *   - game completion state
 *   - placed count
 */
export function PlayScreen() {
  const nav = useNavigate();
  const imgUrl = localStorage.getItem(STORAGE_KEY);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const managerRef = useRef<PuzzleManager | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [state, setState] = useState<PuzzleState | null>(null);

  // snap pop animation tracking: pieceId -> startTime
  const popMapRef = useRef<PopMap>(new Map());

  // raf loop control
  const rafRef = useRef<number | null>(null);

  // HUD timer
  const hudRef = useRef<Hud>({ startedAtMs: null, elapsedMs: 0 });
  const [hudTick, setHudTick] = useState(0);

  // Debug toggles (ref to avoid rerender spam)
  const debugRef = useRef<DebugFlags>({
    showGrid: false,
    showBounds: false,
    showIds: false,
  });

  // Game config
  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);
  const pieceSize = useMemo(() => ({ w: 72, h: 72 }), []);

  const assembledW = useMemo(() => grid.cols * pieceSize.w, [grid.cols, pieceSize.w]);
  const assembledH = useMemo(() => grid.rows * pieceSize.h, [grid.rows, pieceSize.h]);

  function logMetrics(tag: string) {
    const c = canvasRef.current;
    const b = boardRef.current;
    const img = imageRef.current;
    const mgr = managerRef.current;

    if (!c || !b) return;

    const rect = b.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    console.info(`[Phuzzle] ${tag}`, {
      boardCss: { w: Math.round(rect.width), h: Math.round(rect.height) },
      canvasBacking: { w: c.width, h: c.height },
      dpr,
      img: img ? { naturalW: img.naturalWidth, naturalH: img.naturalHeight } : null,
      debug: debugRef.current,
      state: mgr
        ? {
            placed: mgr.getState().placedCount,
            total: mgr.getState().totalCount,
            drag: mgr.getDragState(),
            complete: mgr.getState().isComplete,
          }
        : null,
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

      // Start timer on first frame once the manager exists
      if (hudRef.current.startedAtMs == null) {
        hudRef.current.startedAtMs = now;
      }

      // Seed pop animation starts
      for (const p of s.pieces) {
        if (p.justSnapped && !popMapRef.current.has(p.id)) {
          popMapRef.current.set(p.id, now);
        }
      }

      // Cleanup finished pop animations + clear justSnapped
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

      // Update elapsed time (freeze when complete)
      if (!s.isComplete && hudRef.current.startedAtMs != null) {
        hudRef.current.elapsedMs = now - hudRef.current.startedAtMs;
      }

      // Draw
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

      // Keep running while dragging or animating; otherwise stop
      const dragActive = mgr.getDragState().activeId != null;
      if (dragActive || anyAnimating) {
        ensureRaf();
      } else {
        setState(mgr.getState());
        setHudTick((t) => t + 1);
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }

  // Initialize image + manager ONCE
  useEffect(() => {
    if (!imgUrl) return;
    if (managerRef.current) return;

    const img = new Image();
    img.src = imgUrl;

    loadImageReliable(img)
      .then(() => {
        imageRef.current = img;

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
            snapTolerancePx: 28, // less pixel-perfect
            scatterStartYRatio: 0.3,
            rotationStepDeg: 90,
          },
          {
            onPuzzleComplete: (s: PuzzleState) => {
              console.log("[Phuzzle] puzzle complete", s);
              setHudTick((t) => t + 1);
            },
            onPiecePlaced: (p: Piece) => console.log("[Phuzzle] piece placed", p.id),
          },
        );

        setState(managerRef.current.getState());
        ensureRaf();
      })
      .catch((err) => console.error("[Phuzzle] Failed to load image", err));
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

      const nextW = Math.max(1, Math.floor(rect.width * dpr));
      const nextH = Math.max(1, Math.floor(rect.height * dpr));

      if (c.width !== nextW) c.width = nextW;
      if (c.height !== nextH) c.height = nextH;

      // Map drawing coords to CSS pixels
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mgr = managerRef.current;
      if (mgr) {
        mgr.setBoardSize(rect.width, rect.height);
        setState(mgr.getState());
      }

      ensureRaf();
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(board);

    // force initial sizing immediately
    resize();

    return () => ro.disconnect();
  }, []);

  // HUD tick every second while game is running
  useEffect(() => {
    const id = window.setInterval(() => {
      const m = managerRef.current;
      if (!m) return;
      if (m.getState().isComplete) return;
      setHudTick((t) => t + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  // Pointer events on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function boardCoords(e: PointerEvent) {
      const board = boardRef.current;
      if (!board) return null;
      const rect = board.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
    }

    function onPointerDown(e: PointerEvent) {
      const mgr = managerRef.current;
      const ctx = ctxRef.current;
      const c = canvasRef.current;
      if (!mgr || !ctx || !c) return;

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

      // Only left begins drag
      if (e.button !== 0) return;

      e.preventDefault();
      c.setPointerCapture(e.pointerId);

      const id = pickPieceId(ctx, mgr.getState().pieces, bc.x, bc.y);
      if (!id) return;

      const p = mgr.getState().pieces.find((pp: Piece) => pp.id === id);
      if (!p) return;

      // Synthesize screen-space DOMRect
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

  const placed = state?.placedCount ?? 0;
  const total = state?.totalCount ?? 0;
  const left = Math.max(0, total - placed);
  const timeLabel = formatClock(hudRef.current.elapsedMs);

  // Booting
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

        <div className={styles.title}>
          Phuzzle{" "}
          <span style={{ fontWeight: 500, opacity: 0.8 }}>
            | ⏱️ {timeLabel} | 🧩 {left} left{" "}
            {state.isComplete ? "| ✅ Complete" : "| 🎯 In progress"}
          </span>
        </div>

        <button
          className={styles.iconBtn}
          onClick={() => {
            debugRef.current = {
              ...debugRef.current,
              showGrid: !debugRef.current.showGrid,
            };

            console.info("[Phuzzle] Debug toggled", debugRef.current);
            logMetrics("Debug click");
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
          <div>
            <strong>Controls</strong>
          </div>
          <div>🖱️ Drag pieces to move</div>
          <div>🖱️ Double click or right click to rotate</div>
          <div>🧲 Snaps when position + rotation match</div>
          <hr />
          <div>
            <strong>Debug</strong>
          </div>
          <div>Toggles grid overlay</div>
          <div>Logs canvas + board metrics</div>
          <div style={{ opacity: 0.7 }}>hudTick: {hudTick}</div>
        </section>
      </main>
    </div>
  );
}

// Also export default so imports never get stuck on named vs default.
export default PlayScreen;

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
