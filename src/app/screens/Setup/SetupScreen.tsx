// src/app/screens/Setup/SetupScreen.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupScreen.module.css";
import { SAMPLE_PUZZLES, CATEGORIES } from "@/data/samplePuzzles";
import { Button } from "@/components/Button/Button";
import { Dropdown } from "@/components/DropDown/Dropdown";
import { ArrowLeft, Trash2, Play } from "lucide-react";
import { useImageSelection, useGridSettings } from "./hooks";

const STORAGE_KEY = "phuzzle:imageDataUrl";

export function SetupScreen() {
  const nav = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    imgDataUrl,
    setImgDataUrl,
    error,
    isLoading,
    imageSource,
    setImageSource,
    selectedPuzzle,
    clearError,
    clearImage,
    selectGalleryPuzzle,
    handleFileSelect,
  } = useImageSelection();

  const { gridIndex, setGridIndex, selectedGrid, gridOptions, saveGrid } =
    useGridSettings();

  // Load existing image on mount
  useEffect(() => {
    const existingImg = localStorage.getItem(STORAGE_KEY);
    if (existingImg) setImgDataUrl(existingImg);
  }, [setImgDataUrl]);

  const filteredPuzzles =
    selectedCategory === "all"
      ? SAMPLE_PUZZLES
      : SAMPLE_PUZZLES.filter((p) => p.category === selectedCategory);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    handleFileSelect(file, selectedGrid.cols).then((success) => {
      if (!success) e.currentTarget.value = "";
    });
  }

  function onStart() {
    if (!imgDataUrl) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, imgDataUrl);
      saveGrid();
      nav("/play");
    } catch {
      // localStorage might be full or disabled
      console.error("Could not save image to localStorage");
    }
  }

  function onClear() {
    localStorage.removeItem(STORAGE_KEY);
    clearImage();
  }

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
            {/* Category filter */}
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

            {/* Gallery grid */}
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
              onChange={onPickFile}
              disabled={isLoading}
            />
          </label>
        )}

        <Dropdown
          label="Difficulty"
          value={gridIndex}
          onChange={(val) => setGridIndex(Number(val))}
          options={gridOptions.map((opt, i) => ({
            value: i,
            label: opt.label,
          }))}
          fullWidth
        />

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

          <Button onClick={onClear} disabled={isLoading}>
            <Trash2 size={18} />
            Clear
          </Button>

          <Button variant="primary" onClick={onStart} disabled={isLoading || !imgDataUrl}>
            <Play size={18} />
            Start Puzzle
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SetupScreen;
