/**
 * PieceTray – horizontal scrollable tray of unplaced pieces; filter by section, sort by grid/color.
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Piece } from "@/puzzle/types";
import { getAverageColor } from "@/puzzle/colorUtils";
import { renderTrayPiece } from "@/puzzle/canvas/renderTrayPiece";
import { Minimize2, Maximize2, Shuffle } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./PieceTray.module.css";

type TraySection = "all" | "corners" | "edges" | "center";
type SortMode = "grid" | "color";

const THUMB_NORMAL = 56;
const THUMB_COMPACT = 36;

type Props = {
  pieces: Piece[];
  image: HTMLImageElement | null;
  grid: { rows: number; cols: number };
  onPieceClick: (pieceId: string) => void;
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
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [section, setSection] = useState<TraySection>("all");
  const [sortMode, setSortMode] = useState<SortMode>("grid");
  const [shuffledOrder, setShuffledOrder] = useState<string[] | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const swipeStartY = useRef<number | null>(null);
  const effectiveCollapsed = isMobile ? false : collapsed;

  // Compact mode: default on for 25+ pieces (mobile or desktop); user can toggle
  const compactDefault = pieces.length >= 25;
  const [compact, setCompact] = useState(compactDefault);
  const thumbSize = compact ? THUMB_COMPACT : THUMB_NORMAL;

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

  const shuffleTray = useCallback(() => {
    const ids = pieces.map((p) => p.id);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    setShuffledOrder(shuffled);
  }, [pieces]);

  const sections = useMemo(() => {
    const corners = pieces.filter((p) => isCorner(p, grid));
    const edges = pieces.filter((p) => isEdge(p, grid));
    const center = pieces.filter((p) => !isCorner(p, grid) && !isEdge(p, grid));

    const all = sortPieces(pieces);
    const cornersS = sortPieces(corners);
    const edgesS = sortPieces(edges);
    const centerS = sortPieces(center);

    const applyShuffle = (arr: Piece[]) => {
      if (!shuffledOrder || arr.length === 0) return arr;
      const orderMap = new Map(shuffledOrder.map((id, i) => [id, i]));
      const inOrder = arr.filter((p) => orderMap.has(p.id));
      const notInOrder = arr.filter((p) => !orderMap.has(p.id));
      inOrder.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      return [...inOrder, ...notInOrder];
    };

    return {
      all: applyShuffle(all),
      corners: applyShuffle(cornersS),
      edges: applyShuffle(edgesS),
      center: applyShuffle(centerS),
    };
  }, [pieces, grid, sortMode, image, hueById, shuffledOrder]);

  const displayed = sections[section];

  const emptyText =
    pieces.length === 0
      ? "All pieces on board! Drag pieces here to store them."
      : "Drag pieces here to store them";

  // Generate jigsaw-shaped thumbnails using the same clip path as the board renderer.
  const thumbsById = useMemo(() => {
    const m = new Map<string, string>();
    if (!image) return m;
    const padding = compact ? 4 : 6;
    const maxW = thumbSize - padding;
    const maxH = thumbSize - padding;

    for (const p of displayed) {
      const scale = Math.min(maxW / p.w, maxH / p.h);
      const assembledW = grid.cols * p.tileW;
      const assembledH = grid.rows * p.tileH;
      const c = renderTrayPiece(p, image, assembledW, assembledH, scale);
      m.set(p.id, c.toDataURL("image/png"));
    }

    return m;
  }, [displayed, image, grid, thumbSize, compact]);

  const updateScrollProgress = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    // Only show indicator when there's meaningful overflow (avoids rounding/subpixel false positives)
    setCanScroll(maxScroll > 8);
    const pct = maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(pct);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollProgress();
    el.addEventListener("scroll", updateScrollProgress);
    const ro = new ResizeObserver(updateScrollProgress);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollProgress);
      ro.disconnect();
    };
  }, [updateScrollProgress, displayed.length]);

  const showCompactToggle = pieces.length >= 25;

  const handleSwipeStart = useCallback((clientY: number) => {
    swipeStartY.current = clientY;
  }, []);

  const handleSwipeEnd = useCallback(
    (clientY: number) => {
      if (isMobile) return;
      const start = swipeStartY.current;
      if (start == null) return;
      swipeStartY.current = null;
      const delta = start - clientY;
      if (Math.abs(delta) < 30) return;
      if (delta > 0) setCollapsed(false);
      else setCollapsed(true);
    },
    [isMobile],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => handleSwipeStart(e.touches[0].clientY),
    [handleSwipeStart],
  );
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) =>
      e.changedTouches[0] && handleSwipeEnd(e.changedTouches[0].clientY),
    [handleSwipeEnd],
  );
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => handleSwipeStart(e.clientY),
    [handleSwipeStart],
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => handleSwipeEnd(e.clientY),
    [handleSwipeEnd],
  );

  const pieceCount = grid.rows * grid.cols;
  const isLargeGrid = pieceCount >= 25;

  return (
    <div
      className={`${styles.tray} ${compact ? styles.trayCompact : ""} ${effectiveCollapsed ? styles.trayCollapsed : ""} ${isLargeGrid ? styles.trayLarge : ""}`}
      ref={ref}
    >
      <div
        className={styles.handle}
        onTouchStart={isMobile ? undefined : handleTouchStart}
        onTouchEnd={isMobile ? undefined : handleTouchEnd}
        onPointerDown={isMobile ? undefined : handlePointerDown}
        onPointerUp={isMobile ? undefined : handlePointerUp}
        onPointerLeave={() => (swipeStartY.current = null)}
        onClick={(e) => {
          if (isMobile) return;
          e.stopPropagation();
          setCollapsed((c) => !c);
        }}
        role="button"
        tabIndex={0}
        aria-label={effectiveCollapsed ? "Expand piece drawer" : "Collapse piece drawer"}
        onKeyDown={(e) => {
          if (isMobile) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
      >
        <span className={styles.handleBar} />
        {effectiveCollapsed && (
          <span className={styles.handleLabel}>Piece Drawer ({pieces.length})</span>
        )}
      </div>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Piece Drawer ({pieces.length})</span>
          {showCompactToggle && (
            <button
              type="button"
              className={styles.compactToggle}
              onClick={() => setCompact((c) => !c)}
              aria-label={compact ? "Expand thumbnails" : "Compact thumbnails"}
              title={compact ? "Expand thumbnails" : "Compact thumbnails"}
            >
              {compact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
          )}
        </div>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Filter</span>
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
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Sort by</span>
            <div className={styles.segment} aria-label="Sort mode">
              <button
                type="button"
                className={sortMode === "grid" ? styles.active : undefined}
                onClick={() => {
                  setSortMode("grid");
                  setShuffledOrder(null);
                }}
              >
                Position
              </button>
              <button
                type="button"
                className={sortMode === "color" ? styles.active : undefined}
                onClick={() => {
                  setSortMode("color");
                  setShuffledOrder(null);
                }}
                disabled={!image}
                title={!image ? "Load an image to enable color sorting" : undefined}
              >
                Color
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.shuffleBtn}
            onClick={shuffleTray}
            disabled={pieces.length === 0}
            aria-label="Shuffle tray"
            title="Randomize piece order in tray"
          >
            <Shuffle size={14} />
          </button>
        </div>
      </div>

      {!effectiveCollapsed && displayed.length > 0 && canScroll && (
        <div
          className={styles.scrollIndicator}
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Scroll position"
        >
          <div
            className={styles.scrollIndicatorFill}
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      )}

      {!effectiveCollapsed && (
        <div
          className={`${styles.scroller} ${displayed.length > 0 ? styles.scrollerSnap : ""}`}
          ref={scrollerRef}
          role="list"
        >
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
                  <div
                    className={styles.thumbWrap}
                    style={{ "--thumb-size": `${thumbSize}px` } as React.CSSProperties}
                  >
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
      )}
    </div>
  );
});
