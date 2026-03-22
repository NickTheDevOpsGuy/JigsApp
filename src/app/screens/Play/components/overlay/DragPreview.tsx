/**
 * DragPreview – floating piece preview when dragging to tray (DOM overlay).
 */
import { useMemo } from "react";
import { renderTrayPiece } from "@/puzzle/canvas/render/renderTrayPiece";
import type { Piece } from "@/puzzle/core/types";
import styles from "@/screens/Play/styles/PlayScreen.module.css";

type Props = {
  clientX: number;
  clientY: number;
  piece: Piece;
  image: HTMLImageElement | null;
  grid: { rows: number; cols: number };
};

/**
 * Floating preview of a piece being dragged to the tray.
 * Renders on top of everything so the piece stays visible when dragged off the canvas.
 */
export function DragPreview({ clientX, clientY, piece, image, grid }: Props) {
  const dataUrl = useMemo(() => {
    if (!image || image.naturalWidth === 0) return null;
    const assembledW = grid.cols * piece.tileW;
    const assembledH = grid.rows * piece.tileH;
    const scale = 0.9;
    const canvas = renderTrayPiece(piece, image, assembledW, assembledH, scale);
    return canvas.toDataURL("image/png");
  }, [piece.id, piece.rotation, image, grid, piece.tileW, piece.tileH]);

  if (!dataUrl) return null;

  const size = Math.ceil(Math.max(piece.w, piece.h) * 0.9);

  return (
    <div
      className={styles.dragPreview}
      style={{
        left: clientX,
        top: clientY,
        width: size,
        height: size,
      }}
      aria-hidden
    >
      <img src={dataUrl} alt="" draggable={false} />
    </div>
  );
}
