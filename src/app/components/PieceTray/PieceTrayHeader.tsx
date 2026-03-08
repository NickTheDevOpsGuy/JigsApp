/**
 * Piece tray header: title + filter + randomize button.
 */
import { Shuffle } from "lucide-react";
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
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <span className={styles.title}>Piece Drawer ({pieceCount})</span>
        <div className={styles.headerControls}>
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
      </div>
    </div>
  );
}
