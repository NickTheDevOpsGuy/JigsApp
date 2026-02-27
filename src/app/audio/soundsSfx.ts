/**
 * Theme-aware SFX builders for SoundEngine.
 * Implementations split into: soundsSfxTypes, soundsSfxSnap, soundsSfxMisc, soundsSfxComplete.
 */
export type {
  SnapSoundPref,
  Theme,
  SoundsSfxPlayTone,
  SoundsSfxPlayNoiseClick,
  SoundsSfxHelpers,
  Note,
} from "./soundsSfxTypes";
export { clamp01 } from "./soundsSfxTypes";

export { playSnapByPrefSfx, playSnapSfx } from "./soundsSfxSnap";
export { playPickupSfx, playPlaceSfx, playRotateSfx, playUndoSfx } from "./soundsSfxMisc";
export { playCompleteSfx } from "./soundsSfxComplete";
