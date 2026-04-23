/**
 * Piece tray header: title + filter + randomize button.
 */
import { Shuffle } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  TrayFilterButton,
  type TrayFilter,
} from "@/screens/Play/components/hud/TrayFilterButton";
import styles from "./PieceTray.module.css";

interface PieceTrayHeaderProps {
  pieceCount: number;
  filter: TrayFilter;
  setFilter: (f: TrayFilter) => void;
  hasImage: boolean;
  onShuffle: () => void;
}

export function PieceTrayHeader({
  pieceCount,
  filter,
  setFilter,
  hasImage,
  onShuffle,
}: PieceTrayHeaderProps) {
  const showQuickFilters = useMediaQuery("(pointer: coarse)");
  const quickFilters: TrayFilter[] = [
    "arranged",
    "corners",
    "edges",
    "recent",
    "grouped",
  ];

  return (
    <div className={styles.headerBlock}>
      <div className={styles.header}>
        <span className={styles.title}>Pieces ({pieceCount})</span>
        <TrayFilterButton value={filter} onChange={setFilter} hasImage={hasImage} />
        <button
          type="button"
          className={styles.randomBtn}
          onClick={onShuffle}
          disabled={pieceCount === 0}
          aria-label="Randomize piece order"
          title="Randomize order"
        >
          <Shuffle size={18} aria-hidden />
        </button>
      </div>

      {showQuickFilters && (
        <div
          className={styles.quickFilters}
          role="toolbar"
          aria-label="Tray quick filters"
        >
          {quickFilters.map((quickFilter) => (
            <button
              key={quickFilter}
              type="button"
              className={`${styles.quickFilterBtn} ${filter === quickFilter ? styles.quickFilterBtnActive : ""}`}
              onClick={() => setFilter(quickFilter)}
            >
              {quickFilter === "arranged"
                ? "Guide"
                : quickFilter === "corners"
                  ? "Corners"
                  : quickFilter === "edges"
                    ? "Edges"
                    : quickFilter === "recent"
                      ? "Recent"
                      : "Groups"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
