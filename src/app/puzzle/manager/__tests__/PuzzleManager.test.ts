import { describe, it, expect } from "vitest";
import { PuzzleManager } from "@/puzzle/manager/PuzzleManager";

describe("PuzzleManager", () => {
  function createManager(
    overrides?: Partial<{ rows: number; cols: number; isMobile: boolean }>,
  ) {
    return new PuzzleManager(
      {
        imageUrl: "data:image/png;base64,iVBORw0KGgo=",
        boardWidth: 200,
        boardHeight: 200,
        grid: { rows: overrides?.rows ?? 2, cols: overrides?.cols ?? 2 },
        pieceWidth: 80,
        pieceHeight: 80,
        isMobile: overrides?.isMobile ?? false,
      },
      {},
    );
  }

  it("returns state with pieces", () => {
    const manager = createManager();
    const state = manager.getState();
    expect(state.pieces).toBeDefined();
    expect(state.pieces.length).toBe(4);
    expect(state.placedCount).toBe(0);
    expect(state.isComplete).toBe(false);
  });

  it("getSnapPreviewState returns null when not dragging", () => {
    const manager = createManager();
    expect(manager.getSnapPreviewState()).toBeNull();
  });

  it("exposes board magnet preview when a dragged piece nears its target", () => {
    const manager = createManager();
    const piece = manager.getState().pieces[0];
    manager.movePieceFromTray(piece.id);
    let moved = manager.getState().pieces.find((p) => p.id === piece.id)!;

    // Board magnet preview is only when rotation === 0; rotate to 0 first
    while (moved.rotation !== 0) {
      manager.rotateGroup(moved.id);
      moved = manager.getState().pieces.find((p) => p.id === piece.id)!;
    }

    manager.pointerDownBoardSpace(piece.id, moved.x + 10, moved.y + 10);
    // Move toward target in steps so piece enters magnet radius (lerp means one move is not enough)
    const steps = 8;
    const offsetX = 10;
    const offsetY = 10;
    const finalPieceX = moved.targetX - moved.pad + 10;
    const finalPieceY = moved.targetY - moved.pad + 10;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const boardX =
        moved.x + offsetX + t * (finalPieceX + offsetX - (moved.x + offsetX));
      const boardY =
        moved.y + offsetY + t * (finalPieceY + offsetY - (moved.y + offsetY));
      manager.pointerMoveBoardSpace(boardX, boardY);
    }

    const preview = manager.getSnapPreviewState();
    expect(preview).not.toBeNull();
    expect(preview?.nearSnap).toBe(true);
    expect(preview?.kind).toBe("board");
  });

  it("uses pointerDownBoardSpace for programmatic drag (avoids DOMRect in tests)", () => {
    const manager = createManager();
    const pieceId = manager.getState().pieces[0].id;
    expect(manager.getDragState().activeId).toBeNull();
    manager.pointerDownBoardSpace(pieceId, 50, 50);
    expect(manager.getDragState().activeId).toBe(pieceId);
    manager.pointerMoveBoardSpace(60, 60);
    manager.pointerUp();
    expect(manager.getDragState().activeId).toBeNull();
    expect(manager.canUndo()).toBe(true);
  });

  it("reports correct placedCount and isComplete", () => {
    const manager = createManager({ rows: 2, cols: 2 });
    const state = manager.getState();
    expect(state.placedCount).toBe(0);
    expect(state.isComplete).toBe(false);
  });

  it("undo restores piece position after drag", () => {
    const manager = createManager();
    const pieceId = manager.getState().pieces[0].id;
    const initialY = manager.getState().pieces[0].y;

    manager.pointerDownBoardSpace(pieceId, 50, 50);
    manager.pointerMoveBoardSpace(50, 120);
    manager.pointerUp();

    expect(manager.canUndo()).toBe(true);
    manager.undo();
    const afterUndo = manager.getState().pieces.find((p) => p.id === pieceId)!;
    expect(afterUndo.y).toBe(initialY);
  });

  it("driftUnplacedPieces nudges unplaced groups", () => {
    const manager = createManager({ rows: 2, cols: 2 });
    const before = manager.getState().pieces.map((p) => ({ id: p.id, x: p.x, y: p.y }));
    manager.driftUnplacedPieces();
    const after = manager.getState().pieces;
    const moved = after.some((p, i) => p.x !== before[i].x || p.y !== before[i].y);
    expect(moved).toBe(true);
  });

  it("keeps dragged piece z above restored saved z values", () => {
    const manager = createManager({ rows: 2, cols: 2 });
    const initial = manager.getState();
    const saved = initial.pieces.map((p, i) => ({
      id: p.id,
      row: p.row,
      col: p.col,
      x: p.x,
      y: p.y,
      z: 100 + i,
      rotation: p.rotation,
      isPlaced: p.isPlaced,
      locked: p.locked,
      groupId: p.groupId,
      inTray: p.inTray,
      dragCount: p.dragCount ?? 0,
    }));
    manager.restoreFromSaved(saved);

    const beforeDragMaxZ = Math.max(...manager.getState().pieces.map((p) => p.z));
    const pieceId = manager.getState().pieces[0].id;

    manager.pointerDownBoardSpace(pieceId, 10, 10);
    const draggedPiece = manager.getState().pieces.find((p) => p.id === pieceId);
    expect(draggedPiece).toBeTruthy();
    expect(draggedPiece!.z).toBeGreaterThan(beforeDragMaxZ);
  });

  it("keeps mobile board pieces reachable when dragged to the edge", () => {
    const manager = createManager({ rows: 3, cols: 3, isMobile: true });
    const pieceId = manager.getState().pieces[0].id;
    manager.movePieceFromTray(pieceId);
    const piece = manager.getState().pieces.find((p) => p.id === pieceId)!;

    manager.pointerDownBoardSpace(pieceId, piece.x + 10, piece.y + 10);
    manager.pointerMoveBoardSpace(-1000, -1000);
    manager.pointerUp();

    const moved = manager.getState().pieces.find((p) => p.id === pieceId)!;
    const pad = 12;
    expect(moved.x).toBeGreaterThanOrEqual(-pad - 10);
    expect(moved.y).toBeGreaterThanOrEqual(-pad - 10);
  });

  it("clamps legacy offscreen board pieces when restoring on mobile", () => {
    const manager = createManager({ rows: 3, cols: 3, isMobile: true });
    const pieceId = manager.getState().pieces[0].id;
    manager.movePieceFromTray(pieceId);
    const state = manager.getState();

    const saved = state.pieces.map((p) => ({
      id: p.id,
      row: p.row,
      col: p.col,
      x: p.id === pieceId ? -999 : p.x,
      y: p.id === pieceId ? -999 : p.y,
      z: p.z,
      rotation: p.rotation,
      isPlaced: p.isPlaced,
      locked: p.locked,
      groupId: p.groupId,
      inTray: p.inTray,
      dragCount: p.dragCount ?? 0,
    }));

    manager.restoreFromSaved(saved);

    const restored = manager.getState().pieces.find((p) => p.id === pieceId)!;
    expect(restored.x).toBeGreaterThanOrEqual(0);
    expect(restored.y).toBeGreaterThanOrEqual(0);
  });

  it("unlocks restored non-complete pieces when piece locking is disabled", () => {
    const manager = createManager({ rows: 2, cols: 2 });
    const state = manager.getState();
    const targetId = state.pieces[0].id;

    const saved = state.pieces.map((p) => ({
      id: p.id,
      row: p.row,
      col: p.col,
      x: p.x,
      y: p.y,
      z: p.z,
      rotation: p.rotation,
      isPlaced: false,
      locked: true,
      groupId: p.groupId,
      inTray: p.inTray,
      dragCount: p.dragCount ?? 0,
    }));
    manager.restoreFromSaved(saved);
    manager.setPieceLockingEnabled(false);

    const unlocked = manager.getState().pieces.find((p) => p.id === targetId)!;
    expect(unlocked.locked).toBe(false);

    manager.pointerDownBoardSpace(targetId, unlocked.x + 5, unlocked.y + 5);
    expect(manager.getDragState().activeId).toBe(targetId);
  });

  it("keeps unlocked members movable when restoring mixed locked groups", () => {
    const manager = createManager({ rows: 2, cols: 2 });
    const state = manager.getState();
    const [anchor, other] = state.pieces;
    const sharedGroupId = anchor.groupId;

    const saved = state.pieces.map((p, index) => {
      return {
        id: p.id,
        row: p.row,
        col: p.col,
        x: p.x,
        y: p.y,
        z: p.z,
        rotation: p.rotation,
        isPlaced: false,
        locked: index === 0,
        groupId: index <= 1 ? sharedGroupId : p.groupId,
        inTray: index <= 1 ? false : p.inTray,
        dragCount: p.dragCount ?? 0,
      };
    });

    manager.restoreFromSaved(saved);
    const movableCandidate = manager.getState().pieces.find((p) => p.id === other.id)!;
    expect(movableCandidate.locked).toBe(false);

    manager.pointerDownBoardSpace(
      movableCandidate.id,
      movableCandidate.x + 4,
      movableCandidate.y + 4,
    );
    expect(manager.getDragState().activeId).toBe(movableCandidate.id);
  });
});
