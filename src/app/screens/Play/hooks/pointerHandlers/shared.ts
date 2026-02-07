import type { PuzzleManager } from "@/puzzle/PuzzleManager";

export function finishDragWithTrayCheck(
  manager: PuzzleManager,
  clientX: number,
  clientY: number,
  isPointerOverTray: (x: number, y: number) => boolean,
  selectCycle: (dir: 1 | -1) => void,
): void {
  const activeId = manager.getDragState().activeId;
  const overTray = Boolean(activeId) && isPointerOverTray(clientX, clientY);

  if (activeId && overTray) {
    const st = manager.getState();
    const piece = st.pieces.find((p) => p.id === activeId);
    const groupSize = piece
      ? st.pieces.filter((p) => p.groupId === piece.groupId).length
      : 0;

    if (groupSize === 1) {
      manager.cancelDrag();
      manager.sendToTray(activeId);
      selectCycle(1);
      return;
    }
  }

  manager.pointerUp();
}
