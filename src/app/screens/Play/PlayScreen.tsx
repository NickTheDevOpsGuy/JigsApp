import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PlayScreen.module.css";

import { PuzzleManager } from "@/puzzle/PuzzleManager";
import type { PuzzleState } from "@/puzzle/types";

const STORAGE_KEY = "phuzzle:imageDataUrl";

export function PlayScreen() {
  const nav = useNavigate();

  const imgUrl = localStorage.getItem(STORAGE_KEY);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const managerRef = useRef<PuzzleManager | null>(null);

  const [state, setState] = useState<PuzzleState | null>(null);

  const grid = useMemo(() => ({ rows: 4, cols: 5 }), []);
  const pieceSize = useMemo(() => ({ w: 72, h: 72 }), []);

  // If there's no image, show a friendly message.
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

  // Initialize manager once
  useEffect(() => {
    if (managerRef.current) return;

    // Temporary board size until we measure real DOM size
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
        onPuzzleComplete: (s) => {
          console.log("[Phuzzle] puzzle complete", s);
        },
        onPiecePlaced: (p) => {
          console.log("[Phuzzle] piece placed", p.id);
        },
      }
    );

    const s = managerRef.current.getState();
    setState(s);

    console.log("[Phuzzle] PuzzleManager init");
    console.log("[Phuzzle] total pieces:", s.totalCount);
    console.log("[Phuzzle] placed:", s.placedCount);
    console.log("[Phuzzle] grid:", s.grid);
  }, [grid, imgUrl, pieceSize.h, pieceSize.w]);

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

  // Global pointer move/up while dragging
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const mgr = managerRef.current;
      const board = boardRef.current;
      if (!mgr || !board) return;

      const boardRect = board.getBoundingClientRect();
      mgr.pointerMove(e.clientX, e.clientY, boardRect);
      setState(mgr.getState());
    }

    function onUp() {
      const mgr = managerRef.current;
      if (!mgr) return;

      mgr.pointerUp();
      setState(mgr.getState());

      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    // attached from pointerDown handler
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
        <section
          className={styles.board}
          ref={boardRef}
          style={{
            backgroundImage: `url(${imgUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Render pieces from PuzzleManager state */}
          {state.pieces.map((p) => (
            <div
              key={p.id}
              className={styles.piece}
              style={{
                left: p.x,
                top: p.y,
                width: p.w,
                height: p.h,
                zIndex: p.z,
              }}
              onPointerDown={(e) => {
                const mgr = managerRef.current;
                const board = boardRef.current;
                if (!mgr || !board) return;

                const pieceRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();

                mgr.pointerDown(p.id, e.clientX, e.clientY, pieceRect);
                setState(mgr.getState());

                const attach = (window as any).__phuzzleAttachDragListeners as undefined | (() => void);
                attach?.();
              }}
              title={p.id}
            />
          ))}
        </section>

        <section className={styles.tray}>Piece tray placeholder</section>
      </main>
    </div>
  );
}