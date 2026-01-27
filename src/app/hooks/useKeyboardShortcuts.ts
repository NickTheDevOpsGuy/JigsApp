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
  | "nextPiece" // Select next piece
  | "prevPiece" // Select previous piece
  | "moveUp" // Move piece up
  | "moveDown" // Move piece down
  | "moveLeft" // Move piece left
  | "moveRight" // Move piece right
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
      // Debug logging
      console.log("[Keyboard] Key pressed:", e.key, "enabled:", enabled);

      if (!enabled) {
        console.log("[Keyboard] Shortcuts disabled, ignoring");
        return;
      }

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        console.log("[Keyboard] In input field, ignoring");
        return;
      }

      const { mod, shift } = getModifiers(e);
      const key = e.key.toLowerCase();

      console.log("[Keyboard] Processing key:", key, "mod:", mod, "shift:", shift);

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
      else if (key === "r" && !mod && !shift) {
        action = "rotateCW";
      }
      // Shift+R - Rotate piece counter-clockwise
      else if (key === "r" && shift && !mod) {
        action = "rotateCCW";
      }
      // Tab - Select next/previous piece
      else if (e.key === "Tab" && !mod && !shift) {
        e.preventDefault(); // Prevent focus change
        action = "nextPiece";
      }
      // Shift+Tab - Select previous piece
      else if (e.key === "Tab" && shift && !mod) {
        e.preventDefault();
        action = "prevPiece";
      }
      // Arrow keys - Move selected piece
      else if (e.key === "ArrowUp" && !mod) {
        e.preventDefault();
        action = "moveUp";
      } else if (e.key === "ArrowDown" && !mod) {
        e.preventDefault();
        action = "moveDown";
      } else if (e.key === "ArrowLeft" && !mod) {
        e.preventDefault();
        action = "moveLeft";
      } else if (e.key === "ArrowRight" && !mod) {
        e.preventDefault();
        action = "moveRight";
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
        console.log("[Keyboard] Dispatching action:", action);
        onAction(action);
      } else {
        console.log("[Keyboard] No action matched for key:", key);
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
  { keys: ["Tab"], action: "Select next piece" },
  { keys: ["Shift+Tab"], action: "Select previous piece" },
  { keys: ["R"], action: "Rotate selected piece" },
  { keys: ["Shift+R"], action: "Rotate counter-clockwise" },
  { keys: ["↑ ↓ ← →"], action: "Move selected piece" },
  { keys: ["V"], action: "Toggle preview" },
  { keys: ["F"], action: "Fullscreen" },
  { keys: ["M"], action: "Mute / Unmute sound" },
  { keys: ["H"], action: "Toggle haptics" },
  { keys: ["N"], action: "New puzzle" },
  { keys: ["?", "F1"], action: "Show shortcuts" },
  { keys: ["Esc"], action: "Close / Unpause" },
] as const;
