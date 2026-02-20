/**
 * dominantColors – extract 2–3 primary colors from puzzle image for gradient background.
 * Sampled at corners + center to keep it fast on mobile.
 */
import { rgbToCss } from "./colorUtils";

export type DominantColors = {
  colors: [string, string, string];
};

const SAMPLE_SIZE = 32;

/**
 * Sample a region of the image and return average RGB.
 */
function sampleRegion(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): { r: number; g: number; b: number } {
  ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (count === 0) return { r: 128, g: 128, b: 128 };
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

/**
 * Soften a color for use as background (reduce saturation, lighten/darken).
 */
function softenForBg(
  r: number,
  g: number,
  b: number,
  lighten: boolean = true,
): string {
  const factor = lighten ? 1.4 : 0.6;
  const mix = lighten ? 255 : 0;
  const nr = Math.round(Math.min(255, r * factor * 0.4 + mix * 0.6));
  const ng = Math.round(Math.min(255, g * factor * 0.4 + mix * 0.6));
  const nb = Math.round(Math.min(255, b * factor * 0.4 + mix * 0.6));
  return rgbToCss(nr, ng, nb);
}

/**
 * Extract 2–3 dominant colors from the puzzle image.
 * Uses corner + center sampling for performance.
 */
export function extractDominantColors(img: HTMLImageElement | null): DominantColors | null {
  if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const regW = w / 4;
  const regH = h / 4;

  const topLeft = sampleRegion(ctx, img, 0, 0, regW, regH);
  const topRight = sampleRegion(ctx, img, w - regW, 0, regW, regH);
  const center = sampleRegion(ctx, img, w / 2 - regW / 2, h / 2 - regH / 2, regW, regH);
  const bottomLeft = sampleRegion(ctx, img, 0, h - regH, regW, regH);
  const bottomRight = sampleRegion(ctx, img, w - regW, h - regH, regW, regH);

  const samples = [topLeft, topRight, center, bottomLeft, bottomRight];
  const avg = samples.reduce(
    (acc, s) => ({
      r: acc.r + s.r,
      g: acc.g + s.g,
      b: acc.b + s.b,
    }),
    { r: 0, g: 0, b: 0 },
  );
  const n = samples.length;
  const baseR = Math.round(avg.r / n);
  const baseG = Math.round(avg.g / n);
  const baseB = Math.round(avg.b / n);

  const lightness = (baseR * 0.299 + baseG * 0.587 + baseB * 0.114) / 255;
  const lighten = lightness < 0.5;

  const c1 = softenForBg(baseR, baseG, baseB, lighten);
  const c2 = softenForBg(
    (topLeft.r + bottomRight.r) / 2,
    (topLeft.g + bottomRight.g) / 2,
    (topLeft.b + bottomRight.b) / 2,
    lighten,
  );
  const c3 = softenForBg(
    (topRight.r + center.r + bottomLeft.r) / 3,
    (topRight.g + center.g + bottomLeft.g) / 3,
    (topRight.b + center.b + bottomLeft.b) / 3,
    lighten,
  );

  return { colors: [c1, c2, c3] };
}
