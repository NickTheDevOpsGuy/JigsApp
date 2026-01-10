import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PlayScreen.module.css';

const STORAGE_KEY = 'phuzzle:imageUrl';

const PIECE_W = 80;
const PIECE_H = 80;
const PIECE_COUNT = 20;

type Piece = {
  id: string;
  x: number;
  y: number;
  z: number;
};

function makeInitialPieces(): Piece[] {
  // Start them clustered near the top-left for now (we'll randomize later in #10)
  return Array.from({ length: PIECE_COUNT }).map((_, i) => ({
    id: `p${i + 1}`,
    x: 20 + (i % 5) * (PIECE_W + 10),
    y: 20 + Math.floor(i / 5) * (PIECE_H + 10),
    z: 1,
  }));
}

export function PlayScreen() {
  const nav = useNavigate();
  const imgUrl = sessionStorage.getItem(STORAGE_KEY);

  const [pieces, setPieces] = useState<Piece[]>(() => makeInitialPieces());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zCounter, setZCounter] = useState(10);

  const activePiece = useMemo(
    () => pieces.find((p) => p.id === activeId) ?? null,
    [pieces, activeId]
  );

  useEffect(() => {
    if (imgUrl) {
      console.info('[Phuzzle] PlayScreen loaded image from sessionStorage', {
        storageKey: STORAGE_KEY,
      });
    } else {
      console.info('[Phuzzle] PlayScreen: no image found in sessionStorage', {
        storageKey: STORAGE_KEY,
      });
    }
  }, [imgUrl]);

  function onPieceDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    setActiveId(id);

    // Record where inside the piece we clicked so it doesn't "jump"
    const rect = e.currentTarget.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Bring the piece to the top by bumping its z-index
    setZCounter((z) => {
      const nextZ = z + 1;
      setPieces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, z: nextZ } : p))
      );
      return nextZ;
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPieceMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeId) return;

    const board = e.currentTarget.parentElement;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();

    const rawX = e.clientX - boardRect.left - offset.x;
    const rawY = e.clientY - boardRect.top - offset.y;

    const maxX = boardRect.width - PIECE_W;
    const maxY = boardRect.height - PIECE_H;

    const nextX = Math.max(0, Math.min(rawX, maxX));
    const nextY = Math.max(0, Math.min(rawY, maxY));

    setPieces((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, x: nextX, y: nextY } : p))
    );
  }

  function onPieceUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeId) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const dropped = pieces.find((p) => p.id === activeId);
    console.info('[Phuzzle] Piece dropped', dropped ?? { id: activeId });

    setActiveId(null);
  }

  if (!imgUrl) {
    return (
      <div className={styles.page}>
        <header className={styles.topBar}>
          <button className={styles.iconBtn} onClick={() => nav('/')}>
            Back
          </button>
          <div className={styles.title}>Phuzzle</div>
          <div />
        </header>

        <main className={styles.main}>
          <section className={styles.board}>No image selected.</section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => nav('/')}>
          Back
        </button>
        <div className={styles.title}>Phuzzle</div>
        <button className={styles.iconBtn} onClick={() => alert('Settings later')}>
          Settings
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.board}>
          <img className={styles.boardImg} src={imgUrl} alt="Puzzle source" />

          {/* 20 draggable pieces */}
          {pieces.map((p) => (
            <div
              key={p.id}
              className={styles.piece}
              style={{
                left: p.x,
                top: p.y,
                width: PIECE_W,
                height: PIECE_H,
                zIndex: p.z,
                outline:
                  p.id === activeId ? '3px solid rgba(126, 201, 255, 0.9)' : 'none',
              }}
              onPointerDown={(e) => onPieceDown(e, p.id)}
              onPointerMove={onPieceMove}
              onPointerUp={onPieceUp}
              aria-label={`Puzzle piece ${p.id}`}
            >
              <span className={styles.pieceId}>{p.id}</span>
            </div>
          ))}

          {/* Optional: quick debug panel */}
          <div className={styles.debug}>
            <div>
              Active: <b>{activePiece?.id ?? 'none'}</b>
            </div>
          </div>
        </section>

        <section className={styles.tray}>Piece tray placeholder</section>
      </main>
    </div>
  );
}