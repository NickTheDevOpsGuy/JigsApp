// src/app/components/PuzzlePiece/PuzzlePiece.tsx
import styles from "./PuzzlePiece.module.css";
import type { Piece } from "@/puzzle/types";

type Props = {
  piece: Piece;
  imageUrl: string;
  assembledW: number;
  assembledH: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onAnimationEnd: () => void;
};

export function PuzzlePiece({
  piece,
  imageUrl,
  assembledW,
  assembledH,
  onPointerDown,
  onAnimationEnd,
}: Props) {
  const clipId = `clip-${piece.id}`;

  // Where this piece should sample from in the assembled image (tile space)
  // targetStart is (16,16), so remove it to align to (0,0) assembled space.
  const bgX = piece.targetX - 16;
  const bgY = piece.targetY - 16;

  // In the piece local space, the tile starts at (pad, pad)
  // So shift the image by pad, then by the tile offset.
  const imgX = -bgX + piece.pad;
  const imgY = -bgY + piece.pad;

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
      }}
      onPointerDown={onPointerDown}
      onAnimationEnd={onAnimationEnd}
      title={piece.id}
    >
      <svg
        className={styles.svg}
        width={piece.w}
        height={piece.h}
        viewBox={`0 0 ${piece.w} ${piece.h}`}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={piece.shapePath} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <image
            href={imageUrl}
            x={imgX}
            y={imgY}
            width={assembledW}
            height={assembledH}
            preserveAspectRatio="none"
          />
        </g>

        {/* outline */}
        <path d={piece.shapePath} className={styles.outline} />
      </svg>
    </div>
  );
}
