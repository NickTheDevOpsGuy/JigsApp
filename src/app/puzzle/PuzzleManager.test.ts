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
});
