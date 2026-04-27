/**
 * usePieceTrayDisplay – filter state, shuffle, and sorted/filtered piece list for the tray.
 * Supports dominant-color clustering for visual grouping on mobile and desktop.
 */
import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import type { Piece } from "@/puzzle/core/types";
import { createAverageColorSampler } from "@/puzzle/core/colorUtils";
import type { TrayFilter } from "@/screens/Play/components/hud/TrayFilterButton";
import { yieldToMainThread } from "@/utils/async";

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

function hashTrayPieceIds(ids: string): number {
  let h = 0;
  for (let i = 0; i < ids.length; i++) {
    h = (Math.imul(31, h) + ids.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** Deterministic shuffle so tray order stays stable across re-renders until shuffleKey or pieces change. */
function seededShufflePieces(pieces: Piece[], seed: number): Piece[] {
  const out = [...pieces];
  let state = seed >>> 0;
  const nextRand = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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

function buildGroupSizeMap(pieces: Piece[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const piece of pieces) {
    counts.set(piece.groupId, (counts.get(piece.groupId) ?? 0) + 1);
  }
  return counts;
}

export function sortTrayPiecesForFilter(
  pieces: Piece[],
  grid: { rows: number; cols: number },
  filter: TrayFilter,
  opts: {
    imageAvailable?: boolean;
    hueById?: Map<string, number>;
  } = {},
): Piece[] {
  const { imageAvailable = false, hueById = new Map<string, number>() } = opts;
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
  const corners = pieces.filter((p) => isCorner(p, grid));
  const edges = pieces.filter((p) => isEdge(p, grid));
  const interior = pieces.filter((p) => !isCorner(p, grid) && !isEdge(p, grid));
  const allByGrid = [...pieces].sort(byGrid);
  const allByHue = imageAvailable ? [...pieces].sort(byHue) : allByGrid;
  const groupSizeById = buildGroupSizeMap(pieces);
  const byGroupStrength = (a: Piece, b: Piece) => {
    const groupDelta =
      (groupSizeById.get(b.groupId) ?? 1) - (groupSizeById.get(a.groupId) ?? 1);
    if (groupDelta !== 0) return groupDelta;
    const dragDelta = (b.dragCount ?? 0) - (a.dragCount ?? 0);
    if (dragDelta !== 0) return dragDelta;
    return byGrid(a, b);
  };
  const byRecentTouch = (a: Piece, b: Piece) => {
    const dragDelta = (b.dragCount ?? 0) - (a.dragCount ?? 0);
    if (dragDelta !== 0) return dragDelta;
    const groupDelta =
      (groupSizeById.get(b.groupId) ?? 1) - (groupSizeById.get(a.groupId) ?? 1);
    if (groupDelta !== 0) return groupDelta;
    return byGrid(a, b);
  };

  switch (filter) {
    case "clusters":
      return imageAvailable
        ? clusterPiecesByDominantColor(pieces, hueById, byGrid)
        : allByGrid;
    case "arranged": {
      const cornersSorted = [...corners].sort(byGrid);
      const edgesSorted = [...edges].sort(byGrid);
      if (!imageAvailable || interior.length === 0) {
        return [...cornersSorted, ...edgesSorted, ...[...interior].sort(byGroupStrength)];
      }
      const interiorClustered = clusterPiecesByDominantColor(interior, hueById, byGrid);
      return [...cornersSorted, ...edgesSorted, ...interiorClustered];
    }
    case "corners":
      return [...corners].sort(byGrid);
    case "edges":
      return [...edges].sort(byGrid);
    case "colors":
      return allByHue;
    case "recent":
      return [...pieces].sort(byRecentTouch);
    case "grouped":
      return [...pieces].sort(byGroupStrength);
    default:
      return allByGrid;
  }
}

export function usePieceTrayDisplay(
  pieces: Piece[],
  image: HTMLImageElement | null,
  grid: { rows: number; cols: number },
) {
  const [filter, setFilter] = useState<TrayFilter>("all");
  const hasAutoSelectedClustersRef = useRef(false);
  /** 0 = filter order only (clean). Greater than 0 = seeded shuffle; user shuffle increments. */
  const [shuffleKey, setShuffleKey] = useState(1);
  const [hueById, setHueById] = useState<Map<string, number>>(new Map());
  const [imageLoadCount, setImageLoadCount] = useState(0);
  const prevTrayLenRef = useRef<number | null>(null);

  /* Edge priority: at puzzle start show edge pieces first. */
  useEffect(() => {
    if (!image || hasAutoSelectedClustersRef.current) return;
    hasAutoSelectedClustersRef.current = true;
    setFilter("arranged");
  }, [image]);

  /* After a piece leaves the tray (placed on board), snap to tidy filter order. */
  useLayoutEffect(() => {
    const n = pieces.length;
    if (prevTrayLenRef.current != null && n < prevTrayLenRef.current) {
      setShuffleKey(0);
    }
    prevTrayLenRef.current = n;
  }, [pieces.length]);

  const trayIdKey = useMemo(
    () =>
      pieces
        .map((p) => p.id)
        .sort()
        .join(","),
    [pieces],
  );

  useEffect(() => {
    setHueById(new Map());
    if (!image || pieces.length === 0) return;
    if (!image.complete || image.naturalWidth === 0) {
      const onLoad = () => setImageLoadCount((count) => count + 1);
      image.addEventListener("load", onLoad);
      return () => image.removeEventListener("load", onLoad);
    }

    let cancelled = false;
    const batchSize = pieces.length >= 64 ? 10 : 16;
    void (async () => {
      await yieldToMainThread();
      const sample = createAverageColorSampler(image, grid);
      const next = new Map<string, number>();
      for (let i = 0; i < pieces.length; i++) {
        if (cancelled) return;
        const piece = pieces[i];
        next.set(piece.id, sample(piece).hue);
        if ((i + 1) % batchSize === 0) await yieldToMainThread();
      }
      if (!cancelled) setHueById(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [image, imageLoadCount, pieces, grid.rows, grid.cols, trayIdKey]);

  const displayed = useMemo(() => {
    const result = sortTrayPiecesForFilter(pieces, grid, filter, {
      imageAvailable: Boolean(image),
      hueById,
    });
    if (shuffleKey === 0) return result;
    const seed = (shuffleKey * 0x9e3779b1) ^ hashTrayPieceIds(trayIdKey);
    return seededShufflePieces(result, seed);
  }, [pieces, grid, filter, image, hueById, shuffleKey, trayIdKey]);

  const onShuffle = useCallback(() => setShuffleKey((k) => k + 1), []);

  return { filter, setFilter, displayed, onShuffle };
}
