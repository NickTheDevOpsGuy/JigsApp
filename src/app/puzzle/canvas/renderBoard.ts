// src/app/puzzle/canvas/renderBoard.ts
import type { Piece, PuzzleState, DragState } from "@/puzzle/types";
import {
  snapPopScale,
  snapGlowAlpha,
  drawSnapGlow,
  drawSnapParticles,
  type SnapParticle,
  drawDebugBackdrop,
  drawGridOverlay,
  applyPieceShadow,
  clearPieceShadow,
  computeImageSourceRect,
} from "./renderBoardHelpers";

export type PopMap = Map<string, number>;
export type LockMap = Map<string, number>;

export type ViewportTransform = { scale: number; panX: number; panY: number };

export type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

export type AnimationState = {
  draggedGroupId: string | null;
  hoveredPieceId: string | null;
  selectedPieceId: string | null;
  isComplete: boolean;
  completedAtMs: number | null;
  /** When true, show semi-transparent ghosts at correct positions for misplaced pieces */
  showGhostHint?: boolean;
  /** When set, this piece is drawn in a DOM overlay instead of on canvas (for drag-to-tray) */
  dragPreviewPieceId?: string | null;
  /** Interpolated display positions for dragged group (smoother drag, no touch/pointer changes) */
  dragDisplayOverrides?: Map<string, { x: number; y: number }>;
};

/** Cache for pre-rendered pieces - clip at (0,0) gives crisp edges, avoids blocky look when moving */
export type PieceCache = Map<string, HTMLCanvasElement>;

/**
 * renderBoard
 *
 * Canvas-only rendering pipeline.
 *
 * Key rules to avoid flicker:
 * - Clear in BACKING STORE pixels using identity transform.
 * - Draw everything else in CSS pixels (PlayScreen sets ctx.setTransform(dpr,...)).
 * - Any overlay/backdrop/grid should use cssW/cssH (canvas.width / dpr).
 */
export function renderBoard(
  ctx: CanvasRenderingContext2D,
  state: PuzzleState,
  img: HTMLImageElement,
  assembledW: number,
  assembledH: number,
  popMap: PopMap,
  lockMap: LockMap,
  nowMs: number,
  debug: DebugFlags,
  dragState?: DragState,
  animState?: AnimationState,
  pieceCache?: PieceCache,
  viewport?: ViewportTransform,
  snapParticles?: SnapParticle[],
) {
  const canvas = ctx.canvas;

  // 1) Clear in backing pixels with identity transform (prevents "double vision" artifacts)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 2) Derive CSS-space size from current transform (PlayScreen should setTransform(dpr,...))
  const t = ctx.getTransform();
  const dpr = t.a || 1; // scaleX
  const cssW = canvas.width / dpr;
  const cssH = canvas.height / dpr;

  // 3) Backdrop + optional overlays in CSS pixels
  drawDebugBackdrop(ctx, cssW, cssH);

  if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "14px system-ui";
    ctx.fillText("Image not ready…", 16, 24);
    ctx.restore();
    return;
  }

  if (debug.showGrid) drawGridOverlay(ctx, cssW, cssH);

  // Apply viewport transform for zoom/pan (pieces, ghosts, completion glow only)
  if (viewport && (viewport.scale !== 1 || viewport.panX !== 0 || viewport.panY !== 0)) {
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.scale, viewport.scale);
  }

  // Get grid from state
  const { cols, rows } = state.grid;

  // Ghost hint: draw misplaced pieces at their target positions (before real pieces)
  if (animState?.showGhostHint && !state.isComplete) {
    drawGhostHints(ctx, state.pieces, img, cols, rows);
  }

  // Determine dragged group
  const draggedGroupId = dragState?.activeId
    ? (state.pieces.find((p) => p.id === dragState.activeId)?.groupId ?? null)
    : null;

  // Draw order by z (lowest -> highest) - only pieces NOT in tray
  const pieces = [...state.pieces]
    .filter((p) => !p.inTray)
    .filter((p) => p.id !== animState?.dragPreviewPieceId)
    .sort((a, b) => a.z - b.z);

  const LOCK_GLOW_MS = 500;
  const overrides = animState?.dragDisplayOverrides;
  for (const p of pieces) {
    const isDragging = draggedGroupId !== null && p.groupId === draggedGroupId;
    const lockAt = lockMap.get(p.id);
    const lockElapsedMs = lockAt != null ? nowMs - lockAt : 0;
    const showLockGlow = lockAt != null && lockElapsedMs < LOCK_GLOW_MS;
    const drawPieceData =
      isDragging && overrides?.has(p.id)
        ? { ...p, x: overrides.get(p.id)!.x, y: overrides.get(p.id)!.y }
        : p;
    drawPiece(
      ctx,
      drawPieceData,
      img,
      cols,
      rows,
      popMap,
      lockMap,
      nowMs,
      debug,
      isDragging,
      showLockGlow,
      lockElapsedMs,
      animState,
      pieceCache,
      dpr,
    );
  }

  // Snap particles (board space, on top of pieces)
  if (snapParticles && snapParticles.length > 0) {
    drawSnapParticles(ctx, snapParticles, nowMs);
  }

  if (viewport && (viewport.scale !== 1 || viewport.panX !== 0 || viewport.panY !== 0)) {
    ctx.restore();
  }

  // Completion glow effect (screen-space, outside viewport)
  if (animState?.isComplete && animState.completedAtMs) {
    drawCompletionGlow(ctx, cssW, cssH, nowMs - animState.completedAtMs);
  }
}

