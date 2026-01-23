// src/app/screens/Setup/SetupScreen.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SetupScreen.module.css";

const STORAGE_KEY = "phuzzle:imageDataUrl";
const GRID_KEY = "phuzzle:gridSize";

// Minimum image dimensions for a playable puzzle
const MIN_IMAGE_SIZE = 200;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type GridOption = {
  label: string;
  rows: number;
  cols: number;
};

const GRID_OPTIONS: GridOption[] = [
  { label: "Easy (3×3 - 9 pieces)", rows: 3, cols: 3 },
  { label: "Medium (4×4 - 16 pieces)", rows: 4, cols: 4 },
  { label: "Hard (5×5 - 25 pieces)", rows: 5, cols: 5 },
  { label: "Expert (6×6 - 36 pieces)", rows: 6, cols: 6 },
];

export function SetupScreen() {
  const nav = useNavigate();
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [gridIndex, setGridIndex] = useState(1); // Default to Medium
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const existingImg = localStorage.getItem(STORAGE_KEY);
    if (existingImg) setImgDataUrl(existingImg);

    const existingGrid = localStorage.getItem(GRID_KEY);
    if (existingGrid) {
      const idx = GRID_OPTIONS.findIndex((g) => `${g.rows}x${g.cols}` === existingGrid);
      if (idx >= 0) setGridIndex(idx);
    }
  }, []);

  function clearError() {
    setError(null);
  }

  function validateImageDimensions(
    dataUrl: string,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image. The file may be corrupted."));
      };

      img.src = dataUrl;
    });
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    clearError();
    setIsLoading(true);

    try {
      // Check file type
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Please choose a PNG, JPG, or WebP image.");
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(
          `Image is too large (${sizeMB}MB). Please choose one under 10MB.`,
        );
      }

      // Read file as data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string" || !result.startsWith("data:image/")) {
            reject(new Error("Could not read file as an image."));
            return;
          }
          resolve(result);
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file. Please try another image."));
        };

        reader.readAsDataURL(file);
      });

      // Validate image dimensions
      const { width, height } = await validateImageDimensions(dataUrl);

      if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
        throw new Error(
          `Image is too small (${width}×${height}px). Please use an image at least ${MIN_IMAGE_SIZE}×${MIN_IMAGE_SIZE}px.`,
        );
      }

      // Check if image is very small for higher difficulties
      const selected = GRID_OPTIONS[gridIndex];
      const minForGrid = selected.cols * 50; // At least 50px per piece
      if (width < minForGrid || height < minForGrid) {
        // Just warn, don't block
        console.warn(`Image may be too small for ${selected.label} difficulty`);
      }

      setImgDataUrl(dataUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load image.";
      setError(message);
      e.currentTarget.value = "";
    } finally {
      setIsLoading(false);
    }
  }

  function onStart() {
    if (!imgDataUrl) {
      setError("Please select an image first.");
      return;
    }

    const selected = GRID_OPTIONS[gridIndex];

    try {
      localStorage.setItem(STORAGE_KEY, imgDataUrl);
      localStorage.setItem(GRID_KEY, `${selected.rows}x${selected.cols}`);
      nav("/play");
    } catch (_err) {
      // localStorage might be full or disabled
      setError("Could not save image. Try a smaller image or clear browser storage.");
    }
  }

  function onClear() {
    localStorage.removeItem(STORAGE_KEY);
    setImgDataUrl(null);
    clearError();
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>New Game</h1>

        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button className={styles.errorClose} onClick={clearError}>
              ×
            </button>
          </div>
        )}

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

        <label className={styles.label}>
          Difficulty
          <select
            className={styles.select}
            value={gridIndex}
            onChange={(e) => setGridIndex(Number(e.target.value))}
          >
            {GRID_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.preview}>
          {isLoading ? (
            <div className={styles.previewEmpty}>Loading...</div>
          ) : imgDataUrl ? (
            <img className={styles.previewImg} src={imgDataUrl} alt="Preview" />
          ) : (
            <div className={styles.previewEmpty}>Image Preview</div>
          )}
        </div>

        <div className={styles.row}>
          <button className={styles.secondary} onClick={() => nav("/")}>
            Back
          </button>

          <button
            className={styles.secondary}
            onClick={onClear}
            type="button"
            disabled={isLoading}
          >
            Clear
          </button>

          <button
            className={styles.primary}
            onClick={onStart}
            disabled={isLoading || !imgDataUrl}
          >
            Start New Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetupScreen;
