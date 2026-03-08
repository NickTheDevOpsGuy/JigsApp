import type { GroupBounds } from "@/puzzle/groups/groupUtils";
import { clamp } from "@/puzzle/manager/state/puzzleManagerUtils";

type Delta = { dx: number; dy: number };

export function clampGroupDeltaToBoardExtents(
  bounds: GroupBounds,
  dx: number,
  dy: number,
  boardWidth: number,
  boardHeight: number,
  pad: number,
  overflow: number,
): Delta {
  const minDx = -pad - bounds.minX - overflow;
  const maxDx = boardWidth + pad - bounds.maxX + overflow;
  const minDy = -pad - bounds.minY - overflow;
  const maxDy = boardHeight + pad - bounds.maxY + overflow;

  return {
    dx: clamp(dx, minDx, maxDx),
    dy: clamp(dy, minDy, maxDy),
  };
}

export function clampInsideBoardInterior(
  bounds: GroupBounds,
  boardWidth: number,
  boardHeight: number,
  boardInset: number,
): Delta {
  const innerMinX = boardInset;
  const innerMaxX = boardWidth - boardInset;
  const innerMinY = boardInset;
  const innerMaxY = boardHeight - boardInset;
  const boundsW = bounds.maxX - bounds.minX;
  const boundsH = bounds.maxY - bounds.minY;

  let dx = 0;
  let dy = 0;

  if (boundsW >= innerMaxX - innerMinX) {
    const boundsCx = (bounds.minX + bounds.maxX) / 2;
    const innerCx = (innerMinX + innerMaxX) / 2;
    dx = innerCx - boundsCx;
  } else if (bounds.minX < innerMinX) {
    dx = innerMinX - bounds.minX;
  } else if (bounds.maxX > innerMaxX) {
    dx = innerMaxX - bounds.maxX;
  }

  if (boundsH >= innerMaxY - innerMinY) {
    const boundsCy = (bounds.minY + bounds.maxY) / 2;
    const innerCy = (innerMinY + innerMaxY) / 2;
    dy = innerCy - boundsCy;
  } else if (bounds.minY < innerMinY) {
    dy = innerMinY - bounds.minY;
  } else if (bounds.maxY > innerMaxY) {
    dy = innerMaxY - bounds.maxY;
  }

  return { dx, dy };
}

export function clampInsideDragBounds(
  bounds: GroupBounds,
  boardWidth: number,
  boardHeight: number,
  pad: number,
  overflow: number,
): Delta {
  const minX = -pad - overflow;
  const maxX = boardWidth + pad + overflow;
  const minY = -pad - overflow;
  const maxY = boardHeight + pad + overflow;

  let dx = 0;
  let dy = 0;

  if (bounds.minX < minX) {
    dx = minX - bounds.minX;
  } else if (bounds.maxX > maxX) {
    dx = maxX - bounds.maxX;
  }

  if (bounds.minY < minY) {
    dy = minY - bounds.minY;
  } else if (bounds.maxY > maxY) {
    dy = maxY - bounds.maxY;
  }

  return { dx, dy };
}
