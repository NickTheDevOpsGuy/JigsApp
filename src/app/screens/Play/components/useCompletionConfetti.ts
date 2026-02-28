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

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const colors = CONFETTI_COLORS_BY_THEME[theme ?? "light"];
    import("canvas-confetti").then((confetti) => {
      const fn = confetti.default;
      fn({
        particleCount: 180,
        spread: 75,
        origin: { x: 0.5, y: 0.15 },
        colors,
        startVelocity: 28,
        decay: 0.94,
        ticks: 220,
        gravity: 0.8,
      });
      timeouts.push(
        setTimeout(() => {
          fn({
            particleCount: 65,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.55 },
            colors,
            startVelocity: 24,
            scalar: 1.1,
          });
          fn({
            particleCount: 65,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.55 },
            colors,
            startVelocity: 24,
            scalar: 1.1,
          });
        }, 120),
      );
      timeouts.push(
        setTimeout(() => {
          fn({
            particleCount: 80,
            spread: 100,
            origin: { x: 0.5, y: 0.7 },
            colors,
            angle: 90,
            startVelocity: 18,
            decay: 0.92,
          });
        }, 350),
      );
    });
    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [theme, batterySaverMode]);
}
