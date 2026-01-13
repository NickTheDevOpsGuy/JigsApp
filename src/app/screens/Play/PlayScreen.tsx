// src/app/screens/Play/PlayScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PieceId, PuzzleState } from "@/puzzle/types";

const STORAGE_KEY = "phuzzle:imageDataUrl";

export function PlayScreen() {
  const nav = useNavigate();

  const imgUrl = localStorage.getItem(STORAGE_KEY);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const managerRef = useRef<PuzzleManager | null>(null);

  const [state, setState] = useState<PuzzleState | null>(null);

  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);
  const pieceSize = useMemo(() => ({ w: 72, h: 72 }), []);

  const dragActiveIdRef = useRef<PieceId | null>(null);

  // Initialize manager once (only if we have an image)
  useEffect(() => {
    if (!imgUrl) return;
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
        scatterStartYRatio: 0.3,
        rotationStepDeg: 90,
      },
      {
        onPuzzleComplete: (s) => console.log("[Phuzzle] puzzle complete", s),
        onPiecePlaced: (p) => console.log("[Phuzzle] piece placed", p.id),
      },
    );

    setState(managerRef.current.getState());
  }, [grid, imgUrl, pieceSize.w, pieceSize.h]);

  // Measure board and set board size on manager
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

  // Global pointer listeners (no window any, always installed once)
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const mgr = managerRef.current;
      const board = boardRef.current;
      if (!mgr || !board) return;

      if (!dragActiveIdRef.current) return;

      mgr.pointerMove(e.clientX, e.clientY, board.getBoundingClientRect());
      setState(mgr.getState());
    }

    function onUp() {
      const mgr = managerRef.current;
      if (!mgr) return;

      if (!dragActiveIdRef.current) return;

      mgr.pointerUp();
      dragActiveIdRef.current = null;
      setState(mgr.getState());
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // No image
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
          <section className={styles.tray}>Piece tray placeholder</section>
        </main>
      </div>
    );
  }

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
            // Assumes targets start at (16,16) in PuzzleManager.
            const bgX = piece.targetX - 16;
            const bgY = piece.targetY - 16;

            const innerClassName = piece.justSnapped
              ? `${styles.piece} ${styles.snapped}`
              : styles.piece;

            return (
              <div
                key={piece.id}
                className={styles.pieceWrap}
                style={{
                  left: piece.x,
                  top: piece.y,
                  width: piece.w,
                  height: piece.h,
                  zIndex: piece.z,
                  transform: `rotate(${piece.rotation}deg)`,
                }}
                onPointerDown={(e) => {
                  const mgr = managerRef.current;
                  if (!mgr) return;

                  const rect = (
                    e.currentTarget as HTMLDivElement
                  ).getBoundingClientRect();
                  mgr.pointerDown(piece.id, e.clientX, e.clientY, rect);
                  dragActiveIdRef.current = piece.id;
                  setState(mgr.getState());
                }}
                onDoubleClick={() => {
                  const mgr = managerRef.current;
                  if (!mgr) return;
                  mgr.rotatePiece(piece.id);
                  setState(mgr.getState());
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const mgr = managerRef.current;
                  if (!mgr) return;
                  mgr.rotatePiece(piece.id);
                  setState(mgr.getState());
                }}
                onAnimationEnd={() => {
                  const mgr = managerRef.current;
                  if (!mgr) return;
                  mgr.clearJustSnapped(piece.id);
                  setState(mgr.getState());
                }}
                title={`${piece.id} rot=${piece.rotation}`}
              >
                <div
                  className={innerClassName}
                  style={{
                    backgroundImage: `url(${imgUrl})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${assembledW}px ${assembledH}px`,
                    backgroundPosition: `-${bgX}px -${bgY}px`,
                  }}
                />
              </div>
            );
          })}
        </section>

        <section className={styles.tray}>
          Tip: Double click or right click a piece to rotate. Snaps only when position and
          rotation match.
        </section>
      </main>
    </div>
  );
}
