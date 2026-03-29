/**
 * Updates document.title during play so tabs show progress (return visits, multitasking).
 * Restores the previous title on unmount.
 */
import { useEffect, useRef } from "react";
import type { PuzzleState } from "@/puzzle/core/types";

const BASE_TITLE = "Phuzzle";

export function usePlayDocumentTitle(state: PuzzleState | null, isDaily: boolean): void {
  const initialTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialTitleRef.current === null) {
      initialTitleRef.current = document.title || BASE_TITLE;
    }
    return () => {
      document.title = initialTitleRef.current ?? BASE_TITLE;
    };
  }, []);

  useEffect(() => {
    if (initialTitleRef.current === null) {
      initialTitleRef.current = document.title || BASE_TITLE;
    }

    if (!state) {
      document.title = BASE_TITLE;
      return;
    }

    if (state.isComplete) {
      document.title = isDaily
        ? `${BASE_TITLE} — Daily complete`
        : `${BASE_TITLE} — Puzzle complete`;
      return;
    }

    const placed = state.placedCount ?? 0;
    const total = state.totalCount ?? 0;
    const prefix = isDaily ? "Daily · " : "";
    document.title = `${BASE_TITLE} — ${prefix}${placed}/${total} pieces`;
  }, [state, isDaily]);
}
