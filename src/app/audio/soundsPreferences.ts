/**
 * Load/save sound and music preferences from localStorage.
 * Used by SoundEngine in sounds.ts.
 */
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { clamp01 } from "./soundsDsp";

export type SnapSoundPref = "default" | "classic" | "soft" | "punchy" | "muted";

const SOUND_ENABLED_KEY = "phuzzle:soundEnabled";
const SOUND_VOLUME_KEY = "phuzzle:soundVolume";
const HAPTICS_ENABLED_KEY = "phuzzle:hapticsEnabled";
const SNAP_SOUND_KEY = "phuzzle:snapSound";
const MUSIC_ENABLED_KEY = "phuzzle:musicEnabled";
const MUSIC_VOLUME_KEY = "phuzzle:musicVolume";

export type SoundPreferences = {
  enabled: boolean;
  volume: number;
  hapticsEnabled: boolean;
  snapSoundPref: SnapSoundPref;
  musicEnabled: boolean;
  musicVolume: number;
};

const DEFAULTS: SoundPreferences = {
  enabled: true,
  volume: 0.3,
  hapticsEnabled: true,
  snapSoundPref: "default",
  musicEnabled: false,
  musicVolume: 0.35,
};

export function loadSoundPreferencesFromStorage(): SoundPreferences {
  const enabled = safeLocalStorage.getItem(SOUND_ENABLED_KEY);
  const volume = safeLocalStorage.getItem(SOUND_VOLUME_KEY);
  const haptics = safeLocalStorage.getItem(HAPTICS_ENABLED_KEY);
  const snap = safeLocalStorage.getItem(SNAP_SOUND_KEY);
  const m = safeLocalStorage.getItem(MUSIC_ENABLED_KEY);
  const mv = safeLocalStorage.getItem(MUSIC_VOLUME_KEY);

  const snapSoundPref: SnapSoundPref =
    snap !== null && ["default", "classic", "soft", "punchy", "muted"].includes(snap)
      ? (snap as SnapSoundPref)
      : DEFAULTS.snapSoundPref;

  return {
    enabled: enabled !== null ? enabled === "true" : DEFAULTS.enabled,
    volume: volume !== null ? clamp01(parseFloat(volume)) : DEFAULTS.volume,
    hapticsEnabled: haptics !== null ? haptics === "true" : DEFAULTS.hapticsEnabled,
    snapSoundPref,
    musicEnabled: m !== null ? m === "true" : DEFAULTS.musicEnabled,
    musicVolume: mv !== null ? clamp01(parseFloat(mv) || 0.35) : DEFAULTS.musicVolume,
  };
}

export function saveSoundPreference(
  key:
    | "enabled"
    | "volume"
    | "hapticsEnabled"
    | "snapSoundPref"
    | "musicEnabled"
    | "musicVolume",
  value: boolean | number | SnapSoundPref,
): void {
  const k =
    key === "enabled"
      ? SOUND_ENABLED_KEY
      : key === "volume"
        ? SOUND_VOLUME_KEY
        : key === "hapticsEnabled"
          ? HAPTICS_ENABLED_KEY
          : key === "snapSoundPref"
            ? SNAP_SOUND_KEY
            : key === "musicEnabled"
              ? MUSIC_ENABLED_KEY
              : MUSIC_VOLUME_KEY;
  safeLocalStorage.setItem(k, String(value));
}
