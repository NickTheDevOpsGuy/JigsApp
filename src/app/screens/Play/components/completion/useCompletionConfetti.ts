/**
 * Completion overlay: brief confetti burst when puzzle is complete.
 * Respects reduced motion and battery/data-saver.
 */
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useTheme } from "@/hooks/useTheme";
import { useBatterySaver } from "@/hooks/useBatterySaver";
import { CONFETTI_COLORS_BY_THEME } from "@/data/content/confettiColors";

export function useCompletionConfetti(): void {
  const { theme } = useTheme();
  const batterySaver = useBatterySaver();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || batterySaver) return;

    firedRef.current = true;
    const colors = CONFETTI_COLORS_BY_THEME[theme] ?? CONFETTI_COLORS_BY_THEME.light;

    const fire = (opts: { angle?: number; spread?: number; startVelocity?: number }) => {
      confetti({
        particleCount: 55,
        spread: 70,
        origin: { y: 0.55 },
        colors,
        scalar: 0.9,
        disableForReducedMotion: true,
        ...opts,
      });
    };

    fire({ angle: 60, spread: 55, startVelocity: 45 });
    fire({ angle: 120, spread: 55, startVelocity: 45 });
    const t1 = setTimeout(() => fire({ angle: 90, spread: 50, startVelocity: 35 }), 120);
    const t2 = setTimeout(
      () =>
        confetti({
          particleCount: 35,
          spread: 360,
          origin: { x: 0.5, y: 0.55 },
          colors,
          scalar: 0.85,
          disableForReducedMotion: true,
          startVelocity: 25,
        }),
      280,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [theme, batterySaver]);
}
