/**
 * Piece drawing: stroke outline, cached piece, single piece, ghost hints.
 * Used by renderBoardDraw and renderBoard.
 */
import type { Piece } from "@/puzzle/core/types";
import type {
  PopMap,
  LockMap,
  DebugFlags,
  AnimationState,
  PieceCache,
  PathCache,
} from "@/puzzle/canvas/utils/renderBoardTypes";
import {
  snapPopScale,
  snapGlowAlpha,
  drawSnapGlow,
  computeImageSourceRect,
  DRAG_LIFT_PX,
  DRAG_SCALE,
} from "@/puzzle/canvas/utils/renderBoardHelpers";
import {
  WRONG_ROTATION_SHAKE_MS,
  wrongRotationShakeOffset,
  drawWrongRotationIcon,
  drawLockGlow,
} from "./renderBoardDrawOverlays";
import {
  drawSilhouetteShadow,
  drawPieceImageInPath,
  strokePieceOutline,
  drawCachedPiece,
} from "./renderBoardDrawPieceHelpers";
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
  pathCache?: PathCache,
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
  const snapGlowEnabled = animState?.snapGlowEnabled !== false;

  if (snapGlowEnabled && start != null && popElapsedMs < 320) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const radius = Math.max(p.w, p.h) * 0.55;
    drawSnapGlow(ctx, cx, cy, radius, snapGlowAlpha(popElapsedMs));
  }

  const preview = animState?.snapPreview;
  if (
    snapGlowEnabled &&
    isDragging &&
    preview &&
    (preview.nearSnap || preview.inSnapRange)
  ) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const proximity = preview.proximity;
    const proximityEased = 1 - (1 - proximity) ** 3;
    const size = Math.max(p.w, p.h);
    const radius =
      size *
      (preview.kind === "neighbor"
        ? preview.inSnapRange
          ? 0.92
          : 0.7
        : preview.inSnapRange
          ? 1.02
          : 0.78);
    const baseAlpha = preview.inSnapRange
      ? 0.54
      : preview.kind === "neighbor"
        ? 0.26
        : 0.22;
    const veryCloseBoost = proximity > 0.82 ? ((proximity - 0.82) / 0.18) * 0.4 : 0;
    let alpha = Math.min(0.95, baseAlpha * (0.2 + 0.8 * proximityEased) + veryCloseBoost);
    const pulse = 0.92 + 0.08 * Math.sin(nowMs * 0.003);
    alpha *= pulse;
    drawSnapGlow(ctx, cx, cy, radius, alpha);
  }

  let path: Path2D | null = null;
  if (pathCache && p.shapePath && p.shapePath.length > 0) {
    path =
      pathCache.get(p.id) ??
      (() => {
        try {
          const q = new Path2D(p.shapePath);
          pathCache.set(p.id, q);
          return q;
        } catch {
          return null;
        }
      })();
  } else if (p.shapePath && p.shapePath.length > 0) {
    try {
      path = new Path2D(p.shapePath);
    } catch {
      path = null;
    }
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

  if (debug.showSilhouette) {
    ctx.save();
    ctx.translate(p.x + p.w / 2 + shake.x, p.y + p.h / 2 + shake.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-p.w / 2, -p.h / 2);
    ctx.fillStyle = "rgba(180, 200, 220, 0.9)";
    ctx.fill(path);
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(path);
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
      offCtx.scale(dpr, dpr);
      offCtx.translate(cacheW / 2, cacheH / 2);
      offCtx.rotate((p.rotation * Math.PI) / 180);
      offCtx.translate(-p.w / 2, -p.h / 2);
      drawPieceImageInPath(offCtx, path, img, rect, p);
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
  const liftY = isDragging ? -DRAG_LIFT_PX : 0;
  const dragTiltDeg = isDragging ? ((p.row + p.col) % 2 === 0 ? -1.6 : 1.6) : 0;
  ctx.save();
  ctx.translate(p.x + p.w / 2 + shake.x, p.y + p.h / 2 + shake.y + liftY);
  ctx.rotate((p.rotation * Math.PI) / 180);
  if (dragTiltDeg !== 0) {
    ctx.rotate((dragTiltDeg * Math.PI) / 180);
  }
  ctx.scale(scale, scale);
  ctx.translate(-p.w / 2, -p.h / 2);

  drawSilhouetteShadow(ctx, path, isDragging, p.isPlaced);
  drawPieceImageInPath(ctx, path, img, rect, p);
  strokePieceOutline(
    ctx,
    path,
    isDragging,
    isSelected,
    p.isPlaced,
    p.locked,
    animState?.showClusterOutline,
  );
  if (
    snapGlowEnabled &&
    isDragging &&
    preview &&
    (preview.nearSnap || preview.inSnapRange) &&
    preview.proximity > 0.2
  ) {
    ctx.save();
    const proximityEased = 1 - (1 - preview.proximity) ** 2;
    const outlineAlpha = preview.inSnapRange
      ? 0.2 + 0.65 * proximityEased
      : 0.12 + 0.5 * proximityEased;
    ctx.strokeStyle =
      preview.kind === "neighbor"
        ? `rgba(162, 214, 255, ${Math.min(0.8, outlineAlpha)})`
        : `rgba(255, 220, 130, ${Math.min(0.88, outlineAlpha)})`;
    ctx.lineWidth = preview.inSnapRange ? 6 : 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(path);
    ctx.restore();
  }
  if (showLockGlow) drawLockGlow(ctx, path, lockElapsedMs);
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
  ctx.restore();
}
