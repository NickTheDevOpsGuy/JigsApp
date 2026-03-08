/**
 * Shared pointer logic: finishDragWithTrayCheck, screen-to-board conversion.
 */
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type React from "react";

const TRAY_EDGE_SCROLL_ZONE_PX = 56;
const TRAY_EDGE_SCROLL_MAX_PX_PER_MOVE = 24;

/** Auto-scroll tray horizontally when dragging near left/right edge of the tray scroller. */
export function autoScrollTrayAtPointer(
  trayRef: React.RefObject<HTMLDivElement | null>,
  clientX: number,
  clientY: number,
): void {
  const trayRoot = trayRef.current;
  if (!trayRoot) return;
  const scroller = trayRoot.querySelector<HTMLElement>('[role="list"]');
  if (!scroller) return;

  const rect = scroller.getBoundingClientRect();
  const withinVerticalBand = clientY >= rect.top - 20 && clientY <= rect.bottom + 20;
  if (!withinVerticalBand) return;

  let scrollDelta = 0;
  if (clientX < rect.left + TRAY_EDGE_SCROLL_ZONE_PX) {
    const t = 1 - (clientX - rect.left) / TRAY_EDGE_SCROLL_ZONE_PX;
    scrollDelta = -Math.max(0, t) * TRAY_EDGE_SCROLL_MAX_PX_PER_MOVE;
  } else if (clientX > rect.right - TRAY_EDGE_SCROLL_ZONE_PX) {
    const t = 1 - (rect.right - clientX) / TRAY_EDGE_SCROLL_ZONE_PX;
    scrollDelta = Math.max(0, t) * TRAY_EDGE_SCROLL_MAX_PX_PER_MOVE;
  }

  if (scrollDelta !== 0) {
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const next = Math.max(0, Math.min(maxScroll, scroller.scrollLeft + scrollDelta));
    if (next !== scroller.scrollLeft) {
      scroller.scrollLeft = next;
    }
  }
}

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
