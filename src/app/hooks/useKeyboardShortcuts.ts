/**
 * useKeyboardShortcuts – cross-platform shortcuts for play, menu, rotate, tray, undo, etc.
 */
import { useEffect, useCallback } from "react";

export type ShortcutAction =
  | "pause"
  | "preview"
  | "fullscreen"
  | "newGame"
  | "toggleSound"
  | "toggleHaptics"
  | "toggleGhostHint"
  | "rotateCW" // Rotate clockwise
  | "rotateCCW" // Rotate counter-clockwise
  | "nextPiece" // Select next piece
  | "prevPiece" // Select previous piece
  | "moveUp" // Move piece up
  | "moveDown" // Move piece down
  | "moveLeft" // Move piece left
  | "moveRight" // Move piece right
  | "sendToTray"
  | "snap"
  | "undo"
  | "redo"
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
      // Space - Pause/Resume
      else if (key === " ") {
        if (!mod) {
          e.preventDefault(); // Prevent space scrolling
          action = "pause";
        }
      }
      // P - Toggle preview
      else if (key === "p" && !mod) {
        action = "preview";
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
      // G - Toggle ghost hint
      else if (key === "g" && !mod) {
        action = "toggleGhostHint";
      }
      // T - Send selected piece to tray
      else if (key === "t" && !mod) {
        e.preventDefault();
        action = "sendToTray";
      }
      // Enter - Snap selected piece
      else if (e.key === "Enter" && !mod) {
        e.preventDefault();
        action = "snap";
      }
      // ? or F1 - Show help
      else if ((key === "?" || e.key === "F1") && !mod) {
        e.preventDefault();
        action = "showHelp";
      }
      // Ctrl/Cmd+Z - Undo
      else if (key === "z" && mod && !shift) {
        e.preventDefault();
        action = "undo";
      }
      // Ctrl/Cmd+Shift+Z - Redo
      else if (key === "z" && mod && shift) {
        e.preventDefault();
        action = "redo";
      }
      // Ctrl/Cmd+Y - Redo (alternative, common on Windows)
      else if (key === "y" && mod && !shift) {
        e.preventDefault();
        action = "redo";
      }

      if (action) onAction(action);
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
  { keys: ["Ctrl+Z", "⌘Z"], action: "↩️ Undo last move", ariaAction: "Undo last move" },
  {
    keys: ["Ctrl+Shift+Z", "⌘⇧Z", "Ctrl+Y", "⌘Y"],
    action: "↪️ Redo last undone move",
    ariaAction: "Redo last undone move",
  },
  { keys: ["Space"], action: "⏸️ Pause / Resume", ariaAction: "Pause or Resume" },
  { keys: ["Tab"], action: "➡️ Select next piece", ariaAction: "Select next piece" },
  {
    keys: ["Shift+Tab"],
    action: "⬅️ Select previous piece",
    ariaAction: "Select previous piece",
  },
  {
    keys: ["R"],
    action: "🔄 Rotate clockwise",
    ariaAction: "Rotate clockwise",
  },
  {
    keys: ["Shift+R"],
    action: "🔄 Rotate counter-clockwise",
    ariaAction: "Rotate counter-clockwise",
  },
  {
    keys: ["↑ ↓ ← →"],
    action: "⬆️⬇️ Move selected piece",
    ariaAction: "Move selected piece",
  },
  { keys: ["P"], action: "👁️ Toggle preview", ariaAction: "Toggle preview" },
  { keys: ["F"], action: "🖥️ Fullscreen", ariaAction: "Fullscreen" },
  { keys: ["M"], action: "🔊 Mute / Unmute sound", ariaAction: "Mute or Unmute sound" },
  { keys: ["H"], action: "📳 Toggle haptics", ariaAction: "Toggle haptics" },
  { keys: ["G"], action: "👻 Toggle ghost hint", ariaAction: "Toggle ghost hint" },
  { keys: ["N"], action: "🧩 New puzzle", ariaAction: "New puzzle" },
  { keys: ["?", "F1"], action: "⌨️ Show shortcuts", ariaAction: "Show shortcuts" },
  { keys: ["Esc"], action: "✖️ Close / Unpause", ariaAction: "Close or Unpause" },
] as const;
