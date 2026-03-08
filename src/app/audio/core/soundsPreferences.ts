/**
 * Load/save sound and music preferences from localStorage.
 * Used by SoundEngine in sounds.ts.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { clamp01 } from "./soundsDsp";

export type SnapSoundPref = "default" | "classic" | "soft" | "punchy" | "muted";
export type AudioProfile = "balanced" | "soft-mobile" | "low-stimulation";

const SOUND_ENABLED_KEY = "phuzzle:soundEnabled";
const SOUND_VOLUME_KEY = "phuzzle:soundVolume"; // legacy (maps to sfxVolume)
const SFX_VOLUME_KEY = "phuzzle:sfxVolume";
const MASTER_VOLUME_KEY = "phuzzle:masterVolume";
const HAPTICS_ENABLED_KEY = "phuzzle:hapticsEnabled";
const SNAP_SOUND_KEY = "phuzzle:snapSound";
const AUDIO_PROFILE_KEY = "phuzzle:audioProfile";
const MUSIC_ENABLED_KEY = "phuzzle:musicEnabled";
const MUSIC_VOLUME_KEY = "phuzzle:musicVolume";

export type SoundPreferences = {
  enabled: boolean;
  volume: number; // legacy alias of sfxVolume
  sfxVolume: number;
  masterVolume: number;
  hapticsEnabled: boolean;
  snapSoundPref: SnapSoundPref;
  audioProfile: AudioProfile;
  musicEnabled: boolean;
  musicVolume: number;
};

const DEFAULTS: SoundPreferences = {
  enabled: true,
  volume: 0.3,
  sfxVolume: 0.3,
  masterVolume: 0.9,
  hapticsEnabled: true,
  snapSoundPref: "default",
  audioProfile: "balanced",
  musicEnabled: false,
  musicVolume: 0.35,
};

export function loadSoundPreferencesFromStorage(): SoundPreferences {
  const enabled = safeLocalStorage.getItem(SOUND_ENABLED_KEY);
  const volume = safeLocalStorage.getItem(SOUND_VOLUME_KEY);
  const sfxVolume = safeLocalStorage.getItem(SFX_VOLUME_KEY);
  const masterVolume = safeLocalStorage.getItem(MASTER_VOLUME_KEY);
  const haptics = safeLocalStorage.getItem(HAPTICS_ENABLED_KEY);
  const snap = safeLocalStorage.getItem(SNAP_SOUND_KEY);
  const profile = safeLocalStorage.getItem(AUDIO_PROFILE_KEY);
  const m = safeLocalStorage.getItem(MUSIC_ENABLED_KEY);
  const mv = safeLocalStorage.getItem(MUSIC_VOLUME_KEY);

  const snapSoundPref: SnapSoundPref =
    snap !== null && ["default", "classic", "soft", "punchy", "muted"].includes(snap)
      ? (snap as SnapSoundPref)
      : DEFAULTS.snapSoundPref;

  const audioProfile: AudioProfile =
    profile !== null && ["balanced", "soft-mobile", "low-stimulation"].includes(profile)
      ? (profile as AudioProfile)
      : DEFAULTS.audioProfile;

  const resolvedSfxVolume =
    sfxVolume !== null
      ? clamp01(parseFloat(sfxVolume))
      : volume !== null
        ? clamp01(parseFloat(volume))
        : DEFAULTS.sfxVolume;

  return {
    enabled: enabled !== null ? enabled === "true" : DEFAULTS.enabled,
    volume: resolvedSfxVolume,
    sfxVolume: resolvedSfxVolume,
    masterVolume:
      masterVolume !== null ? clamp01(parseFloat(masterVolume)) : DEFAULTS.masterVolume,
    hapticsEnabled: haptics !== null ? haptics === "true" : DEFAULTS.hapticsEnabled,
    snapSoundPref,
    audioProfile,
    musicEnabled: m !== null ? m === "true" : DEFAULTS.musicEnabled,
    musicVolume: mv !== null ? clamp01(parseFloat(mv) || 0.35) : DEFAULTS.musicVolume,
  };
}

export function saveSoundPreference(
  key:
    | "enabled"
    | "volume"
    | "sfxVolume"
    | "masterVolume"
    | "hapticsEnabled"
    | "snapSoundPref"
    | "audioProfile"
    | "musicEnabled"
    | "musicVolume",
  value: boolean | number | SnapSoundPref | AudioProfile,
): void {
  const k =
    key === "enabled"
      ? SOUND_ENABLED_KEY
      : key === "volume"
        ? SOUND_VOLUME_KEY
        : key === "sfxVolume"
          ? SFX_VOLUME_KEY
          : key === "masterVolume"
            ? MASTER_VOLUME_KEY
            : key === "hapticsEnabled"
              ? HAPTICS_ENABLED_KEY
              : key === "snapSoundPref"
                ? SNAP_SOUND_KEY
                : key === "audioProfile"
                  ? AUDIO_PROFILE_KEY
                  : key === "musicEnabled"
                    ? MUSIC_ENABLED_KEY
                    : MUSIC_VOLUME_KEY;
  safeLocalStorage.setItem(k, String(value));
}
