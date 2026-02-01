// src/app/components/PieceTray/PieceTray.tsx
import React, { useMemo, useState } from "react";
import type { Piece } from "@/puzzle/types";
import { getAverageColor } from "@/puzzle/colorUtils";
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

export function PieceTray({ pieces, image, grid, onPieceClick, isCoarsePointer }: Props) {
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

  const helpText = isCoarsePointer
    ? "Long-press to store • Tap to rotate"
    : "Middle-click to store • Right-click to rotate";

  const emptyText = isCoarsePointer
    ? "Long-press pieces to store them here"
    : "Middle-click pieces to store them here";

  return (
    <div className={styles.tray}>
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

        <div className={styles.sort} aria-label="Tray sort">
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
          >
            Color
          </button>
        </div>
      </div>

      <div className={styles.scroller}>
        {displayed.length === 0 ? (
          <div className={styles.empty}>{emptyText}</div>
        ) : (
          displayed.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.pieceButton}
              onClick={() => onPieceClick(p.id)}
              aria-label={`Place piece ${p.id}`}
            >
              <div className={styles.thumbWrap}>
                {/* Render via background-position on the wrapper so we don't need a canvas here */}
                <div
                  className={styles.thumb}
                  style={
                    image
                      ? {
                          backgroundImage: `url(${image.src})`,
                          backgroundSize: `${grid.cols * p.tileW}px ${grid.rows * p.tileH}px`,
                          backgroundPosition: `${-p.col * p.tileW}px ${-p.row * p.tileH}px`,
                        }
                      : undefined
                  }
                />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
