// src/app/hooks/useKeyboardShortcuts.ts
// Cross-platform keyboard shortcuts for Phuzzle

import { useEffect, useCallback } from "react";

export type ShortcutAction =
  | "pause"
  | "preview"
  | "fullscreen"
  | "newGame"
  | "toggleSound"
  | "toggleHaptics"
  | "rotateCW" // Rotate clockwise
  | "rotateCCW" // Rotate counter-clockwise
  | "showHelp"
  | "escape";

type ShortcutHandler = (action: ShortcutAction) => void;

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onAction: ShortcutHandler;
}

// Modifier key detection that works cross-platform
function getModifiers(e: KeyboardEvent) {
  return {
    ctrl: e.ctrlKey,
    meta: e.metaKey, // Cmd on Mac
    alt: e.altKey,
    shift: e.shiftKey,
    // "mod" = Cmd on Mac, Ctrl on Windows/Linux
    mod: e.metaKey || e.ctrlKey,
  };
}

export function useKeyboardShortcuts({
  enabled = true,
  onAction,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const { mod, shift } = getModifiers(e);
      const key = e.key.toLowerCase();

      let action: ShortcutAction | null = null;

      // Escape - close modals, unpause
      if (e.key === "Escape") {
        action = "escape";
      }
      // Space or P - Pause/Resume
      else if (key === " " || key === "p") {
        if (!mod) {
          e.preventDefault(); // Prevent space scrolling
          action = "pause";
        }
      }
      // R - Rotate piece clockwise
      else if (key === "r" && !mod) {
        action = "rotateCW";
      }
      // Shift+R - Rotate piece counter-clockwise
      else if (key === "r" && shift && !mod) {
        action = "rotateCCW";
      }
      // Tab - Rotate (alternative)
      else if (e.key === "Tab" && !mod) {
        e.preventDefault(); // Prevent focus change
        action = shift ? "rotateCCW" : "rotateCW";
      }
      // V - Toggle preview
      else if (key === "v" && !mod) {
        action = "preview";
      }
      // F - Fullscreen
      else if (key === "f" && !mod) {
        action = "fullscreen";
      }
      // N - New game
      else if (key === "n" && !mod) {
        action = "newGame";
      }
      // M - Mute/unmute sound
      else if (key === "m" && !mod) {
        action = "toggleSound";
      }
      // H - Toggle haptics
      else if (key === "h" && !mod) {
        action = "toggleHaptics";
      }
      // ? or F1 - Show help
      else if ((key === "?" || e.key === "F1") && !mod) {
        e.preventDefault();
        action = "showHelp";
      }

      if (action) {
        onAction(action);
      }
    },
    [enabled, onAction],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Shortcut definitions for the help modal
export const SHORTCUTS = [
  { keys: ["Space", "P"], action: "Pause / Resume" },
  { keys: ["R"], action: "Rotate piece clockwise" },
  { keys: ["Shift", "R"], action: "Rotate piece counter-clockwise" },
  { keys: ["Tab"], action: "Rotate clockwise" },
  { keys: ["Shift", "Tab"], action: "Rotate counter-clockwise" },
  { keys: ["V"], action: "Toggle preview" },
  { keys: ["F"], action: "Fullscreen" },
  { keys: ["M"], action: "Mute / Unmute sound" },
  { keys: ["H"], action: "Toggle haptics" },
  { keys: ["N"], action: "New puzzle" },
  { keys: ["?", "F1"], action: "Show shortcuts" },
  { keys: ["Esc"], action: "Close / Unpause" },
] as const;
