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

  if (viewport && (viewport.scale !== 1 || viewport.panX !== 0 || viewport.panY !== 0)) {
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.scale, viewport.scale);
  }

  const { cols, rows } = state.grid;

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
    .sort((a, b) => a.z - b.z);

  const overrides = animState?.undoSnapBackOverrides ?? animState?.dragDisplayOverrides;
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

  if (viewport && (viewport.scale !== 1 || viewport.panX !== 0 || viewport.panY !== 0)) {
    ctx.restore();
  }

  if (animState?.isComplete && animState.completedAtMs) {
    drawCompletionGlow(ctx, cssW, cssH, nowMs - animState.completedAtMs);
  }
}
