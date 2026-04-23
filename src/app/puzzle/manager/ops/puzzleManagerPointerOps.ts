import type { DragState, Piece } from "@/puzzle/core/types";

type UpdatePieces = (
  predicate: (p: Piece) => boolean,
  updater: (p: Piece) => Partial<Piece>,
) => void;

type FindPiece = (id: string) => Piece | null;
type IsGroupLocked = (groupId: string) => boolean;
type ShiftGroup = (groupId: string, dx: number, dy: number) => void;
type ComputeSnapPreview = () => DragState["preview"];

const DRAG_LERP_FACTOR = 0.85;

function applyMagneticDragDelta(
  shiftGroup: ShiftGroup,
  groupId: string,
  desiredDx: number,
  desiredDy: number,
  computeSnapPreview: ComputeSnapPreview,
  magneticSnapEnabled: boolean,
): DragState["preview"] {
  if (!magneticSnapEnabled) {
    shiftGroup(groupId, desiredDx, desiredDy);
    return null;
  }

  const moveDx = Math.abs(desiredDx) < 0.35 ? desiredDx : desiredDx * DRAG_LERP_FACTOR;
  const moveDy = Math.abs(desiredDy) < 0.35 ? desiredDy : desiredDy * DRAG_LERP_FACTOR;
  shiftGroup(groupId, moveDx, moveDy);

  const preview = computeSnapPreview();
  if (!preview || preview.magnetStrength <= 0) return preview;

  const magnetDx = preview.dx * preview.magnetStrength;
  const magnetDy = preview.dy * preview.magnetStrength;
  if (Math.abs(magnetDx) < 0.1 && Math.abs(magnetDy) < 0.1) return preview;
  shiftGroup(groupId, magnetDx, magnetDy);
  return preview;
}

export function pointerDownOp(params: {
  pieceId: string;
  clientX: number;
  clientY: number;
  pieceRect: DOMRect;
  findPiece: FindPiece;
  isGroupLocked: IsGroupLocked;
  pushUndoState: () => void;
  updatePieces: UpdatePieces;
  zCounter: number;
}): { drag: DragState | null; zCounter: number } {
  const { pieceId, clientX, clientY, pieceRect } = params;
  const piece = params.findPiece(pieceId);
  if (!piece || piece.isPlaced || piece.locked || params.isGroupLocked(piece.groupId)) {
    return { drag: null, zCounter: params.zCounter };
  }

  params.pushUndoState();
  const nextZ = params.zCounter + 1;
  params.updatePieces(
    (p) => p.groupId === piece.groupId,
    (p) => ({
      z: nextZ,
      dragCount: (p.dragCount ?? 0) + 1,
    }),
  );

  return {
    zCounter: nextZ,
    drag: {
      activeId: pieceId,
      offsetX: clientX - pieceRect.left,
      offsetY: clientY - pieceRect.top,
      preview: null,
    },
  };
}

export function pointerMoveOp(params: {
  clientX: number;
  clientY: number;
  boardRect: DOMRect;
  drag: DragState;
  findPiece: FindPiece;
  shiftGroup: ShiftGroup;
  computeSnapPreview: ComputeSnapPreview;
  magneticSnapEnabled: boolean;
}): DragState {
  const { drag } = params;
  const activeId = drag.activeId;
  if (!activeId) return drag;
  const piece = params.findPiece(activeId);
  if (!piece) return drag;

  const newX = params.clientX - params.boardRect.left - drag.offsetX;
  const newY = params.clientY - params.boardRect.top - drag.offsetY;
  const desiredDx = newX - piece.x;
  const desiredDy = newY - piece.y;
  const preview = applyMagneticDragDelta(
    params.shiftGroup,
    piece.groupId,
    desiredDx,
    desiredDy,
    params.computeSnapPreview,
    params.magneticSnapEnabled,
  );

  return {
    ...drag,
    preview,
  };
}

export function pointerDownBoardSpaceOp(params: {
  pieceId: string;
  boardX: number;
  boardY: number;
  findPiece: FindPiece;
  isGroupLocked: IsGroupLocked;
  pushUndoState: () => void;
  updatePieces: UpdatePieces;
  zCounter: number;
}): { drag: DragState | null; zCounter: number } {
  const { pieceId, boardX, boardY } = params;
  const piece = params.findPiece(pieceId);
  if (!piece || piece.isPlaced || piece.locked || params.isGroupLocked(piece.groupId)) {
    return { drag: null, zCounter: params.zCounter };
  }

  params.pushUndoState();
  const nextZ = params.zCounter + 1;
  params.updatePieces(
    (p) => p.groupId === piece.groupId,
    () => ({ z: nextZ }),
  );

  return {
    zCounter: nextZ,
    drag: {
      activeId: pieceId,
      offsetX: boardX - piece.x,
      offsetY: boardY - piece.y,
      preview: null,
    },
  };
}

export function pointerMoveBoardSpaceOp(params: {
  boardX: number;
  boardY: number;
  drag: DragState;
  findPiece: FindPiece;
  shiftGroup: ShiftGroup;
  computeSnapPreview: ComputeSnapPreview;
  magneticSnapEnabled: boolean;
}): DragState {
  const { drag } = params;
  const activeId = drag.activeId;
  if (!activeId) return drag;
  const piece = params.findPiece(activeId);
  if (!piece) return drag;

  const newX = params.boardX - drag.offsetX;
  const newY = params.boardY - drag.offsetY;
  const desiredDx = newX - piece.x;
  const desiredDy = newY - piece.y;
  const preview = applyMagneticDragDelta(
    params.shiftGroup,
    piece.groupId,
    desiredDx,
    desiredDy,
    params.computeSnapPreview,
    params.magneticSnapEnabled,
  );

  return {
    ...drag,
    preview,
  };
}

export function pointerUpOp(params: {
  drag: DragState;
  trySnapActiveGroupToNeighbor: () => boolean;
  trySnapActiveGroupToBoard: () => boolean;
  tryNearSnapNudge: () => void;
  clampAllBoardGroupsInsideBoardInterior: () => void;
  recomputeDerivedState: () => void;
}): DragState {
  if (!params.drag.activeId) return params.drag;

  params.trySnapActiveGroupToNeighbor();
  params.trySnapActiveGroupToBoard();

  /* No nudge: only actual snaps move pieces to correct position; dragging near target does not. */

  params.clampAllBoardGroupsInsideBoardInterior();
  params.recomputeDerivedState();
  return {
    activeId: null,
    offsetX: 0,
    offsetY: 0,
    preview: null,
  };
}
