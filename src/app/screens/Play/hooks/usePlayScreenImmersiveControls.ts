import { useCallback, useEffect } from "react";
import type { MutableRefObject } from "react";

type UsePlayScreenImmersiveControlsArgs = {
  immersiveMode: boolean;
  immersiveReveal: boolean;
  setImmersiveReveal: (value: boolean) => void;
  immersiveHideTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  toggleImmersiveMode: () => void;
};

export function usePlayScreenImmersiveControls({
  immersiveMode,
  immersiveReveal,
  setImmersiveReveal,
  immersiveHideTimerRef,
  toggleImmersiveMode,
}: UsePlayScreenImmersiveControlsArgs) {
  const showImmersiveUi = !immersiveMode || immersiveReveal;

  const scheduleImmersiveHide = useCallback(() => {
    if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
    immersiveHideTimerRef.current = setTimeout(() => {
      setImmersiveReveal(false);
    }, 2200);
  }, [immersiveHideTimerRef, setImmersiveReveal]);

  useEffect(
    () => () => {
      if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
    },
    [immersiveHideTimerRef],
  );

  const handleToggleImmersiveMode = useCallback(() => {
    const willEnable = !immersiveMode;
    toggleImmersiveMode();
    if (!willEnable) return;
    setImmersiveReveal(true);
    if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
    immersiveHideTimerRef.current = setTimeout(() => {
      setImmersiveReveal(false);
    }, 1800);
  }, [immersiveMode, toggleImmersiveMode, setImmersiveReveal, immersiveHideTimerRef]);

  const handleImmersiveReveal = useCallback(() => {
    if (!immersiveMode) return;
    setImmersiveReveal(true);
    if (immersiveHideTimerRef.current) clearTimeout(immersiveHideTimerRef.current);
  }, [immersiveMode, setImmersiveReveal, immersiveHideTimerRef]);

  return {
    showImmersiveUi,
    scheduleImmersiveHide,
    handleToggleImmersiveMode,
    handleImmersiveReveal,
  };
}
