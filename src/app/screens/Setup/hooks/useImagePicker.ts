/**
 * useImagePicker – file input, paste, camera; validates dimensions per grid size.
 */
import { useState } from "react";
import type { SamplePuzzle } from "@/data/packs/samplePuzzles";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB – high-res phone/camera/DSLR
const VALID_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/** Min pixels per piece edge for readable puzzle pieces. */
const MIN_PX_PER_PIECE = 45;

/** Resolution rules per grid size: 3x3-4x4 allow smaller, 5x5-6x6 medium, 7x7+ require higher. */
function getMinDimensionForGrid(rows: number, cols: number): number {
  const maxDim = Math.max(rows, cols);
  if (maxDim <= 4) return 160;
  if (maxDim <= 6) return Math.max(280, maxDim * MIN_PX_PER_PIECE);
  return Math.max(400, maxDim * MIN_PX_PER_PIECE);
}

export type ImageValidationResult =
  | { ok: true; width: number; height: number }
  | { ok: false; error: string; suggestion?: string };

function validateImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        reject(
          new Error(
            "Image could not be loaded. Try a different image or format (PNG, JPG, WebP).",
          ),
        );
      }
    };
    img.onerror = () =>
      reject(
        new Error(
          "Could not load that image. Try a different file or format (PNG, JPG, WebP).",
        ),
      );
    img.src = dataUrl;
  });
}

export function validateImageForGrid(
  dataUrl: string,
  rows: number,
  cols: number,
): Promise<ImageValidationResult> {
  return validateImageDimensions(dataUrl).then(
    ({ width, height }) => {
      const minDim = getMinDimensionForGrid(rows, cols);
      const minSide = Math.min(width, height);
      if (minSide < minDim) {
        const suggestion =
          rows * cols >= 49
            ? "Try a smaller grid (e.g. 5×5 or 6×6) for better results."
            : undefined;
        return {
          ok: false,
          error: `Image is too small (${width}×${height}px) for a ${rows}×${cols} puzzle. Need at least ${minDim}×${minDim}px, or try a smaller grid.`,
          suggestion,
        };
      }
      return { ok: true, width, height };
    },
    (err) => ({
      ok: false,
      error: err instanceof Error ? err.message : "Could not load image. Try another.",
    }),
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result.startsWith("data:image/")) {
        reject(new Error("Could not read that file as an image. Try PNG, JPG, or WebP."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () =>
      reject(new Error("Could not read file. Try a different image."));
    reader.readAsDataURL(file);
  });
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

export type UseImagePickerOptions = {
  gridRows?: number;
  gridCols?: number;
};

export function useImagePicker(options: UseImagePickerOptions = {}) {
  const { gridRows = 4, gridCols = 4 } = options;
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);

  const clearError = () => setError(null);

  const selectGalleryPuzzle = (puzzle: SamplePuzzle) => {
    setSelectedPuzzle(puzzle);
    clearError();
    setImgDataUrl(puzzle.fullImage);
  };

  const setFromBlob = async (blob: Blob): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    setSelectedPuzzle(null);

    try {
      const dataUrl = await readBlobAsDataUrl(blob);
      const result = await validateImageForGrid(dataUrl, gridRows, gridCols);

      if (!result.ok) {
        const msg = result.suggestion
          ? `${result.error} ${result.suggestion}`
          : result.error;
        throw new Error(msg);
      }

      setImgDataUrl(dataUrl);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load image. Try another.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFile = async (file: File): Promise<boolean> => {
    clearError();
    setIsLoading(true);
    setSelectedPuzzle(null);

    try {
      if (!VALID_TYPES.includes(file.type)) {
        throw new Error(
          "Please choose a PNG, JPG, or WebP image. Other formats are not supported.",
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(
          `Image is too large (${sizeMB}MB). Please choose one under 50MB, or try a smaller/resized version.`,
        );
      }

      const dataUrl = await readFileAsDataUrl(file);
      const result = await validateImageForGrid(dataUrl, gridRows, gridCols);

      if (!result.ok) {
        const msg = result.suggestion
          ? `${result.error} ${result.suggestion}`
          : result.error;
        throw new Error(msg);
      }

      setImgDataUrl(dataUrl);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load image. Try another.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImgDataUrl(null);
    setSelectedPuzzle(null);
    clearError();
  };

  /** Validate current image for the given grid before starting. Sets error and returns false if invalid. */
  const validateBeforeStart = async (rows: number, cols: number): Promise<boolean> => {
    if (!imgDataUrl) {
      setError("No image selected. Choose one from the gallery, upload, or camera.");
      return false;
    }
    const result = await validateImageForGrid(imgDataUrl, rows, cols);
    if (!result.ok) {
      setError(result.suggestion ? `${result.error} ${result.suggestion}` : result.error);
      return false;
    }
    return true;
  };

  return {
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
  };
}
