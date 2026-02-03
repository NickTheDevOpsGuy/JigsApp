// src/app/screens/Setup/SetupScreen.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupScreen.module.css";
import { SAMPLE_PUZZLES, CATEGORIES } from "@/data/samplePuzzles";
import { Button } from "@/components/Button/Button";
import { Dropdown } from "@/components/DropDown/Dropdown";
import { ArrowLeft, Trash2, Play } from "lucide-react";
import { useImagePicker, useGridConfig, GRID_OPTIONS } from "./hooks";

const STORAGE_KEY = "phuzzle:imageDataUrl";

type ImageSource = "upload" | "gallery";

export function SetupScreen() {
  const nav = useNavigate();
  const [imageSource, setImageSource] = useState<ImageSource>("gallery");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    imgDataUrl,
    setImgDataUrl,
    error,
    isLoading,
    selectedPuzzle,
    clearError,
    selectGalleryPuzzle,
    pickFile,
    clearImage,
  } = useImagePicker();

  const {
    gridIndex,
    setGridIndex,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    isCustom,
    saveGrid,
    minGrid,
    maxGrid,
  } = useGridConfig();

  // Load existing image on mount
  useEffect(() => {
    const existingImg = localStorage.getItem(STORAGE_KEY);
    if (existingImg) setImgDataUrl(existingImg);
  }, [setImgDataUrl]);

  const filteredPuzzles =
    selectedCategory === "all"
      ? SAMPLE_PUZZLES
      : SAMPLE_PUZZLES.filter((p) => p.category === selectedCategory);

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await pickFile(file);
    if (!success) e.currentTarget.value = "";
  };

  const handleStart = () => {
    if (!imgDataUrl) return;

    try {
      localStorage.setItem(STORAGE_KEY, imgDataUrl);
      saveGrid();
      nav("/play");
    } catch {
      console.error("Could not save to localStorage");
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    clearImage();
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>New Puzzle</h1>

        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button className={styles.errorClose} onClick={clearError}>
              ×
            </button>
          </div>
        )}

        {/* Image source tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${imageSource === "gallery" ? styles.tabActive : ""}`}
            onClick={() => setImageSource("gallery")}
          >
            Gallery
          </button>
          <button
            className={`${styles.tab} ${imageSource === "upload" ? styles.tabActive : ""}`}
            onClick={() => setImageSource("upload")}
          >
            Upload
          </button>
        </div>

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

            <div className={styles.gallery}>
              {filteredPuzzles.length === 0 ? (
                <div className={styles.galleryEmpty}>No puzzles in this category yet</div>
              ) : (
                filteredPuzzles.map((puzzle) => (
                  <button
                    key={puzzle.id}
                    className={`${styles.galleryItem} ${selectedPuzzle?.id === puzzle.id ? styles.galleryItemSelected : ""}`}
                    onClick={() => selectGalleryPuzzle(puzzle)}
                    disabled={isLoading}
                  >
                    <img src={puzzle.thumbnail} alt={puzzle.name} />
                    <span className={styles.galleryItemName}>{puzzle.name}</span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <label className={styles.label}>
            Choose a Photo (PNG/JPG/WebP)
            <input
              className={styles.file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePickFile}
              disabled={isLoading}
            />
          </label>
        )}

        <Dropdown
          label="Difficulty"
          value={gridIndex}
          onChange={(val) => setGridIndex(Number(val))}
          options={GRID_OPTIONS.map((opt, i) => ({
            value: i,
            label:
              opt.rows > 0
                ? opt.label
                : `Custom (${customRows}×${customCols} – ${customRows * customCols} pieces)`,
          }))}
          fullWidth
        />

        {isCustom && (
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
        )}

        <div className={styles.preview}>
          {isLoading ? (
            <div className={styles.previewEmpty}>Loading...</div>
          ) : imgDataUrl ? (
            <img className={styles.previewImg} src={imgDataUrl} alt="Preview" />
          ) : (
            <div className={styles.previewEmpty}>Select an image above</div>
          )}
        </div>

        <div className={styles.row}>
          <Button onClick={() => nav("/")}>
            <ArrowLeft size={18} />
            Back
          </Button>

          <Button onClick={handleClear} disabled={isLoading}>
            <Trash2 size={18} />
            Clear
          </Button>

          <Button
            variant="primary"
            onClick={handleStart}
            disabled={isLoading || !imgDataUrl}
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
