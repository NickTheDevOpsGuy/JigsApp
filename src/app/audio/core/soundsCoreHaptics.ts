import type { SoundType } from "./soundsCore";

function vibrate(enabled: boolean, pattern: number | number[]) {
  if (!enabled) return;
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

export function triggerHaptic(
  sound: SoundType,
  hapticsEnabled: boolean,
  groupSize?: number,
) {
  switch (sound) {
    case "pickup":
      vibrate(hapticsEnabled, 10);
      break;
    case "snap": {
      const snapStrength = groupSize != null ? Math.min(50, 15 + groupSize * 6) : 25;
      vibrate(hapticsEnabled, snapStrength);
      break;
    }
    case "place":
      vibrate(hapticsEnabled, 30);
      break;
    case "rotate":
      vibrate(hapticsEnabled, 12);
      break;
    case "complete":
      vibrate(hapticsEnabled, [40, 45, 40, 45, 90]);
      break;
    case "undo":
      vibrate(hapticsEnabled, 18);
      break;
  }
}
