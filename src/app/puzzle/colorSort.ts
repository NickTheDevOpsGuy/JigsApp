// src/app/puzzle/colorSort.ts
import type { Piece } from "./types";

type RGB = [number, number, number];
type HSL = [number, number, number];

/**
 * Extract dominant color from a piece by sampling the image region.
 * Returns HSL for better sorting (hue gives natural color grouping).
 */
export function extractPieceColor(
  piece: Piece,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
): HSL {
  const canvas = document.createElement("canvas");
  const size = 32; // Sample at small size for performance
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return [0, 0, 50]; // Default gray

  // Calculate source region (same logic as renderBoard)
  const sourceW = img.naturalWidth;
  const sourceH = img.naturalHeight;
  const cols = Math.round(assembledW / piece.tileW);
  const rows = Math.round(assembledH / piece.tileH);
  const srcTileW = sourceW / cols;
  const srcTileH = sourceH / rows;

  const srcX = piece.col * srcTileW;
  const srcY = piece.row * srcTileH;

  // Draw piece region to canvas
  ctx.drawImage(img, srcX, srcY, srcTileW, srcTileH, 0, 0, size, size);

  // Sample pixels
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  let totalR = 0, totalG = 0, totalB = 0;
  let count = 0;

  // Sample center region (avoid edges which may have transparency)
  const margin = 4;
  for (let y = margin; y < size - margin; y++) {
    for (let x = margin; x < size - margin; x++) {
      const i = (y * size + x) * 4;
      const a = data[i + 3];
      if (a > 128) { // Only count non-transparent pixels
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        count++;
      }
    }
  }

  if (count === 0) return [0, 0, 50];

  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;

  return rgbToHsl(avgR, avgG, avgB);
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l * 100]; // Achromatic (gray)
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

  return [h * 360, s * 100, l * 100];
}

/**
 * Sort pieces by color (hue-based grouping).
 * Groups by hue buckets, then sorts by lightness within each bucket.
 */
export function sortPiecesByColor(
  pieces: Piece[],
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
): Piece[] {
  // Extract colors for all pieces
  const withColors = pieces.map((piece) => ({
    piece,
    hsl: extractPieceColor(piece, img, assembledW, assembledH),
  }));

  // Sort by hue (with gray/neutral colors at the end), then by lightness
  withColors.sort((a, b) => {
    const [hA, sA, lA] = a.hsl;
    const [hB, sB, lB] = b.hsl;

    // Low saturation = grayscale, put at end
    const isGrayA = sA < 15;
    const isGrayB = sB < 15;

    if (isGrayA && !isGrayB) return 1;
    if (!isGrayA && isGrayB) return -1;
    if (isGrayA && isGrayB) {
      // Both gray, sort by lightness
      return lA - lB;
    }

    // Sort by hue (in 30° buckets for grouping similar colors)
    const hueBucketA = Math.floor(hA / 30);
    const hueBucketB = Math.floor(hB / 30);

    if (hueBucketA !== hueBucketB) {
      return hueBucketA - hueBucketB;
    }

    // Within same hue bucket, sort by lightness
    return lA - lB;
  });

  return withColors.map((wc) => wc.piece);
}