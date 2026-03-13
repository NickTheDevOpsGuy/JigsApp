/**
 * Image source tabs (Gallery / Upload / Camera) and panel content for SetupScreen.
 */
import { Camera, ChevronLeft, ChevronRight, Image, Link2, Upload } from "lucide-react";
import { CATEGORIES } from "@/data/packs/samplePuzzles";
import { CameraCapture } from "./CameraCapture";
import { SetupGalleryThumbnail } from "./SetupGalleryThumbnail";
import type { ImageSource } from "../setupScreenConstants";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";

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
  imageUrlInput: string;
  setImageUrlInput: (value: string) => void;
  onImportUrl: () => void;
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
  imageUrlInput,
  setImageUrlInput,
  onImportUrl,
  setFromBlob,
  styles,
}: SetupImageSourcePanelProps) {
  const scrollGalleryByCards = (direction: -1 | 1) => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const firstCard = gallery.querySelector<HTMLElement>("button");
    const cardWidth = firstCard?.offsetWidth ?? 96;
    const gap = Number.parseFloat(getComputedStyle(gallery).columnGap || "8") || 8;
    const pitch = Math.max(1, Math.round(cardWidth + gap));
    const step = pitch * 2;
    const maxScroll = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    const rawTarget = gallery.scrollLeft + direction * step;
    const snappedTarget = Math.round(rawTarget / pitch) * pitch;
    const clamped = Math.max(0, Math.min(maxScroll, snappedTarget));
    gallery.scrollTo({ left: clamped, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Image source">
        <button
          role="tab"
          aria-selected={imageSource === "gallery"}
          aria-controls="image-source-panel"
          className={`${styles.tab} ${imageSource === "gallery" ? styles.tabActive : ""}`}
          onClick={() => setImageSource("gallery")}
          title="Choose from gallery"
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
          title="Upload your own image"
        >
          <Upload size={16} />
          Upload
        </button>
        <button
          role="tab"
          aria-selected={imageSource === "url"}
          aria-controls="image-source-panel"
          className={`${styles.tab} ${imageSource === "url" ? styles.tabActive : ""}`}
          onClick={() => setImageSource("url")}
          title="Import an image from a URL"
        >
          <Link2 size={16} />
          URL
        </button>
        <button
          role="tab"
          aria-selected={imageSource === "camera"}
          aria-controls="image-source-panel"
          className={`${styles.tab} ${imageSource === "camera" ? styles.tabActive : ""}`}
          onClick={() => setImageSource("camera")}
          title="Take a photo"
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
                  title={`Filter by ${cat.name}`}
                  aria-label={`Filter by ${cat.name}`}
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
                title="Scroll gallery left"
                disabled={!canScrollLeft}
                onClick={() => scrollGalleryByCards(-1)}
              >
                <ChevronLeft size={18} />
              </button>

              <div
                ref={galleryRef}
                className={`${styles.gallery} ${styles.galleryWithButtons}`}
                role="list"
              >
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
                title="Scroll gallery right"
                disabled={!canScrollRight}
                onClick={() => scrollGalleryByCards(1)}
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
              title="Choose a photo file (PNG, JPG, or WebP)"
              className={styles.file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPickFile}
              disabled={isLoading}
            />
          </label>
        ) : imageSource === "url" ? (
          <div className={styles.urlImportPanel}>
            <label className={styles.label} htmlFor="setup-image-url">
              Paste direct image URL
            </label>
            <div className={styles.urlInputRow}>
              <input
                id="setup-image-url"
                className={styles.urlInput}
                type="url"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="https://example.com/puzzle.jpg"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onImportUrl();
                  }
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.urlImportButton}
                onClick={() => void onImportUrl()}
                disabled={isLoading || !imageUrlInput.trim()}
              >
                Import
              </button>
            </div>
            <p className={styles.urlHelp}>
              Use a public PNG, JPG, or WebP link. Some sites block direct image fetches.
            </p>
          </div>
        ) : (
          <CameraCapture onCapture={setFromBlob} disabled={isLoading} />
        )}
      </div>
    </>
  );
}
