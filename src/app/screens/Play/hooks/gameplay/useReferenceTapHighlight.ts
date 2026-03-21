import { useCallback, useState } from "react";
import type { PuzzleState } from "@/puzzle/core/types";

export function useReferenceTapHighlight(
  _state: PuzzleState | null,
  _lastInteractionRef: React.MutableRefObject<number>,
) {
  const [highlightedPieceIds, setHighlightedPieceIds] = useState<Set<string>>(new Set());

  const onPreviewTap = useCallback((_e: React.MouseEvent<HTMLDivElement>) => {
    setHighlightedPieceIds(new Set());
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedPieceIds(new Set());
  }, []);

  return { highlightedPieceIds, onPreviewTap, clearHighlight };
}
