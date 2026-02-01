import { useState, useCallback } from "react";
import { soundManager } from "@/audio/sounds";

/**
 * Hook to manage sound and haptics settings.
 */
export function useSoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [hapticsEnabled, setHapticsEnabled] = useState(soundManager.isHapticsEnabled());

  const toggleSound = useCallback(() => {
    const newEnabled = !soundManager.isEnabled();
    soundManager.setEnabled(newEnabled);
    setSoundEnabled(newEnabled);
  }, []);

  const toggleHaptics = useCallback(() => {
    const newEnabled = !soundManager.isHapticsEnabled();
    soundManager.setHapticsEnabled(newEnabled);
    setHapticsEnabled(newEnabled);
    if (newEnabled && navigator.vibrate) {
      navigator.vibrate(25);
    }
  }, []);

  return {
    soundEnabled,
    hapticsEnabled,
    toggleSound,
    toggleHaptics,
  };
}
