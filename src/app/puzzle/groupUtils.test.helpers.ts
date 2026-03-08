import type { Piece } from "./types";

export function makePiece(
  overrides: Partial<Piece> & { id: string; row: number; col: number },
): Piece {
  return {
    id: overrides.id,
    row: overrides.row,
    col: overrides.col,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    z: overrides.z ?? 0,
    w: overrides.w ?? 50,
    h: overrides.h ?? 50,
    pad: overrides.pad ?? 10,
    tileW: overrides.tileW ?? 40,
    tileH: overrides.tileH ?? 40,
    targetX: overrides.targetX ?? 0,
    targetY: overrides.targetY ?? 0,
    rotation: overrides.rotation ?? 0,
    targetRotation: overrides.targetRotation ?? 0,
    isPlaced: overrides.isPlaced ?? false,
    locked: overrides.locked ?? false,
    groupId: overrides.groupId ?? overrides.id,
    inTray: overrides.inTray ?? false,
    shapePath: overrides.shapePath ?? "",
  } as Piece;
}