/**
 * Draw semi-transparent ghosts at correct positions for misplaced pieces.
 * Helps users see where pieces belong when stuck.
 */
function drawGhostHints(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  img: HTMLImageElement,
  cols: number,
  rows: number,
) {
  const popMap = new Map<string, number>();
  const nowMs = performance.now();
  const debug: DebugFlags = { showGrid: false, showBounds: false, showIds: false };

  for (const p of pieces) {
    // Skip pieces already at correct position
    if (p.isPlaced) continue;

    const tileX = p.x + p.pad;
    const tileY = p.y + p.pad;
    const atTarget =
      Math.round(tileX) === p.targetX &&
      Math.round(tileY) === p.targetY &&
      p.rotation === p.targetRotation;

    if (atTarget) continue;

    // Ghost at target position with target rotation
    const ghostPiece: Piece = {
      ...p,
      x: p.targetX - p.pad,
      y: p.targetY - p.pad,
      rotation: p.targetRotation,
    };

    ctx.save();
    ctx.globalAlpha = 0.35;
    const ghostDpr = ctx.getTransform().a || 1;
    drawPiece(
      ctx,
      ghostPiece,
      img,
      cols,
      rows,
      popMap,
      new Map(),
      nowMs,
      debug,
      false,
      false,
      0,
      undefined,
      undefined,
      ghostDpr,
    );
    ctx.restore();
  }
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  p: Piece,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  popMap: PopMap,
  lockMap: LockMap,
  nowMs: number,
  debug: DebugFlags,
  isDragging: boolean,
  showLockGlow: boolean,
  lockElapsedMs: number,
  animState?: AnimationState,
  pieceCache?: PieceCache,
  dpr: number = 1,
) {
  const isSelected = animState?.selectedPieceId === p.id && !p.isPlaced;

  const start = popMap.get(p.id);
  const popElapsedMs = start != null ? nowMs - start : 0;
  const popScale = start != null ? snapPopScale(popElapsedMs) : 1;
  const scale = popScale;

  // Subtle snap glow behind piece (placement or neighbor merge)
  if (start != null && popElapsedMs < 280) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const radius = Math.max(p.w, p.h) * 0.55;
    drawSnapGlow(ctx, cx, cy, radius, snapGlowAlpha(popElapsedMs));
  }

  let path: Path2D | null = null;
  try {
    if (p.shapePath && p.shapePath.length > 0) {
      path = new Path2D(p.shapePath);
    }
  } catch {
    path = null;
  }

  if (!path) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 120, 255, 0.10)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.restore();
    return;
  }

  // Use cached pre-rendered piece when available - rotation baked in, rendered at dpr for crisp edges
  const cacheKey = `${p.id}_r${p.rotation}_d${dpr}`;
  const rot90 = p.rotation === 90 || p.rotation === 270;
  const cacheW = rot90 ? Math.ceil(p.h) : Math.ceil(p.w);
  const cacheH = rot90 ? Math.ceil(p.w) : Math.ceil(p.h);
  const cachePxW = Math.ceil(cacheW * dpr);
  const cachePxH = Math.ceil(cacheH * dpr);
  const cached = pieceCache?.get(cacheKey);
  if (cached && cached.width === cachePxW && cached.height === cachePxH) {
    drawCachedPiece(
      ctx,
      p,
      cached,
      cacheW,
      cacheH,
      cachePxW,
      cachePxH,
      scale,
      isDragging,
      isSelected,
      showLockGlow,
      lockElapsedMs,
      path,
      dpr,
    );
    return;
  }

  // Cache miss: render piece at dpr resolution with rotation baked in
  let cacheCanvas: HTMLCanvasElement | null = cached ?? null;
  if (!cacheCanvas && pieceCache) {
    const off = document.createElement("canvas");
    off.width = cachePxW;
    off.height = cachePxH;
    const offCtx = off.getContext("2d");
    if (offCtx) {
      const rect = computeImageSourceRect(p, img, cols, rows);
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = "high";
      offCtx.scale(dpr, dpr);
      offCtx.translate(cacheW / 2, cacheH / 2);
      offCtx.rotate((p.rotation * Math.PI) / 180);
      offCtx.translate(-p.w / 2, -p.h / 2);
      offCtx.save();
      offCtx.clip(path);
      offCtx.drawImage(
        img,
        rect.srcX,
        rect.srcY,
        rect.srcW,
        rect.srcH,
        rect.destX,
        rect.destY,
        rect.destW,
        rect.destH,
      );
      offCtx.restore();
      pieceCache.set(cacheKey, off);
      cacheCanvas = off;
    }
  }

  if (cacheCanvas) {
    drawCachedPiece(
      ctx,
      p,
      cacheCanvas,
      cacheW,
      cacheH,
      cachePxW,
      cachePxH,
      scale,
      isDragging,
      isSelected,
      showLockGlow,
      lockElapsedMs,
      path,
      dpr,
    );
    return;
  }

  // Fallback: draw directly (for ghosts when no cache, or when cache creation fails)
  const rect = computeImageSourceRect(p, img, cols, rows);
  ctx.save();
  applyPieceShadow(ctx, isDragging, p.isPlaced);
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-p.w / 2, -p.h / 2);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clip(path);
  ctx.drawImage(
    img,
    rect.srcX,
    rect.srcY,
    rect.srcW,
    rect.srcH,
    rect.destX,
    rect.destY,
    rect.destW,
    rect.destH,
  );
  ctx.restore();
  clearPieceShadow(ctx);
  strokePieceOutline(ctx, path, isDragging, isSelected, p.isPlaced, p.locked);
  if (showLockGlow) {
    drawLockGlow(ctx, path, lockElapsedMs);
  }
  if (debug.showBounds) {
    ctx.strokeStyle = "rgba(255,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, p.w, p.h);
  }
  if (debug.showIds) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.font = "12px system-ui";
    ctx.fillText(p.id, 8, 16);
  }
  if (isSelected) {
    ctx.strokeStyle = "#667eea";
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
    ctx.strokeStyle = "rgba(102, 126, 234, 0.35)";
    ctx.lineWidth = 3;
    ctx.stroke(path);
  }
  ctx.restore();
}

