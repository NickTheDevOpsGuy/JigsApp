// src/app/components/Tray/Tray.tsx
import React from "react";
import type { Piece } from "@/puzzle/core/types";
import styles from "./Tray.module.css";

type TrayProps = {
  corners: Piece[];
  edges: Piece[];
  center: Piece[];
  onPieceClick: (pieceId: string) => void;
  imageUrl: string;
  assembledW: number;
  assembledH: number;
};

export function Tray({
  corners,
  edges,
  center,
  onPieceClick,
  imageUrl,
  assembledW,
  assembledH,
}: TrayProps) {
  const renderPiecePreview = (piece: Piece) => {
    const scale = 0.5; // Show pieces at 50% size in tray

    return (
      <div
        key={piece.id}
        className={styles.trayPiece}
        role="button"
        tabIndex={0}
        onClick={() => onPieceClick(piece.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPieceClick(piece.id);
          }
        }}
        title={`Piece ${piece.id} - Click to place on board`}
        aria-label={`Place piece ${piece.id} on board`}
      >
        <svg
          width={piece.w * scale}
          height={piece.h * scale}
          viewBox={`0 0 ${piece.w} ${piece.h}`}
          className={styles.pieceSvg}
        >
          <defs>
            <clipPath id={`clip-${piece.id}`}>
              <path d={piece.shapePath} />
            </clipPath>
          </defs>

          <image
            href={imageUrl}
            x={-piece.targetX + piece.pad}
            y={-piece.targetY + piece.pad}
            width={assembledW}
            height={assembledH}
            clipPath={`url(#clip-${piece.id})`}
          />

          <path
            d={piece.shapePath}
            fill="none"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.tray}>
      {corners.length > 0 && (
        <div className={styles.traySection}>
          <div className={styles.trayLabel}>🔲 Corners ({corners.length})</div>
          <div className={styles.trayGrid}>{corners.map(renderPiecePreview)}</div>
        </div>
      )}

      {edges.length > 0 && (
        <div className={styles.traySection}>
          <div className={styles.trayLabel}>📏 Edges ({edges.length})</div>
          <div className={styles.trayGrid}>{edges.map(renderPiecePreview)}</div>
        </div>
      )}

      {center.length > 0 && (
        <div className={styles.traySection}>
          <div className={styles.trayLabel}>🧩 Center ({center.length})</div>
          <div className={styles.trayGrid}>{center.map(renderPiecePreview)}</div>
        </div>
      )}

      {corners.length === 0 && edges.length === 0 && center.length === 0 && (
        <div className={styles.emptyTray}>
          <p>
            💡 <strong>Tip:</strong> Right-click pieces to send them here for organization
          </p>
        </div>
      )}
    </div>
  );
}
