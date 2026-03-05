/**
 * Image source tabs (Gallery / Upload / Camera) and panel content for SetupScreen.
 */
import { Camera, ChevronLeft, ChevronRight, Image, Upload } from "lucide-react";
import { CATEGORIES } from "@/data/samplePuzzles";
import { CameraCapture } from "./CameraCapture";
import { SetupGalleryThumbnail } from "./SetupGalleryThumbnail";
import type { ImageSource } from "../setupScreenConstants";
import type { SamplePuzzle } from "@/data/samplePuzzles";

interface SetupImageSourcePanelProps {
  imageSource: ImageSource;
  setImageSource: (s: ImageSource) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedPieceCount: number;
  filteredPuzzles: SamplePuzzle[];
  galleryRef: React.RefObject<HTMLDivElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  selectGalleryPuzzle: (puzzle: SamplePuzzle) => void;
  selectedPuzzle: SamplePuzzle | null;
  isLoading: boolean;
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFromBlob: (blob: Blob) => Promise<boolean>;
  styles: Record<string, string>;
}

export function SetupImageSourcePanel({
  imageSource,
  setImageSource,
  selectedCategory,
  setSelectedCategory,
  selectedPieceCount,
  filteredPuzzles,
  galleryRef,
  canScrollLeft,
  canScrollRight,
  selectGalleryPuzzle,
  selectedPuzzle,
  isLoading,
  onPickFile,
  setFromBlob,
  styles,
}: SetupImageSourcePanelProps) {
  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Image source">
        <button
          role="tab"
          aria-selected={imageSource === "gallery"}
          aria-controls="image-source-panel"
          className={`${styles.tab} ${imageSource === "gallery" ? styles.tabActive : ""}`}
          onClick={() => setImageSource("gallery")}
        >
          <Image size={16} />
          Gallery
        </button>
        <button
          role="tab"
          aria-selected={imageSource === "upload"}
          aria-controls="image-source-panel"
          className={`${styles.tab} ${imageSource === "upload" ? styles.tabActive : ""}`}
          onClick={() => setImageSource("upload")}
        >
          <Upload size={16} />
          Upload
        </button>
        <button
          role="tab"
          aria-selected={imageSource === "camera"}
          aria-controls="image-source-panel"
          className={`${styles.tab} ${imageSource === "camera" ? styles.tabActive : ""}`}
          onClick={() => setImageSource("camera")}
        >
          <Camera size={16} />
          Camera
        </button>
      </div>

      <div id="image-source-panel" className={styles.imageSourcePanel} role="tabpanel">
        {imageSource === "gallery" ? (
          <>
            <div className={styles.categories}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryBtn} ${selectedCategory === cat.id ? styles.categoryBtnActive : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className={styles.galleryWrap}>
              <button
                type="button"
                className={styles.galleryScrollBtn}
                aria-label="Scroll gallery left"
                disabled={!canScrollLeft}
                onClick={() =>
                  galleryRef.current?.scrollBy({ left: -220, behavior: "smooth" })
                }
              >
                <ChevronLeft size={18} />
              </button>

              <div ref={galleryRef} className={`${styles.gallery} ${styles.galleryWithButtons}`} role="list">
                {filteredPuzzles.length === 0 ? (
                  <div className={styles.galleryEmpty}>
                    No puzzles in this category yet
                  </div>
                ) : (
                  filteredPuzzles.map((puzzle) => (
                    <SetupGalleryThumbnail
                      key={puzzle.id}
                      puzzle={puzzle}
                      pieceCount={selectedPieceCount}
                      isSelected={selectedPuzzle?.id === puzzle.id}
                      isLoading={isLoading}
                      onSelect={() => selectGalleryPuzzle(puzzle)}
                    />
                  ))
                )}
              </div>

              <button
                type="button"
                className={styles.galleryScrollBtn}
                aria-label="Scroll gallery right"
                disabled={!canScrollRight}
                onClick={() =>
                  galleryRef.current?.scrollBy({ left: 220, behavior: "smooth" })
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        ) : imageSource === "upload" ? (
          <label className={styles.label}>
            Choose photo (PNG, JPG, WebP)
            <input
              aria-label="Choose a photo (PNG, JPG, or WebP)"
              className={styles.file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPickFile}
              disabled={isLoading}
            />
          </label>
        ) : (
          <CameraCapture onCapture={setFromBlob} disabled={isLoading} />
        )}
      </div>
    </>
  );
}
