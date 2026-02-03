// src/app/puzzle/canvas/renderBoard.ts
import type { Piece, PuzzleState, DragState } from "@/puzzle/types";
import { snapPopScale, drawDebugBackdrop, drawGridOverlay } from "./renderBoardHelpers";

export type PopMap = Map<string, number>;

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
};

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
  nowMs: number,
  debug: DebugFlags,
  dragState?: DragState,
  animState?: AnimationState,
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
  const pieces = [...state.pieces].filter((p) => !p.inTray).sort((a, b) => a.z - b.z);

  for (const p of pieces) {
    const isDragging = draggedGroupId !== null && p.groupId === draggedGroupId;
    drawPiece(ctx, p, img, cols, rows, popMap, nowMs, debug, isDragging, animState);
  }

  // Completion glow effect
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
    drawPiece(ctx, ghostPiece, img, cols, rows, popMap, nowMs, debug, false);
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
  nowMs: number,
  debug: DebugFlags,
  isDragging: boolean,
  animState?: AnimationState,
) {
  const isSelected = animState?.selectedPieceId === p.id && !p.isPlaced;

  // Pop animation scale (draw-time)
  const start = popMap.get(p.id);
  const popScale = start ? snapPopScale(nowMs - start) : 1;

  // Drag animation: slightly larger when dragging
  const dragScale = isDragging ? 1.03 : 1;
  const scale = popScale * dragScale;

  // Build path (piece-local viewBox coordinates: 0..w,0..h)
  let path: Path2D | null = null;
  try {
    if (!p.shapePath || p.shapePath.length === 0) {
      console.warn(`[Phuzzle] Piece ${p.id} has empty shapePath`);
    } else {
      path = new Path2D(p.shapePath);
    }
  } catch (err) {
    console.error(`[Phuzzle] Failed to parse shapePath for ${p.id}:`, p.shapePath, err);
    path = null;
  }

  ctx.save();

  // Drop shadow for dragged pieces
  if (isDragging) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
  } else if (!p.isPlaced) {
    // Subtle shadow for unplaced pieces
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  // Centered rotation + scale around piece center
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Move to top-left of piece-local space
  ctx.translate(-p.w / 2, -p.h / 2);

  if (!path) {
    // Fallback: draw a rect so the piece is still visible if path is bad
    ctx.fillStyle = "rgba(0, 120, 255, 0.10)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.strokeRect(0, 0, p.w, p.h);

    if (debug.showIds) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.font = "12px system-ui";
      ctx.fillText(p.id, 8, 16);
    }

    ctx.restore();
    return;
  }

  // Clip to silhouette then draw image slice
  ctx.save();
  ctx.clip(path);

  // Calculate which section of the SOURCE image this piece represents
  const sourceW = img.naturalWidth;
  const sourceH = img.naturalHeight;

  const srcTileW = sourceW / cols;
  const srcTileH = sourceH / rows;

  // Scale factors: how to scale source image to piece coordinates
  const scaleX = p.tileW / srcTileW;
  const scaleY = p.tileH / srcTileH;

  // This tile's position in source image
  const tileSrcX = p.col * srcTileW;
  const tileSrcY = p.row * srcTileH;

  // Where should (0,0) of source image be drawn in piece-local coordinates?
  // The tile's top-left should appear at (p.pad, p.pad) in piece coords
  // So source (tileSrcX, tileSrcY) -> piece (p.pad, p.pad)
  // Therefore source (0,0) -> piece (p.pad - tileSrcX * scaleX, p.pad - tileSrcY * scaleY)
  const imgX = p.pad - tileSrcX * scaleX;
  const imgY = p.pad - tileSrcY * scaleY;
  const imgW = sourceW * scaleX;
  const imgH = sourceH * scaleY;

  // Draw the entire source image, scaled and positioned
  // The clip path will cut it to the jigsaw shape
  ctx.drawImage(img, imgX, imgY, imgW, imgH);

  ctx.restore();

  // Reset shadow before drawing outline
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Outline - thicker for dragged pieces
  if (isDragging) {
    ctx.strokeStyle = "rgba(102, 126, 234, 0.6)";
    ctx.lineWidth = 2;
  } else if (p.isPlaced) {
    ctx.strokeStyle = "rgba(0, 160, 80, 0.3)";
    ctx.lineWidth = 1;
  } else if (p.locked) {
    ctx.strokeStyle = "rgba(0, 160, 80, 0.4)";
    ctx.lineWidth = 1.5;
  } else {
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
  }
  ctx.stroke(path);

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

  // Selection highlight (keyboard focus)
  if (isSelected) {
    ctx.strokeStyle = "#667eea";
    ctx.lineWidth = 3;
    ctx.stroke(path);

    // Outer glow
    ctx.strokeStyle = "rgba(102, 126, 234, 0.4)";
    ctx.lineWidth = 6;
    ctx.stroke(path);
  }

  ctx.restore();
}

function drawCompletionGlow(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  elapsedMs: number,
) {
  // Subtle pulsing glow that fades out after a few seconds
  if (elapsedMs > 3000) return;

  const fadeOut = Math.max(0, 1 - elapsedMs / 3000);
  const pulse = 0.5 + 0.5 * Math.sin(elapsedMs / 200);
  const alpha = 0.08 * fadeOut * pulse;

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
