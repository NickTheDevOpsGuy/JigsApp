import styles from "./PuzzlePiece.module.css";
import type { Piece } from "@/puzzle/types";

type Props = {
  piece: Piece;
  imageUrl: string;
  assembledW: number;
  assembledH: number;

  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onAnimationEnd?: () => void;
};

export function PuzzlePiece({
  piece,
  imageUrl,
  assembledW,
  assembledH,
  onPointerDown,
  onDoubleClick,
  onContextMenu,
  onAnimationEnd,
}: Props) {
  const bgX = piece.targetX - 16;
  const bgY = piece.targetY - 16;

  const className = piece.justSnapped ? `${styles.wrap} ${styles.snapped}` : styles.wrap;

  return (
    <div
      className={className}
      style={{
        left: piece.x,
        top: piece.y,
        width: piece.w,
        height: piece.h,
        zIndex: piece.z,
        transform: `rotate(${piece.rotation}deg)`,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onAnimationEnd={onAnimationEnd}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${piece.w} ${piece.h}`}
        width={piece.w}
        height={piece.h}
      >
        <defs>
          <clipPath id={`clip-${piece.id}`}>
            <path d={piece.shapePath} />
          </clipPath>
        </defs>

        <image
          href={imageUrl}
          width={assembledW}
          height={assembledH}
          x={-bgX}
          y={-bgY}
          clipPath={`url(#clip-${piece.id})`}
          preserveAspectRatio="none"
        />

        <path d={piece.shapePath} className={styles.outline} />
      </svg>
    </div>
  );
}
