// src/app/components/PieceTray/PieceTray.tsx
import React, { useRef, useEffect } from "react";
import type { Piece, GridSize } from "@/puzzle/types";
import styles from "./PieceTray.module.css";

// Detect touch device
const isTouchDevice = () =>
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

type PieceTrayProps = {
  pieces: Piece[];
  image: HTMLImageElement | null;
  grid: GridSize;
  onPieceClick: (pieceId: string) => void;
};

export function PieceTray({ pieces, image, grid, onPieceClick }: PieceTrayProps) {
  const isTouch = isTouchDevice();

  const helpText = isTouch
    ? "Long-press to store • Double-tap to rotate"
    : "Middle-click to store • Right-click to rotate";

  const emptyText = isTouch
    ? "Long-press pieces to store them here"
    : "Middle-click pieces to store them here";

  return (
    <div className={styles.tray}>
      <div className={styles.trayHeader}>
        <span>Piece Drawer ({pieces.length})</span>
        <span className={styles.trayHelp}>{helpText}</span>
      </div>
      <div className={styles.trayScroll}>
        {pieces.length === 0 ? (
          <div className={styles.trayEmpty}>{emptyText}</div>
        ) : (
          <div className={styles.trayPieces}>
            {pieces.map((piece) => (
              <TrayPieceThumb
                key={piece.id}
                piece={piece}
                image={image}
                grid={grid}
                onClick={() => onPieceClick(piece.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type TrayPieceThumbProps = {
  piece: Piece;
  image: HTMLImageElement | null;
  grid: GridSize;
  onClick: () => void;
};

function TrayPieceThumb({ piece, image, grid, onClick }: TrayPieceThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Thumbnail size
  const thumbSize = 64;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || image.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = thumbSize * dpr;
    canvas.height = thumbSize * dpr;
    canvas.style.width = `${thumbSize}px`;
    canvas.style.height = `${thumbSize}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, thumbSize, thumbSize);

    // Calculate source region
    const srcTileW = image.naturalWidth / grid.cols;
    const srcTileH = image.naturalHeight / grid.rows;

    const srcPadX = (piece.pad / piece.tileW) * srcTileW;
    const srcPadY = (piece.pad / piece.tileH) * srcTileH;

    const srcX = piece.col * srcTileW - srcPadX;
    const srcY = piece.row * srcTileH - srcPadY;
    const srcW = srcTileW + srcPadX * 2;
    const srcH = srcTileH + srcPadY * 2;

    // Scale to fit thumbnail while maintaining aspect
    const scale = Math.min(thumbSize / piece.w, thumbSize / piece.h) * 0.9;

    // Create clipping path from piece shape
    let path: Path2D | null = null;
    try {
      if (piece.shapePath) {
        path = new Path2D(piece.shapePath);
      }
    } catch {
      path = null;
    }

    ctx.save();

    // Center and scale
    ctx.translate(thumbSize / 2, thumbSize / 2);
    ctx.scale(scale, scale);
    ctx.translate(-piece.w / 2, -piece.h / 2);

    // Clip to piece shape
    if (path) {
      ctx.clip(path);
    }

    // Draw the image slice
    ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, piece.w, piece.h);

    ctx.restore();

    // Draw outline
    if (path) {
      ctx.save();
      ctx.translate(thumbSize / 2, thumbSize / 2);
      ctx.scale(scale, scale);
      ctx.translate(-piece.w / 2, -piece.h / 2);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1 / scale;
      ctx.stroke(path);
      ctx.restore();
    }
  }, [piece, image, grid]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.trayPiece}
      onClick={onClick}
      title={`Piece ${piece.id} (row ${piece.row + 1}, col ${piece.col + 1})`}
    />
  );
}
