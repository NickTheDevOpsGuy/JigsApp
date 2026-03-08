/**
 * useFirstPieceCelebration – no confetti; kept for hook shape when first piece is placed.
 */
import { useEffect, useRef } from "react";

export function useFirstPieceCelebration(
  placedCount: number,
  puzzleKey: string | number | null,
): void {
  const prevPlacedRef = useRef(0);

  useEffect(() => {
    prevPlacedRef.current = placedCount;
    /* Confetti disabled; glow/UI only. */
  }, [placedCount, puzzleKey]);
}
