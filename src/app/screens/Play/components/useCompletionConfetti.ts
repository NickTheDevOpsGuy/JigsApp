/**
 * Confetti effect when completion overlay mounts. No logic change.
 */
import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "@/hooks/useBatterySaver";
import { CONFETTI_COLORS_BY_THEME } from "@/data/confettiColors";

export function useCompletionConfetti(): void {
  const { theme } = useTheme();
  const batterySaverMode = useBatterySaver();

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || batterySaverMode) return;

    // Brief freeze then restrained light burst (premium, not screen-filling)
    const FREEZE_MS = 280;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const colors = CONFETTI_COLORS_BY_THEME[theme ?? "light"];
    import("canvas-confetti").then((confetti) => {
      const fn = confetti.default;
      timeouts.push(
        setTimeout(() => {
          fn({
            particleCount: 55,
            spread: 70,
            origin: { x: 0.5, y: 0.2 },
            colors,
            startVelocity: 18,
            decay: 0.92,
            ticks: 140,
            gravity: 0.6,
            scalar: 0.95,
          });
        }, FREEZE_MS),
      );
      timeouts.push(
        setTimeout(() => {
          fn({
            particleCount: 35,
            angle: 60,
            spread: 50,
            origin: { x: 0.15, y: 0.5 },
            colors,
            startVelocity: 14,
            scalar: 0.9,
          });
          fn({
            particleCount: 35,
            angle: 120,
            spread: 50,
            origin: { x: 0.85, y: 0.5 },
            colors,
            startVelocity: 14,
            scalar: 0.9,
          });
        }, FREEZE_MS + 100),
      );
    });
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [theme, batterySaverMode]);
}
