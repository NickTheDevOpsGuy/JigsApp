// src/app/components/PieceTray/PieceTray.tsx
import React, { forwardRef, useMemo, useState } from "react";
import type { Piece } from "@/puzzle/types";
import { getAverageColor } from "@/puzzle/colorUtils";
import { renderTrayPiece } from "@/puzzle/canvas/renderTrayPiece";
import styles from "./PieceTray.module.css";

type TraySection = "all" | "corners" | "edges" | "center";
type SortMode = "grid" | "color";

type Props = {
  pieces: Piece[];
  image: HTMLImageElement | null;
  grid: { rows: number; cols: number };
  onPieceClick: (pieceId: string) => void;
  isCoarsePointer: boolean;
};

function isCorner(p: Piece, grid: { rows: number; cols: number }) {
  const lastRow = grid.rows - 1;
  const lastCol = grid.cols - 1;
  return (
    (p.row === 0 && p.col === 0) ||
    (p.row === 0 && p.col === lastCol) ||
    (p.row === lastRow && p.col === 0) ||
    (p.row === lastRow && p.col === lastCol)
  );
}

function isEdge(p: Piece, grid: { rows: number; cols: number }) {
  const lastRow = grid.rows - 1;
  const lastCol = grid.cols - 1;
  if (isCorner(p, grid)) return false;
  return p.row === 0 || p.row === lastRow || p.col === 0 || p.col === lastCol;
}

export const PieceTray = forwardRef<HTMLDivElement, Props>(function PieceTray(
  { pieces, image, grid, onPieceClick },
  ref,
) {
  const [section, setSection] = useState<TraySection>("all");
  const [sortMode, setSortMode] = useState<SortMode>("grid");

  // Precompute hue for stable-ish sorting.
  const hueById = useMemo(() => {
    const m = new Map<string, number>();
    if (!image) return m;
    for (const p of pieces) {
      const c = getAverageColor(image, p, grid);
      m.set(p.id, c.hue);
    }
    return m;
  }, [image, pieces, grid]);

  const byGrid = (a: Piece, b: Piece) =>
    a.row - b.row || a.col - b.col || a.id.localeCompare(b.id);

  const byHue = (a: Piece, b: Piece) => {
    const ha = hueById.get(a.id);
    const hb = hueById.get(b.id);
    if (ha == null && hb == null) return byGrid(a, b);
    if (ha == null) return 1;
    if (hb == null) return -1;
    return ha - hb || byGrid(a, b);
  };

  const sortPieces = (arr: Piece[]) => {
    const next = [...arr];
    if (sortMode === "color" && image) next.sort(byHue);
    else next.sort(byGrid);
    return next;
  };

  const sections = useMemo(() => {
    const corners = pieces.filter((p) => isCorner(p, grid));
    const edges = pieces.filter((p) => isEdge(p, grid));
    const center = pieces.filter((p) => !isCorner(p, grid) && !isEdge(p, grid));

    return {
      all: sortPieces(pieces),
      corners: sortPieces(corners),
      edges: sortPieces(edges),
      center: sortPieces(center),
    };
  }, [pieces, grid, sortMode, image, hueById]);

  const displayed = sections[section];

  const helpText = "Drag pieces here to store • Tap to place";
  const emptyText = "Drag pieces here to store them";

  // Generate jigsaw-shaped thumbnails using the same clip path as the board renderer.
  // Memoized so the tray stays snappy.
  const thumbsById = useMemo(() => {
    const m = new Map<string, string>();
    if (!image) return m;

    for (const p of displayed) {
      // Fit piece bounding box into the 56px thumb box (with a little breathing room)
      const box = 56;
      const padding = 6;
      const maxW = box - padding;
      const maxH = box - padding;

      const scale = Math.min(maxW / p.w, maxH / p.h);

      const assembledW = grid.cols * p.tileW;
      const assembledH = grid.rows * p.tileH;

      const c = renderTrayPiece(p, image, assembledW, assembledH, scale);
      m.set(p.id, c.toDataURL("image/png"));
    }

    return m;
  }, [displayed, image, grid]);

  return (
    <div className={styles.tray} ref={ref}>
      <div className={styles.header}>
        <div className={styles.title}>Piece Drawer ({pieces.length})</div>
        <div className={styles.help}>{helpText}</div>
      </div>

      <div className={styles.controls}>
        <div className={styles.segment} aria-label="Tray section">
          <button
            type="button"
            className={section === "all" ? styles.active : undefined}
            onClick={() => setSection("all")}
          >
            All
          </button>
          <button
            type="button"
            className={section === "edges" ? styles.active : undefined}
            onClick={() => setSection("edges")}
          >
            Edges
          </button>
          <button
            type="button"
            className={section === "center" ? styles.active : undefined}
            onClick={() => setSection("center")}
          >
            Center
          </button>
          <button
            type="button"
            className={section === "corners" ? styles.active : undefined}
            onClick={() => setSection("corners")}
          >
            Corners
          </button>
        </div>

        <div className={styles.segment} aria-label="Sort mode">
          <button
            type="button"
            className={sortMode === "grid" ? styles.active : undefined}
            onClick={() => setSortMode("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className={sortMode === "color" ? styles.active : undefined}
            onClick={() => setSortMode("color")}
            disabled={!image}
            title={!image ? "Load an image to enable color sorting" : undefined}
          >
            Color
          </button>
        </div>
      </div>

      <div className={styles.scroller} role="list">
        {displayed.length === 0 ? (
          <div className={styles.empty}>{emptyText}</div>
        ) : (
          <div className={styles.row}>
            {displayed.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.pieceButton}
                onClick={() => onPieceClick(p.id)}
                aria-label={`Place piece ${p.id}`}
              >
                <div className={styles.thumbWrap}>
                  {image ? (
                    <img
                      className={styles.thumbImg}
                      src={thumbsById.get(p.id)}
                      alt=""
                      draggable={false}
                    />
                  ) : (
                    <div className={styles.thumbFallback} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
