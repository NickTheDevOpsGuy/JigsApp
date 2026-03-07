/**
 * useFirstPieceCelebration – brief visual celebration when the first piece is correctly placed.
 * Fires once per puzzle (when placedCount goes 0 → 1) to encourage early engagement.
 * Restrained confetti burst; respects reduced motion and battery saver.
 */
import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "@/hooks/useBatterySaver";
import { CONFETTI_COLORS_BY_THEME } from "@/data/confettiColors";

export function useFirstPieceCelebration(
  placedCount: number,
  puzzleKey: string | number | null,
): void {
  const { theme } = useTheme();
  const batterySaverMode = useBatterySaver();
  const prevPlacedRef = useRef(0);
  const lastCelebratedPuzzleRef = useRef<string | number | null>(null);

  useEffect(() => {
    const justPlacedFirst = prevPlacedRef.current === 0 && placedCount === 1;
    prevPlacedRef.current = placedCount;

    if (puzzleKey == null) return;
    if (!justPlacedFirst || lastCelebratedPuzzleRef.current === puzzleKey) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || batterySaverMode) return;

    lastCelebratedPuzzleRef.current = puzzleKey;
    const colors = CONFETTI_COLORS_BY_THEME[theme ?? "light"];

    import("canvas-confetti").then((confetti) => {
      const fn = confetti.default;
      fn({
        particleCount: 28,
        spread: 52,
        origin: { x: 0.5, y: 0.45 },
        colors,
        startVelocity: 14,
        decay: 0.91,
        ticks: 100,
        gravity: 0.5,
        scalar: 0.85,
      });
    });
  }, [placedCount, puzzleKey, theme, batterySaverMode]);
}
