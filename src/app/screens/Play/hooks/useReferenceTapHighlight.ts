/**
 * Reference image tap-to-highlight: tap on preview to highlight nearby tray pieces.
 * Hints only after INACTIVITY_GATE_MS of no placements (professional design).
 */
import type { MutableRefObject } from "react";
import { useCallback, useRef, useState } from "react";
import type { Piece, PuzzleState } from "@/puzzle/types";

const COOLDOWN_MS = 3000;
const INACTIVITY_GATE_MS = 30_000; // Allow hint only after 30s without placing a piece
const HIGHLIGHT_DURATION_MS = 2200;
const MAX_CANDIDATES = 10;

export function useReferenceTapHighlight(
  state: PuzzleState | null,
  lastPlacementOrInteractionRef?: MutableRefObject<number> | null,
) {
  const [highlightedPieceIds, setHighlightedPieceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const lastTapRef = useRef(0);

  const clearHighlight = useCallback(() => {
    setHighlightedPieceIds(new Set());
  }, []);

  const onPreviewTap = useCallback(
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      if (performance.now() - lastTapRef.current < COOLDOWN_MS) return;
      if (!state) return;
      const now = performance.now();
      if (
        lastPlacementOrInteractionRef &&
        now - lastPlacementOrInteractionRef.current < INACTIVITY_GATE_MS
      ) {
        return; // Hint only after 30s of inactivity
      }

      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const clientX =
        "clientX" in e
          ? e.clientX
          : ((e as React.TouchEvent).changedTouches?.[0]?.clientX ??
            (e as React.TouchEvent).touches?.[0]?.clientX);
      const clientY =
        "clientY" in e
          ? e.clientY
          : ((e as React.TouchEvent).changedTouches?.[0]?.clientY ??
            (e as React.TouchEvent).touches?.[0]?.clientY);
      if (clientX == null || clientY == null) return;

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      const { rows, cols } = state.grid;
      const col = Math.floor(Math.max(0, Math.min(1, x)) * cols);
      const row = Math.floor(Math.max(0, Math.min(1, y)) * rows);

      const candidates: Piece[] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            const p = state.pieces.find((x) => x.row === r && x.col === c && x.inTray);
            if (p) candidates.push(p);
          }
        }
      }

      const ids = new Set(candidates.slice(0, MAX_CANDIDATES).map((p) => p.id));
      if (ids.size > 0) {
        lastTapRef.current = now;
        setHighlightedPieceIds(ids);
        setTimeout(() => setHighlightedPieceIds(new Set()), HIGHLIGHT_DURATION_MS);
      }
    },
    [state, lastPlacementOrInteractionRef],
  );

  return { highlightedPieceIds, onPreviewTap, clearHighlight };
}
