/**
 * PieceTray – displays all tray pieces in a wrapping grid layout (no scroll needed).
 */
import React, { forwardRef } from "react";
import type { Piece } from "@/puzzle/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PieceTrayHeader } from "./PieceTrayHeader";
import { usePieceTrayDisplay } from "./usePieceTrayDisplay";
import { usePieceTrayThumbs } from "./usePieceTrayThumbs";
import styles from "./PieceTray.module.css";

// Thumb sizes - smaller for more pieces so they all fit
function getThumbSize(pieceCount: number, isMobile: boolean): number {
  if (isMobile) {
    if (pieceCount >= 64) return 32;
    if (pieceCount >= 49) return 36;
    if (pieceCount >= 36) return 40;
    if (pieceCount >= 25) return 44;
    if (pieceCount >= 16) return 48;
    return 52;
  }
  // Desktop
  if (pieceCount >= 64) return 40;
  if (pieceCount >= 49) return 44;
  if (pieceCount >= 36) return 48;
  if (pieceCount >= 25) return 52;
  if (pieceCount >= 16) return 56;
  return 60;
}

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

  const pieceCount = grid.rows * grid.cols;
  const compact = pieceCount >= 25;
  const extraCompact = pieceCount >= 49;
  const thumbSize = getThumbSize(pieceCount, isMobile);

  const { filter, setFilter, displayed, onShuffle } = usePieceTrayDisplay(
    pieces,
    image,
    grid,
  );
  const thumbsById = usePieceTrayThumbs(displayed, image, grid, thumbSize, compact);

  const emptyText = "Drag pieces here to store them";

  return (
    <div
      className={`${styles.tray} ${compact ? styles.trayCompact : ""} ${extraCompact ? styles.trayExtraCompact : ""}`}
      ref={ref}
    >
      <PieceTrayHeader
        pieceCount={pieces.length}
        filter={filter}
        setFilter={setFilter}
        hasImage={!!image}
        onShuffle={onShuffle}
      />

      <div className={styles.scrollerWrap}>
        <div className={styles.scroller}>
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
      </div>
    </div>
  );
});
