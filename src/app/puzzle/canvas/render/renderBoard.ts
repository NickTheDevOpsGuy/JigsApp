/**
 * renderBoard – canvas-only rendering pipeline for the puzzle board.
 * Draw helpers live in renderBoardDraw.ts; types in renderBoardTypes.ts.
 *
 * Key rules to avoid flicker:
 * - Clear in BACKING STORE pixels using identity transform.
 * - Draw everything else in CSS pixels (PlayScreen sets ctx.setTransform(dpr,...)).
 * - Any overlay/backdrop/grid should use cssW/cssH (canvas.width / dpr).
 */
import type { PuzzleState, DragState } from "@/puzzle/core/types";
import {
  drawSnapParticles,
  drawTargetSlotGlow,
  type SnapParticle,
  drawDebugBackdrop,
  drawGridOverlay,
  drawAlignmentGrid,
} from "@/puzzle/canvas/utils/renderBoardHelpers";
import {
  drawGhostHints,
  drawPiece,
  drawEdgePieceHighlight,
  drawCompletionGlow,
} from "./renderBoardDraw";
import { sortPiecesForDraw } from "@/puzzle/canvas/utils/pieceDrawOrder";
import type {
  PopMap,
  LockMap,
  ViewportTransform,
  DebugFlags,
  AnimationState,
  PieceCache,
  PathCache,
} from "@/puzzle/canvas/utils/renderBoardTypes";

export type {
  PopMap,
  LockMap,
  ViewportTransform,
  DebugFlags,
  AnimationState,
  PieceCache,
  PathCache,
} from "@/puzzle/canvas/utils/renderBoardTypes";

