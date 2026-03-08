import { useEffect } from "react";
import type React from "react";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { PuzzleState } from "@/puzzle/core/types";

export function useManagerBoardResize(
  boardRef: React.RefObject<HTMLDivElement | null>,
  manager: PuzzleManager | null,
  setState: (st: PuzzleState) => void,
) {
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl || !manager) return;

    let debounceId: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        debounceId = null;
        const rect = boardEl.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        if (w <= 0 || h <= 0) return;
        manager.setBoardSize(w, h);
        setState(manager.getState());
      }, 80);
    });

    ro.observe(boardEl);
    return () => {
      if (debounceId) clearTimeout(debounceId);
      ro.disconnect();
    };
  }, [boardRef, manager, setState]);
}
