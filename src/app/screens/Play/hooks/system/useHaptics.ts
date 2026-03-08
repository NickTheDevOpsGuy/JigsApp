/**
 * useHaptics – Vibration API for tap/rotate/snap/place/complete; best-effort on iOS.
 */
import { useCallback, useMemo } from "react";
import { soundManager } from "@/audio/core/sounds";

export type HapticKind = "tap" | "rotate" | "snap" | "place" | "complete";

const PATTERN_MS: Record<HapticKind, number | number[]> = {
  tap: 15,
  rotate: 20,
  snap: 30,
  place: 25,
  complete: [20, 40, 20],
};

/**
 * Best-effort haptics.
 *
 * Place and snap feedback are triggered from usePlayScreenManager when pieces
 * are placed or snap into position (when haptics are enabled in settings).
 *
 * Notes:
 * - On iOS Safari, `navigator.vibrate` is often unavailable or ignored.
 * - We only call vibrate in direct response to user actions/events.
 */
export function useHaptics() {
  const canVibrate = useMemo(() => {
    return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  }, []);

  const enabled = soundManager.isHapticsEnabled();

  const setEnabled = useCallback((next: boolean) => {
    soundManager.setHapticsEnabled(next);
  }, []);

  const vibrate = useCallback(
    (kind: HapticKind) => {
      if (!canVibrate) return;
      if (!soundManager.isHapticsEnabled()) return;
      try {
        navigator.vibrate(PATTERN_MS[kind]);
      } catch {
        // ignore
      }
    },
    [canVibrate],
  );

  return { canVibrate, enabled, setEnabled, vibrate };
}
