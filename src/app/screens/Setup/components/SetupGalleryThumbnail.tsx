/**
 * Gallery thumbnail for sample puzzle in SetupScreen.
 * No text overlay on the image so the picture is easy to see on mobile.
 */
import { useState } from "react";
import { SAMPLE_PUZZLES } from "@/data/packs/samplePuzzles";
import styles from "@/screens/Setup/styles/SetupScreen.module.css";

type GalleryPuzzle = (typeof SAMPLE_PUZZLES)[0];

export function SetupGalleryThumbnail({
  puzzle,
  pieceCount,
  isSelected,
  isLoading,
  eagerLoad = false,
  onSelect,
}: {
  puzzle: GalleryPuzzle;
  pieceCount: number;
  isSelected: boolean;
  isLoading: boolean;
  eagerLoad?: boolean;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      type="button"
      className={`${styles.galleryItem} ${isSelected ? styles.galleryItemSelected : ""}`}
      onClick={onSelect}
      disabled={isLoading}
      data-testid="gallery-item"
      title={`Select ${puzzle.name}`}
      aria-label={`Select ${puzzle.name}, ${pieceCount} pieces`}
    >
      {imgError ? (
        <div className={styles.galleryItemPlaceholder} title="Image unavailable">
          ?
        </div>
      ) : (
        <img
          src={puzzle.thumbnail}
          alt={puzzle.name}
          loading={eagerLoad ? "eager" : "lazy"}
          decoding="async"
          onError={() => setImgError(true)}
        />
      )}
    </button>
  );
}