const LOCK_GLOW_MS = 580;

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
  pathCache?: PathCache,
  viewport?: ViewportTransform,
  snapParticles?: SnapParticle[],
) {
  const canvas = ctx.canvas;

  if (pathCache && state.pieces.length > 0) {
    for (const p of state.pieces) {
      if (p.shapePath && p.shapePath.length > 0 && !pathCache.has(p.id)) {
        try {
          pathCache.set(p.id, new Path2D(p.shapePath));
        } catch {
          /* ignore invalid path */
        }
      }
    }
  }

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const t = ctx.getTransform();
  const dpr = t.a || 1;
  const cssW = canvas.width / dpr;
  const cssH = canvas.height / dpr;

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

  const { cols, rows } = state.grid;
  const piece00 = state.pieces.find((p) => p.row === 0 && p.col === 0);
  const pad = piece00?.pad ?? 18;

  /* Scale to fit full puzzle (tile grid + piece padding), centered in the board. */
  let appliedFit = false;
  if (assembledW > 0 && assembledH > 0) {
    const contentW = assembledW + 2 * pad;
    const contentH = assembledH + 2 * pad;
    const fitScale = Math.min(1, cssW / contentW, cssH / contentH);
    const drawW = contentW * fitScale;
    const drawH = contentH * fitScale;
    const offsetX = (cssW - drawW) / 2;
    const offsetY = (cssH - drawH) / 2;
    ctx.save();
    appliedFit = true;
    ctx.translate(offsetX, offsetY);
    ctx.scale(fitScale, fitScale);
  }

  if (viewport && (viewport.scale !== 1 || viewport.panX !== 0 || viewport.panY !== 0)) {
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.scale, viewport.scale);
  }

  /* Offset so the puzzle is never clipped: map piece (0,0) container top-left to (0,0). */
  let appliedOffset = false;
  let boardOffsetX = 0;
  let boardOffsetY = 0;
  if (piece00) {
    boardOffsetX = piece00.pad - piece00.targetX;
    boardOffsetY = piece00.pad - piece00.targetY;
    ctx.save();
    ctx.translate(boardOffsetX, boardOffsetY);
    appliedOffset = true;
  }

  if (animState?.showAlignmentGrid) {
    const tileW = assembledW / cols;
    const tileH = assembledH / rows;
    drawAlignmentGrid(ctx, cols, rows, tileW, tileH);
  }

  if (animState?.showGhostHint && !state.isComplete) {
    drawGhostHints(
      ctx,
      state.pieces,
      img,
      cols,
      rows,
      animState.ghostAlpha ?? 0.35,
      pathCache,
    );
  }

  const snapPreview = animState?.snapPreview;
  const showTargetSlotGlow =
    animState?.snapGlowEnabled !== false &&
    dragState?.activeId != null &&
    snapPreview &&
    (snapPreview.nearSnap || snapPreview.inSnapRange);
  if (showTargetSlotGlow) {
    const active = state.pieces.find((p) => p.id === dragState!.activeId);
    if (active && !active.inTray) {
      const cx = active.targetX - active.pad + active.w / 2;
      const cy = active.targetY - active.pad + active.h / 2;
      const radius = Math.max(active.w, active.h) * 0.55;
      const proximity = Math.max(0, snapPreview.proximity ?? 0);
      const proximityEased = 1 - (1 - proximity) ** 3;
      const inRange = snapPreview.inSnapRange === true;
      const veryCloseBoost = proximity > 0.82 ? ((proximity - 0.82) / 0.18) * 0.55 : 0;
      const alpha = inRange
        ? Math.min(1, 0.06 + 0.35 * proximityEased + veryCloseBoost)
        : Math.min(0.5, 0.04 + 0.2 * proximityEased);
      drawTargetSlotGlow(ctx, cx, cy, radius, alpha, nowMs);
    }
  }

  /* Hover: edge highlight glow on potential snap targets (empty slots adjacent to placed). */
  const hoverSlots = animState?.hoverSnapTargetSlots;
  if (hoverSlots?.length && !dragState?.activeId) {
    const tileW = assembledW / cols;
    const tileH = assembledH / rows;
    const radius = Math.max(tileW, tileH) * 0.52;
    const alpha = 0.18;
    for (const slot of hoverSlots) {
      const cx = (slot.col + 0.5) * tileW;
      const cy = (slot.row + 0.5) * tileH;
      drawTargetSlotGlow(ctx, cx, cy, radius, alpha, nowMs);
    }
  }

  const draggedGroupId = dragState?.activeId
    ? (state.pieces.find((p) => p.id === dragState.activeId)?.groupId ?? null)
    : null;

  // Filter to board pieces only, excluding drag preview
  const boardPieces = [...state.pieces]
    .filter((p) => !p.inTray)
    .filter((p) => p.id !== animState?.dragPreviewPieceId);

  const sortedPieces = sortPiecesForDraw(boardPieces, draggedGroupId);

  const overrides =
    animState?.undoSnapBackOverrides ??
    animState?.lockLerpOverrides ??
    animState?.dragDisplayOverrides;

  for (const p of sortedPieces) {
    const isDragging = draggedGroupId !== null && p.groupId === draggedGroupId;
    const lockAt = lockMap.get(p.id);
    const lockElapsedMs = lockAt != null ? nowMs - lockAt : 0;
    const showLockGlow = lockAt != null && lockElapsedMs < LOCK_GLOW_MS;
    const drawPieceData = overrides?.has(p.id)
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
      pathCache,
      dpr,
    );
    if (
      animState?.fogAlphaForUnplaced != null &&
      animState.fogAlphaForUnplaced > 0 &&
      !p.isPlaced
    ) {
      ctx.save();
      ctx.translate(
        drawPieceData.x + drawPieceData.w / 2,
        drawPieceData.y + drawPieceData.h / 2,
      );
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.translate(-drawPieceData.w / 2, -drawPieceData.h / 2);
      ctx.fillStyle = `rgba(255,255,255,${animState.fogAlphaForUnplaced})`;
      ctx.fillRect(0, 0, drawPieceData.w, drawPieceData.h);
      ctx.restore();
    }
    if (
      animState?.showEdgeHighlight &&
      !p.isPlaced &&
      (p.row === 0 || p.row === rows - 1 || p.col === 0 || p.col === cols - 1)
    ) {
      drawEdgePieceHighlight(ctx, drawPieceData, pathCache);
    }
  }

  if (snapParticles && snapParticles.length > 0) {
    drawSnapParticles(ctx, snapParticles, nowMs);
  }

  if (appliedOffset) {
    ctx.restore();
  }

  if (viewport && (viewport.scale !== 1 || viewport.panX !== 0 || viewport.panY !== 0)) {
    ctx.restore();
  }

  if (appliedFit) {
    ctx.restore();
  }

  if (animState?.isComplete && animState.completedAtMs) {
    drawCompletionGlow(
      ctx,
      cssW,
      cssH,
      nowMs - animState.completedAtMs,
      state,
      boardOffsetX,
      boardOffsetY,
    );
  }
}
