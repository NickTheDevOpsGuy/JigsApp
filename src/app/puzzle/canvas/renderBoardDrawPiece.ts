/**
 * Piece drawing: stroke outline, cached piece, single piece, ghost hints.
 * Used by renderBoardDraw and renderBoard.
 */
import type { Piece } from "@/puzzle/types";
import type {
  PopMap,
  LockMap,
  DebugFlags,
  AnimationState,
  PieceCache,
} from "./renderBoardTypes";
import {
  snapPopScale,
  snapGlowAlpha,
  drawSnapGlow,
  applyPieceShadow,
  clearPieceShadow,
  computeImageSourceRect,
  DRAG_LIFT_PX,
  DRAG_SCALE,
} from "./renderBoardHelpers";
import {
  WRONG_ROTATION_SHAKE_MS,
  wrongRotationShakeOffset,
  drawWrongRotationIcon,
  drawLockGlow,
} from "./renderBoardDrawOverlays";
import { strokePieceOutline, drawCachedPiece } from "./renderBoardDrawPieceHelpers";

/** Draw semi-transparent ghosts at correct positions for misplaced pieces. */
export function drawGhostHints(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[],
  img: HTMLImageElement,
  cols: number,
  rows: number,
  alpha = 0.35,
) {
  const popMap = new Map<string, number>();
  const nowMs = performance.now();
  const debug: DebugFlags = { showGrid: false, showBounds: false, showIds: false };

  for (const p of pieces) {
    if (p.isPlaced) continue;

    const tileX = p.x + p.pad;
    const tileY = p.y + p.pad;
    const atTarget =
      Math.round(tileX) === p.targetX &&
      Math.round(tileY) === p.targetY &&
      p.rotation === p.targetRotation;

    if (atTarget) continue;

    const ghostPiece: Piece = {
      ...p,
      x: p.targetX - p.pad,
      y: p.targetY - p.pad,
      rotation: p.targetRotation,
    };

    ctx.save();
    ctx.globalAlpha = alpha;
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

export function drawPiece(
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

  const hint = animState?.wrongRotationHint;
  const showWrongRotationHint =
    hint &&
    hint.pieceIds.includes(p.id) &&
    nowMs - hint.triggeredAt < WRONG_ROTATION_SHAKE_MS;
  const shakeElapsedMs = hint ? nowMs - hint.triggeredAt : 0;
  const shake = showWrongRotationHint
    ? wrongRotationShakeOffset(shakeElapsedMs)
    : { x: 0, y: 0 };

  const start = popMap.get(p.id);
  const popElapsedMs = start != null ? nowMs - start : 0;
  const popScale = start != null ? snapPopScale(popElapsedMs) : 1;
  const scale = popScale * (isDragging ? DRAG_SCALE : 1);

  if (start != null && popElapsedMs < 320) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const radius = Math.max(p.w, p.h) * 0.55;
    drawSnapGlow(ctx, cx, cy, radius, snapGlowAlpha(popElapsedMs));
  }

  const preview = animState?.snapPreview;
  if (isDragging && preview && (preview.nearSnap || preview.inSnapRange)) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const radius = Math.max(p.w, p.h) * 0.58;
    const baseAlpha = preview.inSnapRange ? 0.14 : 0.06;
    const alpha = baseAlpha * (0.4 + 0.6 * preview.proximity);
    drawSnapGlow(ctx, cx, cy, radius, alpha);
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
      shake.x,
      shake.y,
      showWrongRotationHint,
      shakeElapsedMs,
      animState?.showClusterOutline,
    );
    return;
  }

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
      shake.x,
      shake.y,
      showWrongRotationHint,
      shakeElapsedMs,
      animState?.showClusterOutline,
    );
    return;
  }

  const rect = computeImageSourceRect(p, img, cols, rows);
  ctx.save();
  applyPieceShadow(ctx, isDragging, p.isPlaced);
  const liftY = isDragging ? -DRAG_LIFT_PX : 0;
  ctx.translate(p.x + p.w / 2 + shake.x, p.y + p.h / 2 + shake.y + liftY);
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
  strokePieceOutline(
    ctx,
    path,
    isDragging,
    isSelected,
    p.isPlaced,
    p.locked,
    animState?.showClusterOutline,
  );
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
  if (showWrongRotationHint) {
    drawWrongRotationIcon(
      ctx,
      p.w / 2 - 14,
      -p.h / 2 + 14,
      Math.min(p.w, p.h),
      shakeElapsedMs,
    );
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
