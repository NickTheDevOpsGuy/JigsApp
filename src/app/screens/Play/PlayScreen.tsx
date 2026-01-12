// src/app/screens/Play/PlayScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";

const STORAGE_KEY = "phuzzle:imageDataUrl";

// IMPORTANT: must match PuzzleManager's targetStartX/targetStartY
const TARGET_ORIGIN_X = 16;
const TARGET_ORIGIN_Y = 16;

export function PlayScreen() {
  const nav = useNavigate();

  const imgUrl = localStorage.getItem(STORAGE_KEY);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const managerRef = useRef<PuzzleManager | null>(null);

  const [state, setState] = useState<PuzzleState | null>(null);

  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);
  const pieceSize = useMemo(() => ({ w: 72, h: 72 }), []);

  // No image, no play
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

  // Initialize manager once
  useEffect(() => {
    if (managerRef.current) return;

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
        scatterPadding: 16,
        snapTolerancePx: 18,
      },
      {
        onPuzzleComplete: (s) => console.log("[Phuzzle] puzzle complete", s),
        onPiecePlaced: (p) => console.log("[Phuzzle] piece placed", p.id),
      }
    );

    setState(managerRef.current.getState());
  }, [grid, imgUrl, pieceSize.w, pieceSize.h]);

  // Keep manager in sync with actual board DOM size
  useEffect(() => {
    const board = boardRef.current;
    const mgr = managerRef.current;
    if (!board || !mgr) return;

    const ro = new ResizeObserver(() => {
      const rect = board.getBoundingClientRect();
      mgr.setBoardSize(rect.width, rect.height);
      setState(mgr.getState());
    });

    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  // Global pointer move/up while dragging
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const mgr = managerRef.current;
      const board = boardRef.current;
      if (!mgr || !board) return;

      mgr.pointerMove(e.clientX, e.clientY, board.getBoundingClientRect());
      setState(mgr.getState());
    }

    function onUp() {
      const mgr = managerRef.current;
      if (!mgr) return;

      // Later, when you want snapping on drop:
      // mgr.trySnapActivePiece();
      mgr.pointerUp();
      setState(mgr.getState());

      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    (window as any).__phuzzleAttachDragListeners = () => {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      delete (window as any).__phuzzleAttachDragListeners;
    };
  }, []);

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

  // Size of the assembled "full" image that every tile samples from
  const assembledW = state.grid.cols * pieceSize.w;
  const assembledH = state.grid.rows * pieceSize.h;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => nav("/")}>
          Back
        </button>

        <div className={styles.title}>Phuzzle</div>

        <button
          className={styles.iconBtn}
          onClick={() => console.log("[Phuzzle] state", managerRef.current?.getState())}
        >
          Debug
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.board} ref={boardRef}>
          {state.pieces.map((piece) => {
            // Which tile is this in the assembled grid?
            const col = (piece.targetX - TARGET_ORIGIN_X) / piece.w;
            const row = (piece.targetY - TARGET_ORIGIN_Y) / piece.h;

            // Pixel offsets for backgroundPosition
            const bgX = Math.round(col * piece.w);
            const bgY = Math.round(row * piece.h);

            return (
              <div
                key={piece.id}
                className={styles.piece}
                style={{
                  left: piece.x,
                  top: piece.y,
                  width: piece.w,
                  height: piece.h,
                  zIndex: piece.z,

                  backgroundImage: `url(${imgUrl})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${assembledW}px ${assembledH}px`,
                  backgroundPosition: `-${bgX}px -${bgY}px`,
                }}
                onPointerDown={(e) => {
                  const mgr = managerRef.current;
                  if (!mgr) return;

                  const pieceRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  mgr.pointerDown(piece.id, e.clientX, e.clientY, pieceRect);
                  setState(mgr.getState());

                  const attach = (window as any).__phuzzleAttachDragListeners as
                    | undefined
                    | (() => void);
                  attach?.();
                }}
                title={piece.id}
              />
            );
          })}
        </section>

        <section className={styles.tray}>Piece tray placeholder</section>
      </main>
    </div>
  );
}