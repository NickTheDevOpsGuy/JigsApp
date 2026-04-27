/**
 * colorUtils – average color sampling from piece regions for tray sorting.
 */
import type { Piece, GridSize } from "@/puzzle/core/types";

export type ColorInfo = {
  r: number;
  g: number;
  b: number;
  hue: number;
  saturation: number;
  lightness: number;
};

const DEFAULT_SAMPLE_SIZE = 24;

function fallbackColor(): ColorInfo {
  return { r: 128, g: 128, b: 128, hue: 0, saturation: 0, lightness: 0.5 };
}

/**
 * Get the average color of a puzzle piece from the source image.
 * Uses an offscreen canvas to sample the piece's region.
 */
export function getAverageColor(
  img: HTMLImageElement,
  piece: Piece,
  grid: GridSize,
): ColorInfo {
  return createAverageColorSampler(img, grid)(piece);
}

export function createAverageColorSampler(
  img: HTMLImageElement,
  grid: GridSize,
  sampleSize: number = DEFAULT_SAMPLE_SIZE,
): (piece: Piece) => ColorInfo {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const size = Math.max(8, Math.min(32, Math.floor(sampleSize)));
  canvas.width = size;
  canvas.height = size;

  if (!ctx || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return () => fallbackColor();
  }

  const srcTileW = img.naturalWidth / grid.cols;
  const srcTileH = img.naturalHeight / grid.rows;

  return (piece: Piece): ColorInfo => {
    const srcX = piece.col * srcTileW;
    const srcY = piece.row * srcTileH;

    let imageData: ImageData;
    try {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, srcX, srcY, srcTileW, srcTileH, 0, 0, size, size);
      imageData = ctx.getImageData(0, 0, size, size);
    } catch {
      return fallbackColor();
    }
    const data = imageData.data;

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let count = 0;

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      count++;
    }

    if (count === 0) {
      return fallbackColor();
    }

    const r = Math.round(totalR / count);
    const g = Math.round(totalG / count);
    const b = Math.round(totalB / count);

    const hsl = rgbToHsl(r, g, b);

    return {
      r,
      g,
      b,
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l,
    };
  };
}

/**
 * Convert RGB (0-255) to HSL (h: 0-360, s: 0-1, l: 0-1)
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    // Achromatic
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

/**
 * Get a CSS color string from RGB values
 */
export function rgbToCss(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}
