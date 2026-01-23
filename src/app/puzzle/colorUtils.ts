// src/app/puzzle/colorUtils.ts
import type { Piece, GridSize } from "./types";

export type ColorInfo = {
  r: number;
  g: number;
  b: number;
  hue: number;
  saturation: number;
  lightness: number;
};

/**
 * Get the average color of a puzzle piece from the source image.
 * Uses an offscreen canvas to sample the piece's region.
 */
export function getAverageColor(
  img: HTMLImageElement,
  piece: Piece,
  grid: GridSize,
): ColorInfo {
  // Create offscreen canvas for sampling
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return { r: 128, g: 128, b: 128, hue: 0, saturation: 0, lightness: 0.5 };
  }

  // Calculate the source region for this piece
  const srcTileW = img.naturalWidth / grid.cols;
  const srcTileH = img.naturalHeight / grid.rows;

  const srcX = piece.col * srcTileW;
  const srcY = piece.row * srcTileH;

  // Sample at a reasonable resolution (not too large)
  const sampleSize = 32;
  canvas.width = sampleSize;
  canvas.height = sampleSize;

  // Draw the piece's region scaled down
  ctx.drawImage(img, srcX, srcY, srcTileW, srcTileH, 0, 0, sampleSize, sampleSize);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
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
    return { r: 128, g: 128, b: 128, hue: 0, saturation: 0, lightness: 0.5 };
  }

  const r = Math.round(totalR / count);
  const g = Math.round(totalG / count);
  const b = Math.round(totalB / count);

  // Convert to HSL for sorting
  const hsl = rgbToHsl(r, g, b);

  return {
    r,
    g,
    b,
    hue: hsl.h,
    saturation: hsl.s,
    lightness: hsl.l,
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
