export type Rect = { x: number; y: number; w: number; h: number };

export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, rect.w / 2, rect.h / 2));
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.w - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + r);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h - r);
  ctx.quadraticCurveTo(
    rect.x + rect.w,
    rect.y + rect.h,
    rect.x + rect.w - r,
    rect.y + rect.h,
  );
  ctx.lineTo(rect.x + r, rect.y + rect.h);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
}

export function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  fillStyle: string,
) {
  roundedRectPath(ctx, rect, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

export function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  strokeStyle: string,
  lineWidth = 1,
) {
  roundedRectPath(ctx, rect, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: Rect,
  radius: number,
) {
  ctx.save();
  roundedRectPath(ctx, rect, radius);
  ctx.clip();
  // High-quality smoothing keeps the puzzle image sharp when scaled (match reference quality).
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    (
      ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }
    ).imageSmoothingQuality = "high";
  }
  const imgW = Math.max(1, img.naturalWidth);
  const imgH = Math.max(1, img.naturalHeight);
  const scale = Math.max(rect.w / imgW, rect.h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = rect.x + (rect.w - drawW) / 2;
  const drawY = rect.y + (rect.h - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

export function drawCardBackground(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
) {
  const bg1 = "#1a1a1a";
  const bg2 = "#0f0f0f";
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, bg1);
  g.addColorStop(1, bg2);
  ctx.fillStyle = g;
  roundedRectPath(ctx, rect, radius);
  ctx.fill();
}

/** OG-style dark blue gradient (like og-image.png): brighter blue top-left to deeper blue bottom-right. */
export function drawOgStyleCardBackground(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
) {
  const topLeft = "#1e3a5f";
  const bottomRight = "#0f172a";
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, topLeft);
  g.addColorStop(1, bottomRight);
  ctx.fillStyle = g;
  roundedRectPath(ctx, rect, radius);
  ctx.fill();
}

export function drawPuzzleIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const w = size;
  const h = size * 1.05;
  const r = size * 0.18;
  ctx.save();
  ctx.translate(x, y);
  const colors = ["#facc15", "#3b82f6", "#22c55e", "#f97316"];
  fillRoundedRect(ctx, { x: 0, y: 0, w, h }, r, colors[0]);
  strokeRoundedRect(ctx, { x: 0, y: 0, w, h }, r, "rgba(255,255,255,0.35)", 1);
  const tabW = w * 0.3;
  const tabH = h * 0.2;
  fillRoundedRect(
    ctx,
    { x: w * 0.35, y: -tabH * 0.2, w: tabW, h: tabH * 1.2 },
    r * 0.5,
    colors[1],
  );
  fillRoundedRect(
    ctx,
    { x: w - tabW * 0.85, y: h * 0.38, w: tabW * 1.05, h: tabH },
    r * 0.5,
    colors[2],
  );
  fillRoundedRect(
    ctx,
    { x: w * 0.34, y: h - tabH * 0.6, w: tabW, h: tabH * 1.05 },
    r * 0.5,
    colors[3],
  );
  ctx.restore();
}

export function drawChipRow(
  ctx: CanvasRenderingContext2D,
  rowBounds: Rect,
  labels: string[],
  chipFill: string,
  textFill: string,
) {
  if (labels.length === 0) return;
  const gap = 14;
  const chipHeight = 58;
  const widths = labels.map((label) => Math.ceil(ctx.measureText(label).width) + 44);
  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
  let x = rowBounds.x + (rowBounds.w - totalWidth) / 2;
  const y = rowBounds.y + (rowBounds.h - chipHeight) / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  labels.forEach((label, index) => {
    const rect = { x, y, w: widths[index], h: chipHeight };
    fillRoundedRect(ctx, rect, 28, chipFill);
    strokeRoundedRect(ctx, rect, 28, "rgba(255,255,255,0.16)");
    ctx.fillStyle = textFill;
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    x += rect.w + gap;
  });
}
