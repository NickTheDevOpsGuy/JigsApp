/**
 * Gallery thumbnail for sample puzzle in SetupScreen.
 */
import { useState } from "react";
import { Puzzle } from "lucide-react";
import { SAMPLE_PUZZLES } from "@/data/samplePuzzles";
import styles from "../SetupScreen.module.css";

type GalleryPuzzle = (typeof SAMPLE_PUZZLES)[0];

export function SetupGalleryThumbnail({
  puzzle,
  pieceCount,
  isSelected,
  isLoading,
  onSelect,
}: {
  puzzle: GalleryPuzzle;
  pieceCount: number;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      className={`${styles.galleryItem} ${isSelected ? styles.galleryItemSelected : ""}`}
      onClick={onSelect}
      disabled={isLoading}
      data-testid="gallery-item"
    >
      {imgError ? (
        <div className={styles.galleryItemPlaceholder} title="Image unavailable">
          ?
        </div>
      ) : (
        <img src={puzzle.thumbnail} alt={puzzle.name} onError={() => setImgError(true)} />
      )}
      <span className={styles.galleryItemMeta}>
        <span className={styles.galleryItemName}>{puzzle.name}</span>
        <span className={styles.galleryItemPieces}>
          <Puzzle size={12} />
          {pieceCount} pieces
        </span>
      </span>
    </button>
  );
}
