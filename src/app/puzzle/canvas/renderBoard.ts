/**
 * renderBoard – canvas-only rendering pipeline for the puzzle board.
 * Draw helpers live in renderBoardDraw.ts; types in renderBoardTypes.ts.
 *
 * Key rules to avoid flicker:
 * - Clear in BACKING STORE pixels using identity transform.
 * - Draw everything else in CSS pixels (PlayScreen sets ctx.setTransform(dpr,...)).
 * - Any overlay/backdrop/grid should use cssW/cssH (canvas.width / dpr).
 */
import type { PuzzleState, DragState } from "@/puzzle/types";
import {
  drawSnapParticles,
  type SnapParticle,
  drawDebugBackdrop,
  drawGridOverlay,
  drawAlignmentGrid,
} from "./renderBoardHelpers";
import {
  drawGhostHints,
  drawPiece,
  drawEdgePieceHighlight,
  drawCompletionGlow,
} from "./renderBoardDraw";
import type {
  PopMap,
  LockMap,
  ViewportTransform,
  DebugFlags,
  AnimationState,
  PieceCache,
} from "./renderBoardTypes";

export type {
  PopMap,
  LockMap,
  ViewportTransform,
  DebugFlags,
  AnimationState,
  PieceCache,
} from "./renderBoardTypes";

const LOCK_GLOW_MS = 500;

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

  /* Scale to fit and center the puzzle in the canvas so it is never clipped and always centered. */
  let appliedFit = false;
  if (assembledW > 0 && assembledH > 0) {
    const fitScale = Math.min(1, cssW / assembledW, cssH / assembledH);
    ctx.save();
    appliedFit = true;
    ctx.translate(cssW / 2, cssH / 2);
    ctx.scale(fitScale, fitScale);
    ctx.translate(-assembledW / 2, -assembledH / 2);
  }

  if (viewport && (viewport.scale !== 1 || viewport.panX !== 0 || viewport.panY !== 0)) {
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.scale, viewport.scale);
  }

  const { cols, rows } = state.grid;

  /* Offset so the puzzle is never clipped: map piece (0,0) container top-left to (0,0). */
  let appliedOffset = false;
  let boardOffsetX = 0;
  let boardOffsetY = 0;
  const piece00 = state.pieces.find((p) => p.row === 0 && p.col === 0);
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
    drawGhostHints(ctx, state.pieces, img, cols, rows, animState.ghostAlpha ?? 0.35);
  }

  const draggedGroupId = dragState?.activeId
    ? (state.pieces.find((p) => p.id === dragState.activeId)?.groupId ?? null)
    : null;

  const pieces = [...state.pieces]
    .filter((p) => !p.inTray)
    .filter((p) => p.id !== animState?.dragPreviewPieceId)
    .sort((a, b) => {
      /* Draw by z so higher z (e.g. just-placed / bumped) is on top; never pops behind */
      return a.z - b.z;
    });

  const overrides =
    animState?.undoSnapBackOverrides ??
    animState?.lockLerpOverrides ??
    animState?.dragDisplayOverrides;
  const sortedPieces =
    draggedGroupId != null
      ? [...pieces].sort((a, b) => {
          const aInGroup = a.groupId === draggedGroupId ? 1 : 0;
          const bInGroup = b.groupId === draggedGroupId ? 1 : 0;
          if (aInGroup !== bInGroup) return aInGroup - bInGroup;
          return a.z - b.z;
        })
      : pieces;

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
      drawEdgePieceHighlight(ctx, drawPieceData);
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
