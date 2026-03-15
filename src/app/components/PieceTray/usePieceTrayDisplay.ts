/**
 * usePieceTrayDisplay – filter state, shuffle, and sorted/filtered piece list for the tray.
 * Supports dominant-color clustering for visual grouping on mobile and desktop.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Piece } from "@/puzzle/core/types";
import { getAverageColor } from "@/puzzle/core/colorUtils";
import type { TrayFilter } from "@/screens/Play/components/hud/TrayFilterButton";

const NUM_HUE_BUCKETS = 6;
const HUE_BUCKET_DEG = 360 / NUM_HUE_BUCKETS;
/** Hue offset so red (0/360) sits in one bucket; bucket = ((hue + offset) % 360) / HUE_BUCKET_DEG */
const HUE_BUCKET_OFFSET = HUE_BUCKET_DEG / 2;

function getHueBucket(hue: number): number {
  return Math.min(
    NUM_HUE_BUCKETS - 1,
    Math.floor(((hue + HUE_BUCKET_OFFSET) % 360) / HUE_BUCKET_DEG),
  );
}

/** Group pieces by dominant color (hue buckets with wraparound), then sort by grid within each cluster. */
function clusterPiecesByDominantColor(
  pieceList: Piece[],
  hueById: Map<string, number>,
  byGrid: (a: Piece, b: Piece) => number,
): Piece[] {
  if (pieceList.length === 0) return [];
  const withBucket = pieceList.map((p) => ({
    piece: p,
    bucket: hueById.has(p.id) ? getHueBucket(hueById.get(p.id)!) : NUM_HUE_BUCKETS,
  }));
  withBucket.sort((a, b) => {
    if (a.bucket !== b.bucket) return a.bucket - b.bucket;
    return byGrid(a.piece, b.piece);
  });
  return withBucket.map((x) => x.piece);
}

export function isCorner(p: Piece, grid: { rows: number; cols: number }) {
  const lastRow = grid.rows - 1;
  const lastCol = grid.cols - 1;
  return (
    (p.row === 0 && p.col === 0) ||
    (p.row === 0 && p.col === lastCol) ||
    (p.row === lastRow && p.col === 0) ||
    (p.row === lastRow && p.col === lastCol)
  );
}

export function isEdge(p: Piece, grid: { rows: number; cols: number }) {
  const lastRow = grid.rows - 1;
  const lastCol = grid.cols - 1;
  if (isCorner(p, grid)) return false;
  return p.row === 0 || p.row === lastRow || p.col === 0 || p.col === lastCol;
}

export function usePieceTrayDisplay(
  pieces: Piece[],
  image: HTMLImageElement | null,
  grid: { rows: number; cols: number },
) {
  const [filter, setFilter] = useState<TrayFilter>("all");
  const hasAutoSelectedClustersRef = useRef(false);
  /* Start with shuffle so tray order is randomized from the beginning */
  const [shuffleKey, setShuffleKey] = useState(1);

  /* Edge priority: at puzzle start show edge pieces first. */
  useEffect(() => {
    if (!image || hasAutoSelectedClustersRef.current) return;
    hasAutoSelectedClustersRef.current = true;
    setFilter("arranged");
  }, [image]);

  const hueById = useMemo(() => {
    const m = new Map<string, number>();
    if (!image) return m;
    for (const p of pieces) {
      const c = getAverageColor(image, p, grid);
      m.set(p.id, c.hue);
    }
    return m;
  }, [image, pieces, grid]);

  const byGrid = useCallback(
    (a: Piece, b: Piece) => a.row - b.row || a.col - b.col || a.id.localeCompare(b.id),
    [],
  );
  const byHue = useCallback(
    (a: Piece, b: Piece) => {
      const ha = hueById.get(a.id);
      const hb = hueById.get(b.id);
      if (ha == null && hb == null) return byGrid(a, b);
      if (ha == null) return 1;
      if (hb == null) return -1;
      return ha - hb || byGrid(a, b);
    },
    [hueById, byGrid],
  );

  const shuffleArray = useCallback(<T>(arr: T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }, []);

  const displayed = useMemo(() => {
    const corners = pieces.filter((p) => isCorner(p, grid));
    const edges = pieces.filter((p) => isEdge(p, grid));
    const interior = pieces.filter((p) => !isCorner(p, grid) && !isEdge(p, grid));
    const allByGrid = [...pieces].sort(byGrid);
    const allByHue = image ? [...pieces].sort(byHue) : allByGrid;

    let result: Piece[];
    switch (filter) {
      case "clusters": {
        result = image
          ? clusterPiecesByDominantColor(pieces, hueById, byGrid)
          : allByGrid;
        break;
      }
      case "arranged": {
        const edgesSorted = [...edges].sort(byGrid);
        if (!image || interior.length === 0) {
          result = edgesSorted;
        } else {
          const interiorClustered = clusterPiecesByDominantColor(
            interior,
            hueById,
            byGrid,
          );
          result = [...edgesSorted, ...interiorClustered];
        }
        break;
      }
      case "corners":
        result = [...corners].sort(byGrid);
        break;
      case "edges":
        result = [...edges].sort(byGrid);
        break;
      case "colors":
        result = allByHue;
        break;
      default:
        result = allByGrid;
    }
    return shuffleKey > 0 ? shuffleArray(result) : result;
  }, [pieces, grid, filter, image, hueById, shuffleKey, shuffleArray, byGrid, byHue]);

  const onShuffle = useCallback(() => setShuffleKey((k) => k + 1), []);

  return { filter, setFilter, displayed, onShuffle };
}
