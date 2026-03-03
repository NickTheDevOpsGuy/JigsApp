/**
 * PieceTray – horizontal scrollable tray of unplaced pieces; filter by section, sort by grid/color.
 * Display/sort logic in usePieceTrayDisplay; scroll in usePieceTrayScroll; thumbs in usePieceTrayThumbs.
 */
import React, { forwardRef, useCallback, useRef, useState } from "react";
import type { Piece } from "@/puzzle/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PieceTrayHeader } from "./PieceTrayHeader";
import { usePieceTrayDisplay } from "./usePieceTrayDisplay";
import { usePieceTrayScroll } from "./usePieceTrayScroll";
import { usePieceTrayThumbs } from "./usePieceTrayThumbs";
import styles from "./PieceTray.module.css";

const THUMB_NORMAL = 68;
const THUMB_COMPACT = 54;
const THUMB_EXTRA_COMPACT = 48;

type Props = {
  pieces: Piece[];
  image: HTMLImageElement | null;
  grid: { rows: number; cols: number };
  onPieceClick: (pieceId: string) => void;
  highlightedPieceIds?: Set<string>;
};

export const PieceTray = forwardRef<HTMLDivElement, Props>(function PieceTray(
  { pieces, image, grid, onPieceClick, highlightedPieceIds },
  ref,
) {
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [collapsed, setCollapsed] = useState(false);
  const swipeStartY = useRef<number | null>(null);
  const effectiveCollapsed = isMobile ? false : collapsed;

  const compactDefault = pieces.length >= 25;
  const extraCompactDefault = pieces.length >= 49;
  const compact = compactDefault;
  const thumbSize = extraCompactDefault
    ? THUMB_EXTRA_COMPACT
    : compact
      ? THUMB_COMPACT
      : THUMB_NORMAL;

  const { filter, setFilter, displayed, onShuffle } = usePieceTrayDisplay(
    pieces,
    image,
    grid,
  );
  const {
    scrollerRef,
    scrollProgress,
    canScroll,
    canScrollLeft,
    canScrollRight,
    scrollBy,
  } = usePieceTrayScroll(displayed.length);
  const thumbsById = usePieceTrayThumbs(displayed, image, grid, thumbSize, compact);

  const emptyText =
    pieces.length === 0
      ? "All pieces on board! Drag pieces here to store them."
      : "Drag pieces here to store them";

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
      <PieceTrayHeader
        pieceCount={pieces.length}
        filter={filter}
        setFilter={setFilter}
        hasImage={!!image}
        onShuffle={onShuffle}
      />

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
          {likelyOverflows && canScroll && (
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
                    className={`${styles.pieceButton} ${highlightedPieceIds?.has(p.id) ? styles.pieceButtonPulse : ""}`}
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
          {likelyOverflows && canScroll && (
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
