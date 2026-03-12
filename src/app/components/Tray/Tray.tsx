// src/app/components/Tray/Tray.tsx
import React, { useState, useEffect, useMemo } from "react";
import type { Piece } from "@/puzzle/core/types";
import { renderTrayPiece } from "@/puzzle/canvas/render/renderTrayPiece";
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

const TRAY_SCALE = 0.5;

export function Tray({
  corners,
  edges,
  center,
  onPieceClick,
  imageUrl,
  assembledW,
  assembledH,
}: TrayProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const allPieces = useMemo(
    () => [...corners, ...edges, ...center],
    [corners, edges, center],
  );
  const pieceKey = useMemo(
    () =>
      allPieces
        .map((p) => `${p.id}:${p.rotation}`)
        .sort()
        .join(","),
    [allPieces],
  );

  useEffect(() => {
    if (!imageUrl) {
      setImg(null);
      return;
    }
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = imageUrl;
    return () => {
      el.src = "";
    };
  }, [imageUrl]);

  const [thumbsById, setThumbsById] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!img?.complete || img.naturalWidth === 0 || allPieces.length === 0) {
      setThumbsById(new Map());
      return;
    }
    const next = new Map<string, string>();
    for (const piece of allPieces) {
      try {
        const canvas = renderTrayPiece(piece, img, assembledW, assembledH, TRAY_SCALE);
        next.set(piece.id, canvas.toDataURL("image/png"));
      } catch {
        // skip failed piece
      }
    }
    setThumbsById(next);
  }, [img, pieceKey, assembledW, assembledH, allPieces]);

  const renderPiecePreview = (piece: Piece) => {
    const dataUrl = thumbsById.get(piece.id);
    const size = Math.max(piece.w, piece.h) * TRAY_SCALE + 8;

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
        {dataUrl ? (
          <img
            src={dataUrl}
            alt=""
            width={size}
            height={size}
            className={styles.pieceImg}
          />
        ) : (
          <div
            className={styles.piecePlaceholder}
            style={{ width: size, height: size }}
          />
        )}
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
