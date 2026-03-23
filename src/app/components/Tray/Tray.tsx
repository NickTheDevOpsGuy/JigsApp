// src/app/components/Tray/Tray.tsx
import { useState, useEffect, useMemo } from "react";
import type { Piece } from "@/puzzle/core/types";
import { renderTrayPiece } from "@/puzzle/canvas/render/renderTrayPiece";
import { canvasToObjectUrl, revokeObjectUrls, yieldToMainThread } from "@/utils/async";
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
      revokeObjectUrls(thumbsById.values());
      setThumbsById(new Map());
      return;
    }
    let cancelled = false;
    void (async () => {
      await yieldToMainThread();
      const entries = await Promise.all(
        allPieces.map(async (piece) => {
          try {
            const canvas = renderTrayPiece(
              piece,
              img,
              assembledW,
              assembledH,
              TRAY_SCALE,
            );
            return [piece.id, await canvasToObjectUrl(canvas, "image/png")] as const;
          } catch {
            return [piece.id, null] as const;
          }
        }),
      );
      const next = new Map<string, string>();
      for (const [id, url] of entries) {
        if (url) next.set(id, url);
      }
      if (cancelled) {
        revokeObjectUrls(next.values());
        return;
      }
      revokeObjectUrls(thumbsById.values());
      setThumbsById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [img, pieceKey, assembledW, assembledH, allPieces]);

  useEffect(() => {
    return () => {
      revokeObjectUrls(thumbsById.values());
    };
  }, [thumbsById]);

  const renderPiecePreview = (piece: Piece) => {
    const dataUrl = thumbsById.get(piece.id);
    const size = Math.max(piece.w, piece.h) * TRAY_SCALE + 8;

    return (
      <button
        key={piece.id}
        type="button"
        className={styles.trayPiece}
        onClick={() => onPieceClick(piece.id)}
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
      </button>
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
