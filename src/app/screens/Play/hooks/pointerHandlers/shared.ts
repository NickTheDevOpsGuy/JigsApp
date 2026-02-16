/**
 * Shared pointer logic: finishDragWithTrayCheck, screen-to-board conversion.
 */
import type { PuzzleManager } from "@/puzzle/PuzzleManager";

export function finishDragWithTrayCheck(
  manager: PuzzleManager,
  clientX: number,
  clientY: number,
  isPointerOverTray: (x: number, y: number) => boolean,
  selectCycle: (dir: 1 | -1) => void,
): void {
  const activeId = manager.getDragState().activeId;
  if (activeId && isPointerOverTray(clientX, clientY)) {
    const st = manager.getState();
    const piece = st.pieces.find((p) => p.id === activeId);
    const groupSize = piece
      ? st.pieces.filter((p) => p.groupId === piece.groupId).length
      : 0;
    if (groupSize === 1) {
      manager.pointerUp();
      manager.sendToTray(activeId);
      selectCycle(1);
    } else {
      manager.pointerUp();
    }
  } else {
    manager.pointerUp();
  }
}
