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
  snapGlowPulse,
  drawSnapGlow,
  drawRejectSnapGlow,
  drawTargetSlotGlow,
  SNAP_GLOW_MS,
  computeImageSourceRect,
  DRAG_LIFT_PX,
  DRAG_SCALE,
} from "@/puzzle/canvas/utils/renderBoardHelpers";
import {
  WRONG_ROTATION_SHAKE_MS,
  wrongRotationShakeOffset,
  drawWrongRotationIcon,
  drawLockGlow,
  drawIdleCorrectPulse,
} from "./renderBoardDrawOverlays";
import {
  drawSilhouetteShadow,
  drawPieceImageInPath,
  strokePieceOutline,
  drawCachedPiece,
} from "./renderBoardDrawPieceHelpers";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFitBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: "Fits here" | "Almost",
  inSnapRange: boolean,
): void {
  ctx.save();
  ctx.font = "700 12px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  const iconW = 18;
  const textW = Math.ceil(ctx.measureText(label).width);
  const w = iconW + textW + 18;
  const h = 28;
  const bx = x - w / 2;
  const by = y - h - 10;
  roundedRect(ctx, bx, by, w, h, 10);
  ctx.fillStyle = inSnapRange ? "rgba(16, 54, 98, 0.92)" : "rgba(92, 58, 10, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.86)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const ix = bx + 12;
  const iy = by + h / 2;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (inSnapRange) {
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + 4, iy + 4);
    ctx.lineTo(ix + 11, iy - 5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(ix + 5.5, iy - 7);
    ctx.lineTo(ix + 11, iy + 4);
    ctx.lineTo(ix, iy + 4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ix + 5.5, iy - 2);
    ctx.lineTo(ix + 5.5, iy + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ix + 5.5, iy + 4, 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, bx + iconW + 12, iy);
  ctx.restore();
}
export function drawPiece(
  ctx: CanvasRenderingContext2D,
  p: Piece,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  popMap: PopMap,
  _lockMap: LockMap,
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
  /** Soft pulse on piece image when just snapped (0.98–1 over ~150ms) */
  const piecePulseAlpha =
    start != null && popElapsedMs < 150
      ? 0.98 + 0.02 * Math.sin((popElapsedMs / 150) * Math.PI)
      : 1;

  const idleCorrectPulseNowMs =
    animState?.idleCorrectPulsePieceId === p.id ? nowMs : undefined;

  const preview = animState?.snapPreview;
  const rejectBoard = animState?.snapRejectPreview;
  const nearMissReject =
    preview &&
    !preview.inSnapRange &&
    (preview.nearSnap || preview.proximity > 0) &&
    preview.proximity > 0.12;
  const rejectProximity = Math.max(
    rejectBoard?.proximity ?? 0,
    nearMissReject ? preview.proximity : 0,
  );

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

  if (snapGlowEnabled && start != null && popElapsedMs < SNAP_GLOW_MS) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const radius = Math.max(p.w, p.h) * 0.55;
    const glowAlpha = snapGlowAlpha(popElapsedMs) * snapGlowPulse(popElapsedMs);
    drawSnapGlow(ctx, cx, cy, radius, glowAlpha);
  }

  if (snapGlowEnabled && isDragging && path && (preview || rejectProximity > 0.16)) {
    const targetX = p.targetX - p.pad;
    const targetY = p.targetY - p.pad;
    const targetCx = targetX + p.w / 2;
    const targetCy = targetY + p.h / 2;
    const targetProximity = Math.max(preview?.proximity ?? 0, rejectProximity);
    const targetAlpha = preview?.inSnapRange
      ? 0.82
      : preview?.nearSnap
        ? Math.min(0.58, 0.24 + targetProximity * 0.42)
        : Math.min(0.5, 0.18 + targetProximity * 0.36);
    drawTargetSlotGlow(
      ctx,
      targetCx,
      targetCy,
      Math.max(p.w, p.h) * (preview?.inSnapRange ? 0.72 : 0.56),
      targetAlpha,
      nowMs,
    );
    ctx.save();
    ctx.translate(targetCx, targetCy);
    ctx.translate(-p.w / 2, -p.h / 2);
    const fitColor = preview?.inSnapRange
      ? "rgba(44, 210, 120, 0.92)"
      : preview?.nearSnap
        ? "rgba(255, 216, 105, 0.88)"
        : "rgba(255, 130, 145, 0.78)";
    ctx.fillStyle = preview?.inSnapRange
      ? "rgba(44, 210, 120, 0.13)"
      : preview?.nearSnap
        ? "rgba(255, 216, 105, 0.1)"
        : "rgba(255, 130, 145, 0.09)";
    ctx.strokeStyle = fitColor;
    ctx.lineWidth = preview?.inSnapRange ? 5.5 : 4.25;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fill(path);
    ctx.stroke(path);
    ctx.restore();
    if (preview?.inSnapRange || preview?.nearSnap) {
      drawFitBadge(
        ctx,
        targetCx,
        targetCy - Math.max(0, p.h * 0.34),
        preview.inSnapRange ? "Fits here" : "Almost",
        preview.inSnapRange,
      );
    }
  }

  if (
    snapGlowEnabled &&
    isDragging &&
    preview &&
    preview.inSnapRange &&
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
    /* Snap confidence: clearer feedback when in range, still subtle when only near */
    const baseAlpha = preview.inSnapRange
      ? 0.62
      : preview.kind === "neighbor"
        ? 0.28
        : 0.24;
    const veryCloseBoost = proximity > 0.82 ? ((proximity - 0.82) / 0.18) * 0.38 : 0;
    let alpha = Math.min(
      0.95,
      baseAlpha * (0.25 + 0.75 * proximityEased) + veryCloseBoost,
    );
    const pulse = 0.92 + 0.08 * Math.sin(nowMs * 0.003);
    alpha *= pulse;
    drawSnapGlow(ctx, cx, cy, radius, alpha);
  } else if (snapGlowEnabled && isDragging && rejectProximity > 0.16) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const proximityEased = 1 - (1 - rejectProximity) ** 2;
    const size = Math.max(p.w, p.h);
    const radius = size * (preview?.kind === "neighbor" ? 0.72 : 0.8);
    const baseAlpha = preview?.kind === "neighbor" ? 0.22 : 0.2;
    let alpha = Math.min(0.48, baseAlpha * (0.35 + 0.65 * proximityEased));
    const pulse = 0.94 + 0.06 * Math.sin(nowMs * 0.0045);
    alpha *= pulse;
    drawRejectSnapGlow(ctx, cx, cy, radius, alpha);
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

  const placedOrLocked = p.isPlaced || p.locked;
  const cacheKey = `${p.id}_r${p.rotation}_d${dpr}_solid${placedOrLocked ? 1 : 0}`;
  const rot90 = p.rotation === 90 || p.rotation === 270;
  const cacheW = rot90 ? Math.ceil(p.h) : Math.ceil(p.w);
  const cacheH = rot90 ? Math.ceil(p.w) : Math.ceil(p.h);
  const cachePxW = Math.ceil(cacheW * dpr);
  const cachePxH = Math.ceil(cacheH * dpr);
  const cached = pieceCache?.get(cacheKey);
  const useCache = true;
  if (cached && cached.width === cachePxW && cached.height === cachePxH && useCache) {
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
      piecePulseAlpha,
      idleCorrectPulseNowMs,
      animState?.reducedQuality,
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

  if (cacheCanvas && useCache) {
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
      piecePulseAlpha,
      idleCorrectPulseNowMs,
      animState?.reducedQuality,
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

  drawSilhouetteShadow(ctx, path, isDragging, p.isPlaced, {
    reducedQuality: animState?.reducedQuality,
  });
  if (piecePulseAlpha < 1) {
    ctx.save();
    ctx.globalAlpha *= piecePulseAlpha;
  }
  drawPieceImageInPath(ctx, path, img, rect, p, p.isPlaced || p.locked);
  if (piecePulseAlpha < 1) ctx.restore();
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
    if (preview.inSnapRange) {
      /* Outline strength increases with proximity for snap confidence */
      const outlineAlpha = 0.28 + 0.62 * proximityEased;
      ctx.strokeStyle =
        preview.kind === "neighbor"
          ? `rgba(162, 214, 255, ${Math.min(0.82, outlineAlpha)})`
          : `rgba(255, 220, 130, ${Math.min(0.9, outlineAlpha)})`;
      ctx.lineWidth = 6;
    } else {
      const outlineAlpha = 0.1 + 0.42 * proximityEased;
      ctx.strokeStyle = `rgba(255, 140, 150, ${Math.min(0.5, outlineAlpha)})`;
      ctx.lineWidth = 4.5;
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(path);
    ctx.restore();
  } else if (
    snapGlowEnabled &&
    isDragging &&
    rejectBoard &&
    rejectBoard.proximity > 0.2 &&
    (!preview || !preview.inSnapRange)
  ) {
    ctx.save();
    const proximityEased = 1 - (1 - rejectBoard.proximity) ** 2;
    const outlineAlpha = 0.12 + 0.4 * proximityEased;
    ctx.strokeStyle = `rgba(255, 130, 145, ${Math.min(0.48, outlineAlpha)})`;
    ctx.lineWidth = 4.25;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(path);
    ctx.restore();
  }
  if (showLockGlow) drawLockGlow(ctx, path, lockElapsedMs);
  if (idleCorrectPulseNowMs != null) {
    drawIdleCorrectPulse(ctx, path, idleCorrectPulseNowMs);
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
  ctx.restore();
}
