/**
 * ProgressivePreviewOverlay – reveals image only where pieces are correctly placed.
 * No full preview; small revealed regions per correct placement.
 */
import React, { useRef, useEffect } from "react";
import type { Piece } from "@/puzzle/types";

type Props = {
  image: HTMLImageElement;
  pieces: Piece[];
  grid: { rows: number; cols: number };
  width?: number;
  height?: number;
};

function isPieceCorrect(p: Piece): boolean {
  if (p.rotation !== p.targetRotation) return false;
  const dx = Math.abs(p.x + p.pad - p.targetX);
  const dy = Math.abs(p.y + p.pad - p.targetY);
  return dx <= 2 && dy <= 2;
}

export function ProgressivePreviewOverlay({
  image,
  pieces,
  grid,
  width = 120,
  height = 120,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placedPieces = pieces.filter((p) => !p.inTray && isPieceCorrect(p));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image.complete || pieces.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const tileW = pieces[0].tileW;
    const tileH = pieces[0].tileH;
    const assembledW = grid.cols * tileW;
    const assembledH = grid.rows * tileH;
    const scale = Math.min(width / assembledW, height / assembledH);
    const offsetX = (width - assembledW * scale) / 2;
    const offsetY = (height - assembledH * scale) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, width, height);

    for (const p of placedPieces) {
      const sx = p.col * tileW;
      const sy = p.row * tileH;
      const dw = tileW * scale;
      const dh = tileH * scale;
      const dx = offsetX + p.col * tileW * scale;
      const dy = offsetY + p.row * tileH * scale;
      ctx.drawImage(image, sx, sy, tileW, tileH, dx, dy, dw, dh);
    }
  }, [image, placedPieces, grid, pieces, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="progressive-preview-canvas"
      style={{ display: "block", borderRadius: 4 }}
    />
  );
}
