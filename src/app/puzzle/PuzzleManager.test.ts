import { describe, it, expect } from "vitest";
import { PuzzleManager } from "./PuzzleManager";

describe("PuzzleManager", () => {
  function createManager(overrides?: Partial<{ rows: number; cols: number }>) {
    return new PuzzleManager(
      {
        imageUrl: "data:image/png;base64,iVBORw0KGgo=",
        boardWidth: 200,
        boardHeight: 200,
        grid: { rows: overrides?.rows ?? 2, cols: overrides?.cols ?? 2 },
        pieceWidth: 80,
        pieceHeight: 80,
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

  it("rotatePiece rotates clockwise, rotatePieceCCW rotates counter-clockwise", () => {
    const manager = createManager();
    const pieces = manager.getState().pieces.filter(
      (p) => !p.inTray && !p.isPlaced && !p.locked,
    );
    if (pieces.length === 0) return;
    const piece = pieces[0];
    const initialRotation = piece.rotation;

    manager.rotatePiece(piece.id);
    let state = manager.getState();
    const afterCW =
      state.pieces.find((p) => p.id === piece.id)?.rotation ?? initialRotation;
    expect(afterCW).toBe((initialRotation + 90) % 360);

    manager.rotatePieceCCW(piece.id);
    state = manager.getState();
    const afterCCW =
      state.pieces.find((p) => p.id === piece.id)?.rotation ?? afterCW;
    expect(afterCCW).toBe(initialRotation);
  });

  it("mergeTrayPiecesIntoCluster assigns same groupId to selected tray pieces", () => {
    const manager = createManager();
    const pieces = manager.getState().pieces.filter(
      (p) => !p.inTray && !p.isPlaced && !p.locked,
    );
    if (pieces.length < 2) return;

    const [p1, p2] = pieces;
    manager.sendToTray(p1.id);
    manager.sendToTray(p2.id);

    const before = manager.getState();
    expect(before.pieces.find((p) => p.id === p1.id)?.groupId).not.toBe(
      before.pieces.find((p) => p.id === p2.id)?.groupId,
    );

    manager.mergeTrayPiecesIntoCluster([p1.id, p2.id]);

    const after = manager.getState();
    const g1 = after.pieces.find((p) => p.id === p1.id)?.groupId;
    const g2 = after.pieces.find((p) => p.id === p2.id)?.groupId;
    expect(g1).toBe(g2);
  });

  it("mergeTrayPiecesIntoCluster does nothing with fewer than 2 tray pieces", () => {
    const manager = createManager();
    const pieces = manager.getState().pieces.filter(
      (p) => !p.inTray && !p.isPlaced && !p.locked,
    );
    if (pieces.length === 0) return;

    manager.sendToTray(pieces[0].id);
    const before = manager.getState();
    manager.mergeTrayPiecesIntoCluster([pieces[0].id]);
    const after = manager.getState();
    expect(after).toEqual(before);
  });
});
