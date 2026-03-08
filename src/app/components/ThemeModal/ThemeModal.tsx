/**
 * ThemeModal – theme picker + snap sound picker.
 */
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/Modal/Modal";
import { useTheme, THEMES, THEME_LABELS, type Theme } from "@/hooks/useTheme";
import { soundManager, type AudioProfile, type SnapSoundPref } from "@/audio/core/sounds";
import { audioManager } from "@/audio/manager/audioManager";
import { Check } from "lucide-react";
import styles from "./ThemeModal.module.css";

const SNAP_SOUND_OPTIONS: { value: SnapSoundPref; label: string }[] = [
  { value: "default", label: "Default (theme)" },
  { value: "classic", label: "Classic" },
  { value: "soft", label: "Soft" },
  { value: "punchy", label: "Punchy" },
  { value: "muted", label: "Muted" },
];

const AUDIO_PROFILE_OPTIONS: {
  value: AudioProfile;
  label: string;
  description: string;
}[] = [
  {
    value: "balanced",
    label: "Balanced",
    description: "Full dynamic range and presence",
  },
  {
    value: "soft-mobile",
    label: "Soft / Mobile",
    description: "Smoother highs tuned for phone speakers",
  },
  {
    value: "low-stimulation",
    label: "Low Stimulation",
    description: "Lower intensity and reduced sharp transients",
  },
];

const THEME_EMOJIS: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  space: "🚀",
  ocean: "🌊",
  forest: "🌲",
  sunset: "🌅",
};

const THEME_COLORS: Record<Theme, string> = {
  light: "#f59e0b",
  dark: "#6366f1",
  space: "#a78bfa",
  ocean: "#3b82f6",
  forest: "#22c55e",
  sunset: "#f97316",
};

type ThemeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  hapticsEnabled?: boolean;
};

export function ThemeModal({ isOpen, onClose, hapticsEnabled = false }: ThemeModalProps) {
  const { theme, setTheme } = useTheme();
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [masterVolume, setMasterVolume] = useState(() => soundManager.getMasterVolume());
  const [sfxVolume, setSfxVolume] = useState(() => soundManager.getSfxVolume());
  const [ambientVolume, setAmbientVolume] = useState(() => audioManager.getMusicVolume());
  const [audioProfile, setAudioProfile] = useState<AudioProfile>(() =>
    soundManager.getAudioProfile(),
  );

  const handleSelect = (t: Theme) => {
    setTheme(t);
    if (hapticsEnabled && typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(10);
    // Keep modal open so users can try multiple themes before closing
  };

  useEffect(() => {
    if (isOpen && theme && optionRefs.current[theme]) {
      optionRefs.current[theme]?.focus();
    }
  }, [isOpen, theme]);

  useEffect(() => {
    if (!isOpen) return;
    setMasterVolume(soundManager.getMasterVolume());
    setSfxVolume(soundManager.getSfxVolume());
    setAmbientVolume(audioManager.getMusicVolume());
    setAudioProfile(soundManager.getAudioProfile());
  }, [isOpen]);

  const snapSound = soundManager.getSnapSoundPref();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Theme & Sounds"
      showCloseButton={true}
    >
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Theme</h3>
        <div className={styles.options}>
          {THEMES.map((t) => (
            <button
              key={t}
              ref={(el) => {
                optionRefs.current[t] = el;
              }}
              type="button"
              className={`${styles.option} ${theme === t ? styles.optionActive : ""}`}
              onClick={() => handleSelect(t)}
              aria-label={`${THEME_LABELS[t]}${theme === t ? ", selected" : ""}`}
            >
              <span className={styles.optionIcon} style={{ color: THEME_COLORS[t] }}>
                {THEME_EMOJIS[t]}
              </span>
              <span>{THEME_LABELS[t]}</span>
              {theme === t && <Check size={18} className={styles.checkIcon} />}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Snap sound</h3>
        <div className={styles.options}>
          {SNAP_SOUND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.option} ${snapSound === opt.value ? styles.optionActive : ""}`}
              onClick={() => {
                soundManager.setSnapSoundPref(opt.value);
                if (hapticsEnabled && typeof navigator?.vibrate === "function")
                  navigator.vibrate(10);
              }}
              aria-label={`${opt.label}${snapSound === opt.value ? ", selected" : ""}`}
            >
              <span>{opt.label}</span>
              {snapSound === opt.value && (
                <Check size={18} className={styles.checkIcon} />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Audio mix</h3>
        <div className={styles.sliderGroup}>
          <label className={styles.sliderLabel} htmlFor="audio-master-volume">
            <span>Master</span>
            <span>{Math.round(masterVolume * 100)}%</span>
          </label>
          <input
            id="audio-master-volume"
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(masterVolume * 100)}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setMasterVolume(next);
              soundManager.setMasterVolume(next);
            }}
          />
        </div>
        <div className={styles.sliderGroup}>
          <label className={styles.sliderLabel} htmlFor="audio-sfx-volume">
            <span>SFX</span>
            <span>{Math.round(sfxVolume * 100)}%</span>
          </label>
          <input
            id="audio-sfx-volume"
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(sfxVolume * 100)}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setSfxVolume(next);
              soundManager.setSfxVolume(next);
            }}
          />
        </div>
        <div className={styles.sliderGroup}>
          <label className={styles.sliderLabel} htmlFor="audio-ambient-volume">
            <span>Ambient</span>
            <span>{Math.round(ambientVolume * 100)}%</span>
          </label>
          <input
            id="audio-ambient-volume"
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(ambientVolume * 100)}
            onChange={(e) => {
              const next = Number(e.target.value) / 100;
              setAmbientVolume(next);
              audioManager.setMusicVolume(next);
            }}
          />
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Audio profile</h3>
        <div className={styles.options}>
          {AUDIO_PROFILE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.option} ${audioProfile === opt.value ? styles.optionActive : ""}`}
              onClick={() => {
                setAudioProfile(opt.value);
                soundManager.setAudioProfile(opt.value);
              }}
              aria-label={`${opt.label}${audioProfile === opt.value ? ", selected" : ""}`}
            >
              <span className={styles.optionTextBlock}>
                <span>{opt.label}</span>
                <span className={styles.optionHint}>{opt.description}</span>
              </span>
              {audioProfile === opt.value && (
                <Check size={18} className={styles.checkIcon} />
              )}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
