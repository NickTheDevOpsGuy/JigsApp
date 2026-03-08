import { useCallback, useEffect, useState, type RefObject } from "react";
import { audioManager } from "@/audio/audioManager";
import { soundManager } from "@/audio/sounds";

export function usePlayScreenUISystem(pageRef: RefObject<HTMLDivElement | null>) {
  const [soundEnabled, setSoundEnabled] = useState(() =>
    typeof window !== "undefined" ? soundManager.isEnabled() : true,
  );
  const [musicEnabled, setMusicEnabled] = useState(() =>
    typeof window !== "undefined" ? audioManager.isMusicEnabled() : false,
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(() =>
    typeof window !== "undefined" ? soundManager.isHapticsEnabled() : false,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      pageRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }, [pageRef]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    setSoundEnabled(soundManager.isEnabled());
    setMusicEnabled(audioManager.isMusicEnabled());
    setHapticsEnabled(soundManager.isHapticsEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const v = !soundManager.isEnabled();
    soundManager.setEnabled(v);
    setSoundEnabled(v);
  }, []);

  const toggleMusic = useCallback(() => {
    const v = !audioManager.isMusicEnabled();
    audioManager.setMusicEnabled(v);
    setMusicEnabled(v);
  }, []);

  const toggleHaptics = useCallback(() => {
    const v = !soundManager.isHapticsEnabled();
    soundManager.setHapticsEnabled(v);
    setHapticsEnabled(v);
    if (v && navigator.vibrate) navigator.vibrate(25);
  }, []);

  return {
    isFullscreen,
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    toggleFullscreen,
    toggleSound,
    toggleMusic,
    toggleHaptics,
  };
}