function drawLockGlow(ctx: CanvasRenderingContext2D, path: Path2D, elapsedMs: number) {
  const LOCK_GLOW_MS = 500;
  const alpha = Math.max(0, 0.5 * (1 - elapsedMs / LOCK_GLOW_MS));
  if (alpha <= 0) return;
  ctx.save();
  ctx.strokeStyle = `rgba(0, 200, 100, ${alpha})`;
  ctx.lineWidth = 4;
  ctx.stroke(path);
  ctx.restore();
}

function drawCachedPiece(
  ctx: CanvasRenderingContext2D,
  p: Piece,
  cacheCanvas: HTMLCanvasElement,
  cacheW: number,
  cacheH: number,
  cachePxW: number,
  cachePxH: number,
  scale: number,
  isDragging: boolean,
  isSelected: boolean,
  showLockGlow: boolean,
  lockElapsedMs: number,
  path: Path2D,
  dpr: number,
) {
  ctx.save();
  applyPieceShadow(ctx, isDragging, p.isPlaced);
  let cx = p.x + p.w / 2;
  let cy = p.y + p.h / 2;
  if (isDragging) {
    cx = Math.round(cx * dpr) / dpr;
    cy = Math.round(cy * dpr) / dpr;
  }
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cacheW / 2, -cacheH / 2);
  ctx.drawImage(cacheCanvas, 0, 0, cachePxW, cachePxH, 0, 0, cacheW, cacheH);
  clearPieceShadow(ctx);
  if (isDragging || isSelected) {
    ctx.translate(cacheW / 2, cacheH / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);
    ctx.strokeStyle = isDragging ? "rgba(102, 126, 234, 0.6)" : "#667eea";
    ctx.lineWidth = isDragging ? 1.5 : 1.5;
    ctx.stroke(path);
  }
  if (showLockGlow) {
    ctx.translate(cacheW / 2, cacheH / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);
    drawLockGlow(ctx, path, lockElapsedMs);
  }
  ctx.restore();
}

function strokePieceOutline(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  isDragging: boolean,
  isSelected: boolean,
  isPlaced: boolean,
  locked: boolean,
) {
  if (isDragging) {
    ctx.strokeStyle = "rgba(102, 126, 234, 0.6)";
    ctx.lineWidth = 2;
  } else if (isPlaced) {
    ctx.strokeStyle = "rgba(0, 160, 80, 0.3)";
    ctx.lineWidth = 1;
  } else if (locked) {
    ctx.strokeStyle = "rgba(0, 160, 80, 0.4)";
    ctx.lineWidth = 1.5;
  } else {
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
  }
  ctx.stroke(path);
}

function drawCompletionGlow(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  elapsedMs: number,
) {
  // Last-piece flourish: strong pulse in first 300ms, then subtle pulse that fades
  if (elapsedMs > 3000) return;

  const fadeOut = Math.max(0, 1 - elapsedMs / 3000);
  const pulse = 0.5 + 0.5 * Math.sin(elapsedMs / 200);
  const flourish = elapsedMs < 300 ? 0.2 * (1 - elapsedMs / 300) : 0;
  const alpha = Math.min(0.35, flourish + 0.08 * fadeOut * pulse);

  ctx.save();

  // Golden glow overlay
  const gradient = ctx.createRadialGradient(
    cssW / 2,
    cssH / 2,
    0,
    cssW / 2,
    cssH / 2,
    Math.max(cssW, cssH) / 2,
  );
  gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.restore();
}
