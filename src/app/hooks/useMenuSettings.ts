/**
 * useMenuSettings – read persisted settings from localStorage for use in MenuTree (home context).
 */
import { useCallback, useState } from "react";
import { soundManager } from "@/audio/sounds";
import {
  PIECE_LOCKING_KEY,
  GHOST_HINT_KEY,
  ALIGNMENT_GRID_KEY,
  GHOST_WHEN_IDLE_KEY,
  EDGE_HIGHLIGHT_KEY,
  IMMERSIVE_MODE_KEY,
} from "@/screens/Play/playScreenUtils";

const TOGGLE_KEYS: Record<string, string> = {
  pieceLocking: PIECE_LOCKING_KEY,
  ghostHint: GHOST_HINT_KEY,
  alignmentGrid: ALIGNMENT_GRID_KEY,
  ghostWhenIdle: GHOST_WHEN_IDLE_KEY,
  edgeHighlight: EDGE_HIGHLIGHT_KEY,
  immersiveMode: IMMERSIVE_MODE_KEY,
  sound: "__sound__",
  haptics: "__haptics__",
};

export function useMenuSettings() {
  const [, forceUpdate] = useState(0);

  const getToggleState = useCallback((id: string): boolean => {
    if (id === "sound") return soundManager.isEnabled();
    if (id === "haptics") return soundManager.isHapticsEnabled();
    const key = TOGGLE_KEYS[id];
    if (!key) return false;
    try {
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  }, []);

  const setToggleState = useCallback((id: string, value: boolean) => {
    if (id === "sound") {
      soundManager.setEnabled(value);
    } else if (id === "haptics") {
      soundManager.setHapticsEnabled(value);
      if (value && navigator.vibrate) navigator.vibrate(25);
    } else {
      const key = TOGGLE_KEYS[id];
      if (key) {
        try {
          localStorage.setItem(key, value ? "true" : "false");
        } catch {
          /* ignore */
        }
      }
    }
    forceUpdate((n) => n + 1);
  }, []);

  return { getToggleState, setToggleState };
}
