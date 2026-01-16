import type React from "react";
import styles from "./PuzzlePiece.module.css";
import type { Piece } from "@/puzzle/types";

type Props = {
  piece: Piece;
  imageUrl: string;
  assembledW: number;
  assembledH: number;

  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onAnimationEnd: () => void;
  onRotate?: () => void;
};

export function PuzzlePiece({
  piece,
  imageUrl,
  assembledW,
  assembledH,
  onPointerDown,
  onAnimationEnd,
  onRotate,
}: Props) {
  const clipId = `clip-${piece.id}`;

  /**
   * IMAGE SLICING (pad-aware)
   *
   * - assembled image origin is (0,0)
   * - this piece's correct TILE top-left in assembled space is (targetX,targetY)
   * - the piece container includes `pad` on each side, and the tile starts at (pad,pad)
   *
   * So to place the correct assembled tile under the clip path:
   *   imageX = -targetX + pad
   *   imageY = -targetY + pad
   */
  const imgX = -piece.targetX + piece.pad;
  const imgY = -piece.targetY + piece.pad;

  /**
   * CSS behavior:
   * - rotate stays on .wrap via inline transform
   * - snap animation scales .inner so it does not override rotation
   */
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
      onAnimationEnd={onAnimationEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        onRotate?.();
      }}
      onDoubleClick={() => onRotate?.()}
      title={piece.id}
    >
      <div className={styles.inner}>
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

          <path d={piece.shapePath} className={styles.outline} />
        </svg>
      </div>
    </div>
  );
}
