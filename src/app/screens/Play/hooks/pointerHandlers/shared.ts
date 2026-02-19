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
    manager.pointerUp();
    manager.sendToTray(activeId);
    selectCycle(1);
  } else {
    manager.pointerUp();
  }
}
