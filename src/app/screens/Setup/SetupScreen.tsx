/**
 * SetupScreen – image picker (gallery/upload/camera), grid config, time mode, launch to Play.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./SetupScreen.module.css";
import { SAMPLE_PUZZLES, CATEGORIES } from "@/data/samplePuzzles";
import { setCurrentPuzzleId } from "@/data/packCompletion";
import { Button } from "@/components/Button/Button";
import { Dropdown } from "@/components/DropDown/Dropdown";
import {
  ArrowLeft,
  Trash2,
  Play,
  Camera,
  ChevronLeft,
  ChevronRight,
  Image,
  Upload,
} from "lucide-react";
import { useImagePicker, useGridConfig, GRID_OPTIONS } from "./hooks";
import { CameraCapture } from "./components/CameraCapture";
import { useTimeModeConfig } from "../Play/hooks/useTimeModeConfig";
import { COUNTDOWN_OPTIONS, getBestTime, type TimeMode } from "../Play/timeMode";
import { getAdaptiveSuggestion } from "@/services/adaptiveDifficultyService";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const TIME_MODE_LABELS: Record<TimeMode, string> = {
  elapsed: "Elapsed",
  countdown: "Countdown",
  active: "Active only",
  relaxed: "Relaxed (no timer)",
  best: "Best time",
  speedrun: "Speedrun (quadrants)",
};

const STORAGE_KEY = "phuzzle:imageDataUrl";

type ImageSource = "gallery" | "upload" | "camera";

function GalleryThumbnail({
  puzzle,
  isSelected,
  isLoading,
  onSelect,
}: {
  puzzle: (typeof SAMPLE_PUZZLES)[0];
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
      <span className={styles.galleryItemName}>{puzzle.name}</span>
    </button>
  );
}

export function SetupScreen() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceParam = searchParams.get("source");
  const puzzleIdParam = searchParams.get("puzzle");
  const [imageSource, setImageSource] = useState<ImageSource>(
    sourceParam === "camera" ? "camera" : sourceParam === "upload" ? "upload" : "gallery",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    gridIndex,
    setGridIndex,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    isCustom,
    effectiveRows,
    effectiveCols,
    saveGrid,
    minGrid,
    maxGrid,
  } = useGridConfig();

  const {
    imgDataUrl,
    setImgDataUrl,
    error,
    setError,
    isLoading,
    selectedPuzzle,
    clearError,
    selectGalleryPuzzle,
    pickFile,
    setFromBlob,
    clearImage,
    validateBeforeStart,
  } = useImagePicker({
    gridRows: effectiveRows,
    gridCols: effectiveCols,
  });

  const { timeMode, setTimeMode, countdownMinutes, setCountdownMinutes } =
    useTimeModeConfig();

  const suggestedGrid = useMemo(() => getAdaptiveSuggestion(getBestTime), []);
  const isMobile = useMediaQuery("(max-width: 520px)");
  const filteredPuzzles =
    selectedCategory === "all"
      ? SAMPLE_PUZZLES
      : SAMPLE_PUZZLES.filter((p) => p.category === selectedCategory);
  const previewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;
      const hasOverflow = maxScroll > 8;
      setCanScrollLeft(hasOverflow && scrollLeft > 4);
      setCanScrollRight(hasOverflow && scrollLeft < maxScroll - 4);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    setTimeout(update, 100);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [filteredPuzzles.length, selectedCategory]);

  // Scroll preview into view when image is selected
  useEffect(() => {
    if (imgDataUrl && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [imgDataUrl]);

  // Load existing image on mount
  useEffect(() => {
    const existingImg = localStorage.getItem(STORAGE_KEY);
    if (existingImg) setImgDataUrl(existingImg);
  }, [setImgDataUrl]);

  // Pre-select puzzle when navigating from pack (?puzzle=id)
  useEffect(() => {
    if (!puzzleIdParam) return;
    const puzzle = SAMPLE_PUZZLES.find((p) => p.id === puzzleIdParam);
    if (puzzle) {
      setImageSource("gallery");
      setSelectedCategory(puzzle.category);
      selectGalleryPuzzle(puzzle);
      setCurrentPuzzleId(puzzleIdParam);
    }
  }, [puzzleIdParam, selectGalleryPuzzle]);

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await pickFile(file);
    if (!success) e.currentTarget.value = "";
  };

  const handleStart = async () => {
    if (!imgDataUrl) return;

    const valid = await validateBeforeStart(effectiveRows, effectiveCols);
    if (!valid) return;

    try {
      localStorage.setItem(STORAGE_KEY, imgDataUrl);
      saveGrid();
      localStorage.removeItem("phuzzle:dailyDate");
      if (selectedPuzzle) setCurrentPuzzleId(selectedPuzzle.id);
      else setCurrentPuzzleId(null);
      nav("/play");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Could not save to localStorage", e);
      setError(msg || "Could not save. Please try again.");
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentPuzzleId(null);
    clearImage();
  };

  const isPackFlow = !!puzzleIdParam;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <h1 className={styles.title}>
            {isPackFlow && selectedPuzzle ? selectedPuzzle.name : "🧩 New Puzzle"}
          </h1>

          {error && (
            <div className={styles.error} role="alert">
              <span>{error}</span>
              <button
                type="button"
                className={styles.errorClose}
                onClick={clearError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Standard workflow: source tabs + gallery/upload/camera */}
          {!isPackFlow && (
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

              <div
                id="image-source-panel"
                className={styles.imageSourcePanel}
                role="tabpanel"
              >
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
                      {filteredPuzzles.length > 4 && (
                        <button
                          type="button"
                          className={styles.galleryScrollBtn}
                          onClick={() =>
                            galleryRef.current?.scrollBy({
                              left: -200,
                              behavior: "smooth",
                            })
                          }
                          disabled={!canScrollLeft}
                          aria-label="Scroll left"
                        >
                          <ChevronLeft size={24} />
                        </button>
                      )}
                      <div
                        className={`${styles.gallery} ${filteredPuzzles.length > 4 ? styles.galleryWithButtons : ""}`}
                        ref={galleryRef}
                        role="list"
                      >
                        {filteredPuzzles.length === 0 ? (
                          <div className={styles.galleryEmpty}>
                            No puzzles in this category yet
                          </div>
                        ) : (
                          filteredPuzzles.map((puzzle) => (
                            <GalleryThumbnail
                              key={puzzle.id}
                              puzzle={puzzle}
                              isSelected={selectedPuzzle?.id === puzzle.id}
                              isLoading={isLoading}
                              onSelect={() => selectGalleryPuzzle(puzzle)}
                            />
                          ))
                        )}
                      </div>
                      {filteredPuzzles.length > 4 && (
                        <button
                          type="button"
                          className={styles.galleryScrollBtn}
                          onClick={() =>
                            galleryRef.current?.scrollBy({
                              left: 200,
                              behavior: "smooth",
                            })
                          }
                          disabled={!canScrollRight}
                          aria-label="Scroll right"
                        >
                          <ChevronRight size={24} />
                        </button>
                      )}
                    </div>
                  </>
                ) : imageSource === "upload" ? (
                  <label className={styles.label}>
                    Choose a Photo (PNG/JPG/WebP)
                    <input
                      aria-label="Choose a photo (PNG, JPG, or WebP)"
                      className={styles.file}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePickFile}
                      disabled={isLoading}
                    />
                  </label>
                ) : (
                  <CameraCapture onCapture={setFromBlob} disabled={isLoading} />
                )}
              </div>
            </>
          )}

          <p className={styles.difficultySummary}>
            {effectiveRows * effectiveCols} pieces
            {isCustom ? " · Custom" : ` · ${GRID_OPTIONS[gridIndex].label.split(" ")[0]}`}
          </p>
          {suggestedGrid &&
            gridIndex !== suggestedGrid.gridIndex &&
            suggestedGrid.gridIndex < GRID_OPTIONS.length - 1 && (
            <button
              type="button"
              className={styles.difficultySuggestion}
              onClick={() => setGridIndex(suggestedGrid.gridIndex)}
            >
              {suggestedGrid.hint}
            </button>
          )}
          <div className={styles.configGrid}>
            <Dropdown
              label="Difficulty"
              compact={isMobile}
              value={gridIndex}
              onChange={(val: string) => setGridIndex(Number(val))}
              options={GRID_OPTIONS.map((opt, i) => ({
                value: i,
                label:
                  opt.rows > 0
                    ? isMobile && opt.labelIcon
                      ? opt.labelIcon
                      : isMobile && opt.labelShort
                        ? opt.labelShort
                        : opt.label
                    : isMobile
                      ? `Custom ${customRows}×${customCols} (${customRows * customCols} pieces)`
                      : `Custom (${customRows}×${customCols} – ${customRows * customCols} pieces)`,
              }))}
              fullWidth
            />

            <Dropdown
              label="Time mode"
              compact={isMobile}
              value={timeMode}
              onChange={(val: string) => setTimeMode(val as TimeMode)}
              options={(
                ["elapsed", "countdown", "active", "relaxed", "best", "speedrun"] as TimeMode[]
              ).map((m) => ({ value: m, label: TIME_MODE_LABELS[m] }))}
              fullWidth
            />

            {timeMode === "countdown" && (
              <Dropdown
                label="Countdown"
                compact={isMobile}
                value={countdownMinutes}
                onChange={(val: string) => setCountdownMinutes(Number(val))}
                options={COUNTDOWN_OPTIONS.map((m) => ({
                  value: m,
                  label: `${m} min`,
                }))}
                fullWidth
              />
            )}
          </div>

          {isCustom && (
            <div>
              <div className={styles.customGrid}>
                <label className={styles.customGridLabel}>
                  Rows
                  <input
                    type="number"
                    min={minGrid}
                    max={maxGrid}
                    value={customRows}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setCustomRows(
                        isNaN(v) ? minGrid : Math.min(maxGrid, Math.max(minGrid, v)),
                      );
                    }}
                    className={styles.customGridInput}
                  />
                </label>
                <span className={styles.customGridTimes}>×</span>
                <label className={styles.customGridLabel}>
                  Cols
                  <input
                    type="number"
                    min={minGrid}
                    max={maxGrid}
                    value={customCols}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setCustomCols(
                        isNaN(v) ? minGrid : Math.min(maxGrid, Math.max(minGrid, v)),
                      );
                    }}
                    className={styles.customGridInput}
                  />
                </label>
              </div>
              {customRows * customCols >= 81 && (
                <p className={styles.customGridHint}>
                  Larger puzzles may run slower on some devices.
                </p>
              )}
            </div>
          )}

          <div className={styles.preview} ref={previewRef}>
            {isLoading ? (
              <div className={styles.previewEmpty}>Loading...</div>
            ) : imgDataUrl ? (
              <img className={styles.previewImg} src={imgDataUrl} alt="Preview" />
            ) : (
              <div className={styles.previewEmpty}>Select an image above</div>
            )}
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button onClick={() => nav("/")} aria-label="Back to menu">
            <ArrowLeft size={18} />
            Back
          </Button>

          <Button onClick={handleClear} disabled={isLoading} aria-label="Clear image">
            <Trash2 size={18} />
            Clear
          </Button>

          <Button
            variant="primary"
            onClick={handleStart}
            disabled={isLoading || !imgDataUrl}
            aria-label="Start puzzle"
          >
            <Play size={18} />
            Start Puzzle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SetupScreen;
