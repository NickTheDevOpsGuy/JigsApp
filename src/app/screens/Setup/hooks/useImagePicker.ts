import { useState } from "react";
import type { SamplePuzzle } from "@/data/samplePuzzles";

const MIN_IMAGE_SIZE = 200;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function validateImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () =>
      reject(new Error("Failed to load image. The file may be corrupted."));
    img.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result.startsWith("data:image/")) {
        reject(new Error("Could not read file as an image."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () =>
      reject(new Error("Failed to read file. Please try another image."));
    reader.readAsDataURL(file);
  });
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

export function useImagePicker() {
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState<SamplePuzzle | null>(null);

  const clearError = () => setError(null);

  const selectGalleryPuzzle = async (puzzle: SamplePuzzle) => {
    setSelectedPuzzle(puzzle);
    clearError();
    setIsLoading(true);

    try {
      const response = await fetch(puzzle.fullImage);
      if (!response.ok) throw new Error("Failed to load image");

      const blob = await response.blob();
      const dataUrl = await readBlobAsDataUrl(blob);
      setImgDataUrl(dataUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load image.";
      setError(message);
      setSelectedPuzzle(null);
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
        throw new Error("Please choose a PNG, JPG, or WebP image.");
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(
          `Image is too large (${sizeMB}MB). Please choose one under 10MB.`,
        );
      }

      const dataUrl = await readFileAsDataUrl(file);
      const { width, height } = await validateImageDimensions(dataUrl);

      if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
        throw new Error(
          `Image is too small (${width}×${height}px). Please use an image at least ${MIN_IMAGE_SIZE}×${MIN_IMAGE_SIZE}px.`,
        );
      }

      setImgDataUrl(dataUrl);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load image.";
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

  return {
    imgDataUrl,
    setImgDataUrl,
    error,
    isLoading,
    selectedPuzzle,
    clearError,
    selectGalleryPuzzle,
    pickFile,
    clearImage,
  };
}
