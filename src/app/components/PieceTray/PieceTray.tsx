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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TrayFilterButton } from "@/screens/Play/components/TrayFilterButton";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./PieceTray.module.css";

export type TrayFilter = "all" | "edges" | "colors";

const THUMB_NORMAL = 68;
const THUMB_COMPACT = 54;
const THUMB_EXTRA_COMPACT = 48;

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
  const [filter, setFilter] = useState<TrayFilter>("all");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const swipeStartY = useRef<number | null>(null);
  const effectiveCollapsed = isMobile ? false : collapsed;

  // Compact mode: 25+ pieces; extra-compact for 49+ to avoid layout/performance issues
  const compactDefault = pieces.length >= 25;
  const extraCompactDefault = pieces.length >= 49;
  const compact = compactDefault;
  const thumbSize = extraCompactDefault
    ? THUMB_EXTRA_COMPACT
    : compact
      ? THUMB_COMPACT
      : THUMB_NORMAL;

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

  const displayed = useMemo(() => {
    const edges = pieces.filter((p) => isEdge(p, grid));
    const allByGrid = [...pieces].sort(byGrid);
    const allByHue = image ? [...pieces].sort(byHue) : allByGrid;

    switch (filter) {
      case "edges":
        return [...edges].sort(byGrid);
      case "colors":
        return allByHue;
      default:
        return allByGrid;
    }
  }, [pieces, grid, filter, image, hueById]);

  const emptyText =
    pieces.length === 0
      ? "All pieces on board! Drag pieces here to store them."
      : "Drag pieces here to store them";

  // Generate jigsaw-shaped thumbnails. For 50+ pieces, batch per frame to avoid blocking.
  const [thumbsById, setThumbsById] = useState<Map<string, string>>(new Map());
  const [imageLoadCount, setImageLoadCount] = useState(0);
  const BATCH_SIZE = 12;
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;

  useEffect(() => {
    if (!image || displayed.length === 0) {
      setThumbsById(new Map());
      return;
    }
    if (!image.complete || image.naturalWidth === 0) {
      const onLoad = () => setImageLoadCount((c) => c + 1);
      image.addEventListener("load", onLoad);
      return () => image.removeEventListener("load", onLoad);
    }
    const padding = compact ? 4 : 6;
    const maxW = thumbSize - padding;
    const maxH = thumbSize - padding;
    const assembledW = grid.cols * (displayed[0]?.tileW ?? 1);
    const assembledH = grid.rows * (displayed[0]?.tileH ?? 1);

    const renderOne = (p: Piece): string | null => {
      try {
        if (!p.w || !p.h || p.w <= 0 || p.h <= 0) return null;
        const scale = Math.min(maxW / p.w, maxH / p.h);
        if (!Number.isFinite(scale) || scale <= 0) return null;
        const c = renderTrayPiece(p, image, assembledW, assembledH, scale);
        return c.toDataURL("image/png");
      } catch {
        return null;
      }
    };

    if (displayed.length < 60) {
      const m = new Map<string, string>();
      for (const p of displayed) {
        const data = renderOne(p);
        if (data) m.set(p.id, data);
      }
      setThumbsById(m);
      return;
    }

    setThumbsById(new Map());
    let cancelled = false;
    let index = 0;

    const processBatch = () => {
      if (cancelled) return;
      const current = displayedRef.current;
      const next = new Map<string, string>();
      const end = Math.min(index + BATCH_SIZE, current.length);
      for (let i = index; i < end; i++) {
        const p = current[i];
        const data = renderOne(p);
        if (data) next.set(p.id, data);
      }
      setThumbsById((prev) => {
        const merged = new Map(prev);
        next.forEach((v, k) => merged.set(k, v));
        return merged;
      });
      index += BATCH_SIZE;
      if (index < displayedRef.current.length) {
        requestAnimationFrame(processBatch);
      }
    };

    processBatch();
    return () => {
      cancelled = true;
    };
  }, [displayed, image, grid, thumbSize, compact, imageLoadCount]);

  const updateScrollProgress = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const hasOverflow = maxScroll > 8;
    setCanScroll(hasOverflow);
    setCanScrollLeft(hasOverflow && scrollLeft > 4);
    setCanScrollRight(hasOverflow && scrollLeft < maxScroll - 4);
    const pct = maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(pct);
  }, []);

  const scrollBy = useCallback((delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const run = () => {
      updateScrollProgress();
      if (displayed.length > 20) {
        requestAnimationFrame(() => requestAnimationFrame(updateScrollProgress));
        setTimeout(updateScrollProgress, 150);
        setTimeout(updateScrollProgress, 400);
      }
    };
    run();
    el.addEventListener("scroll", updateScrollProgress);
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollProgress);
      ro.disconnect();
    };
  }, [updateScrollProgress, displayed.length]);

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
  const likelyOverflows = displayed.length >= 8;

  return (
    <div
      className={`${styles.tray} ${compact ? styles.trayCompact : ""} ${extraCompactDefault ? styles.trayExtraCompact : ""} ${effectiveCollapsed ? styles.trayCollapsed : ""} ${isLargeGrid ? styles.trayLarge : ""}`}
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
          <TrayFilterButton value={filter} onChange={setFilter} hasImage={!!image} />
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
        <div className={styles.scrollerWrap}>
          {likelyOverflows && (
            <button
              type="button"
              className={styles.scrollBtn}
              onClick={() => scrollBy(-180)}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              title="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div
            className={`${styles.scroller} ${displayed.length > 0 && displayed.length < 25 ? styles.scrollerSnap : ""}`}
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
                      {image && thumbsById.has(p.id) ? (
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
          {likelyOverflows && (
            <button
              type="button"
              className={styles.scrollBtn}
              onClick={() => scrollBy(180)}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              title="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
