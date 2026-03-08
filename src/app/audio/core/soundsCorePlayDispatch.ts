import type { SoundsSfxHelpers } from "@/audio/sfx/soundsSfxTypes";
import {
  playPickupSfx,
  playSnapSfx,
  playPlaceSfx,
  playRotateSfx,
  playUndoSfx,
  playCompleteSfx,
  playHoverSnapSfx,
  playLockSfx,
} from "@/audio/sfx/soundsSfx";
import { audioManager } from "@/audio/manager/audioManager";

export type SoundType =
  | "snap"
  | "place"
  | "rotate"
  | "complete"
  | "pickup"
  | "undo"
  | "lock"
  | "hoverSnap";

export function getSoundCooldownMs(sound: SoundType): number {
  switch (sound) {
    case "hoverSnap":
      return 140;
    case "snap":
      return 28;
    case "place":
      return 44;
    case "pickup":
      return 36;
    case "rotate":
      return 60;
    case "lock":
      return 28;
    case "complete":
      return 300;
    case "undo":
      return 70;
  }
}

export function shouldGateSound(
  sound: SoundType,
  lastPlayAtMs: Map<SoundType, number>,
): boolean {
  const now = performance.now();
  const last = lastPlayAtMs.get(sound) ?? -Infinity;
  const minGap = getSoundCooldownMs(sound);
  if (now - last < minGap) return true;
  lastPlayAtMs.set(sound, now);
  return false;
}

export function executePlay(
  ctx: AudioContext,
  sound: SoundType,
  opts: { groupSize?: number; proximity?: number } | undefined,
  sfxHelpers: SoundsSfxHelpers,
): void {
  if (sound === "complete") {
    audioManager.duckTransient(0.55, 1000);
  } else if (sound === "snap" || sound === "place" || sound === "lock") {
    audioManager.duckTransient(0.82, 150);
  }

  switch (sound) {
    case "pickup":
      playPickupSfx(ctx, sfxHelpers);
      break;
    case "snap":
      if (sfxHelpers.snapSoundPref === "muted") break;
      playSnapSfx(ctx, sfxHelpers, opts?.groupSize ?? 2);
      break;
    case "place":
      playPlaceSfx(ctx, sfxHelpers);
      break;
    case "rotate":
      playRotateSfx(ctx, sfxHelpers);
      break;
    case "complete":
      playCompleteSfx(ctx, sfxHelpers);
      break;
    case "undo":
      playUndoSfx(ctx, sfxHelpers);
      break;
    case "lock":
      playLockSfx(ctx, sfxHelpers);
      break;
    case "hoverSnap":
      playHoverSnapSfx(ctx, sfxHelpers, opts?.proximity ?? 0.5);
      break;
  }
}
