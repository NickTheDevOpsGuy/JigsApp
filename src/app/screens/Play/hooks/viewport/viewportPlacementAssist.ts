import type { Piece } from "@/puzzle/core/types";
import {
  clampPan,
  type ViewportBounds,
} from "@/screens/Play/hooks/viewport/viewportMath";
import {
  MAX_SCALE,
  type ViewportState,
} from "@/screens/Play/hooks/viewport/viewportStorage";

/**
 * Map a point in puzzle board space (same as piece `x` / `y` origins) to board-relative
 * CSS coordinates (same space as wheel zoom / `buildWheelZoomTarget`), inverse of
 * `usePlayScreenBoardInteractions` `screenToBoard`.
 */
export function boardPointToBoardLocalCss(
  boardX: number,
  boardY: number,
  pieces: Piece[],
  grid: { rows: number; cols: number },
  boardCssW: number,
  boardCssH: number,
  viewport: ViewportState,
): { cssX: number; cssY: number } | null {
  const first = pieces[0];
  if (!first) return null;
  const assembledW = grid.cols * first.tileW;
  const assembledH = grid.rows * first.tileH;
  const piece00 = pieces.find((p) => p.row === 0 && p.col === 0);
  const pad = piece00?.pad ?? 18;
  const boardOffsetX = piece00 ? piece00.pad - piece00.targetX : 0;
  const boardOffsetY = piece00 ? piece00.pad - piece00.targetY : 0;
  const contentW = assembledW + 2 * pad;
  const contentH = assembledH + 2 * pad;
  const fitScale =
    contentW > 0 && contentH > 0
      ? Math.min(1, boardCssW / contentW, boardCssH / contentH)
      : 1;
  const drawW = contentW * fitScale;
  const drawH = contentH * fitScale;
  const fitOffsetX = (boardCssW - drawW) / 2;
  const fitOffsetY = (boardCssH - drawH) / 2;
  const vx = (boardX + boardOffsetX) * viewport.scale + viewport.panX;
  const vy = (boardY + boardOffsetY) * viewport.scale + viewport.panY;
  return {
    cssX: vx * fitScale + fitOffsetX,
    cssY: vy * fitScale + fitOffsetY,
  };
}

/** Centroid of board pieces in the dragged group (container centers). */
export function centroidOfDraggedGroup(
  pieces: Piece[],
  activeId: string,
): { x: number; y: number } | null {
  const active = pieces.find((p) => p.id === activeId);
  if (!active || active.inTray) return null;
  const gid = active.groupId;
  const group = pieces.filter((p) => !p.inTray && p.groupId === gid);
  if (group.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const p of group) {
    sx += p.x + p.w / 2;
    sy += p.y + p.h / 2;
  }
  return { x: sx / group.length, y: sy / group.length };
}

/** Zoom slightly toward a canvas-local point; clamps pan to bounds. */
export function buildPlacementAssistTarget(
  viewport: ViewportState,
  focalCssX: number,
  focalCssY: number,
  bounds: ViewportBounds | null,
  /** Scale multiplier, e.g. 1.04 */
  scaleMultiplier: number,
): ViewportState {
  const newScale = Math.min(MAX_SCALE, viewport.scale * scaleMultiplier);
  const scaleFactor = newScale / viewport.scale;
  let panX = focalCssX - (focalCssX - viewport.panX) * scaleFactor;
  let panY = focalCssY - (focalCssY - viewport.panY) * scaleFactor;
  if (bounds) {
    const c = clampPan(newScale, panX, panY, bounds);
    panX = c.panX;
    panY = c.panY;
  }
  return { scale: newScale, panX, panY };
}
