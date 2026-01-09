import { useRef, useState } from 'react';
import styles from './PuzzlePiece.module.css';

type Props = {
  id: number;
  startX: number;
  startY: number;
};

export function PuzzlePiece({ id, startX, startY }: Props) {
  const [pos, setPos] = useState({ x: startX, y: startY });
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragOffset.current) return;

    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  }

  function onPointerUp() {
    dragOffset.current = null;
  }

  return (
    <div
      className={styles.piece}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {id}
    </div>
  );
}