/**
 * PieceTray – horizontal scrollable tray with arrow controls and fixed slot capacity.
 */
import React, { forwardRef } from "react";
import type { Piece } from "@/puzzle/core/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PieceTrayHeader } from "./PieceTrayHeader";
import { usePieceTrayDisplay } from "./usePieceTrayDisplay";
import { usePieceTrayScroll } from "./usePieceTrayScroll";
import { usePieceTrayThumbs } from "./usePieceTrayThumbs";
import styles from "./PieceTray.module.css";

/* Tray piece size: minimum 44–56px per spec; compact on mobile, slightly larger on desktop */
function getThumbSize(pieceCount: number, isMobile: boolean): number {
  if (isMobile) {
    if (pieceCount >= 64) return 44;
    if (pieceCount >= 49) return 48;
    if (pieceCount >= 36) return 50;
    if (pieceCount >= 25) return 52;
    if (pieceCount >= 16) return 56;
    return 56;
  }
  if (pieceCount >= 64) return 56;
  if (pieceCount >= 49) return 58;
  if (pieceCount >= 36) return 62;
  if (pieceCount >= 25) return 68;
  if (pieceCount >= 16) return 72;
  return 80;
}

type Props = {
  pieces: Piece[];
  image: HTMLImageElement | null;
  grid: { rows: number; cols: number };
  onPieceClick: (pieceId: string) => void;
  /** Desktop hover / stylus: drive faint target preview on the board canvas. */
  onTrayPieceHover?: (pieceId: string | null) => void;
  highlightedPieceIds?: Set<string>;
  /** Optional class from layout (e.g. large tray variant) */
  className?: string;
};

type TraySlot = { kind: "piece"; piece: Piece };

export function buildTraySlots(displayed: Piece[], totalSlots: number): TraySlot[] {
  const slotCount = Math.max(0, Math.trunc(totalSlots));
  const capped = displayed.slice(0, slotCount);
  return capped.map((piece) => ({ kind: "piece", piece }));
}

export const PieceTray = forwardRef<HTMLDivElement, Props>(function PieceTray(
  { pieces, image, grid, onPieceClick, onTrayPieceHover, highlightedPieceIds, className },
  ref,
) {
  const isMobile = useMediaQuery("(max-width: 600px)");
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  const [previewPieceId, setPreviewPieceId] = React.useState<string | null>(null);
  const longPressTimerRef = React.useRef<number | null>(null);
  const longPressStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = React.useRef(false);

  const totalSlots = grid.rows * grid.cols;
  const compact = totalSlots >= 25;
  const extraCompact = totalSlots >= 49;
  const thumbSize = getThumbSize(totalSlots, isMobile);

  const { filter, setFilter, displayed, onShuffle } = usePieceTrayDisplay(
    pieces,
    image,
    grid,
  );
  const traySlots = buildTraySlots(displayed, totalSlots);
  const {
    scrollerRef,
    scrollProgress,
    canScroll,
    canScrollLeft,
    canScrollRight,
    scrollByOnePiece,
  } = usePieceTrayScroll(traySlots.length);
  const thumbsById = usePieceTrayThumbs(displayed, image, grid, thumbSize, compact);

  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clearTouchPreview = React.useCallback(() => {
    clearLongPressTimer();
    longPressStartRef.current = null;
    setPreviewPieceId(null);
  }, [clearLongPressTimer]);

  React.useEffect(() => () => clearTouchPreview(), [clearTouchPreview]);

  const emptyText = "Drag pieces here to store them";

  return (
    <div
      className={`${styles.tray} ${compact ? styles.trayCompact : ""} ${extraCompact ? styles.trayExtraCompact : ""} ${className ?? ""}`.trim()}
      ref={ref}
    >
      <PieceTrayHeader
        pieceCount={pieces.length}
        filter={filter}
        setFilter={setFilter}
        hasImage={!!image}
        onShuffle={onShuffle}
      />

      <div
        className={styles.scrollIndicator}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Scroll position"
        style={canScroll ? undefined : { visibility: "hidden" }}
      >
        <div
          className={styles.scrollIndicatorFill}
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      <div className={styles.scrollerWrap}>
        {!isCoarsePointer && (
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollByOnePiece(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            title="Scroll left"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
        )}
        <div
          className={`${styles.scroller} ${traySlots.length > 0 ? styles.scrollerSnap : ""}`}
          ref={scrollerRef}
          role="list"
        >
          {traySlots.length === 0 ? (
            <div className={styles.empty}>{emptyText}</div>
          ) : (
            <div className={styles.row}>
              {traySlots.map((slot) => (
                <button
                  key={slot.piece.id}
                  type="button"
                  className={`${styles.pieceButton} ${highlightedPieceIds?.has(slot.piece.id) ? styles.pieceButtonPulse : ""} ${previewPieceId === slot.piece.id ? styles.pieceButtonPreviewing : ""}`}
                  onClick={() => {
                    if (suppressNextClickRef.current) {
                      suppressNextClickRef.current = false;
                      return;
                    }
                    onPieceClick(slot.piece.id);
                  }}
                  onPointerDown={(e) => {
                    if (!isCoarsePointer || e.pointerType === "mouse") return;
                    clearLongPressTimer();
                    longPressStartRef.current = { x: e.clientX, y: e.clientY };
                    longPressTimerRef.current = window.setTimeout(() => {
                      setPreviewPieceId(slot.piece.id);
                      suppressNextClickRef.current = true;
                    }, 220);
                  }}
                  onPointerMove={(e) => {
                    if (!longPressStartRef.current) return;
                    const dx = e.clientX - longPressStartRef.current.x;
                    const dy = e.clientY - longPressStartRef.current.y;
                    if (Math.hypot(dx, dy) > 10) {
                      clearLongPressTimer();
                    }
                  }}
                  onPointerUp={clearTouchPreview}
                  onPointerCancel={clearTouchPreview}
                  onPointerEnter={
                    onTrayPieceHover ? () => onTrayPieceHover(slot.piece.id) : undefined
                  }
                  onPointerLeave={
                    onTrayPieceHover
                      ? () => {
                          onTrayPieceHover(null);
                          clearTouchPreview();
                        }
                      : clearTouchPreview
                  }
                  aria-label={`Place piece ${slot.piece.id}`}
                  title={`Place piece ${slot.piece.id}`}
                >
                  <div
                    className={styles.thumbWrap}
                    style={{ "--thumb-size": `${thumbSize}px` } as React.CSSProperties}
                  >
                    {image && thumbsById.has(slot.piece.id) ? (
                      <img
                        className={styles.thumbImg}
                        src={thumbsById.get(slot.piece.id)}
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
        {!isCoarsePointer && (
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollByOnePiece(1)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            title="Scroll right"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        )}
        {previewPieceId && thumbsById.has(previewPieceId) && (
          <div className={styles.touchPreviewOverlay} aria-hidden="true">
            <div className={styles.touchPreviewCard}>
              <div className={styles.touchPreviewThumb}>
                <img src={thumbsById.get(previewPieceId)} alt="" draggable={false} />
              </div>
              <div className={styles.touchPreviewLabel}>Hold to preview piece</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
