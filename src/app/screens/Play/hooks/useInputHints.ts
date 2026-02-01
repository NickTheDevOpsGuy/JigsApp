import { useMemo } from "react";

interface InputHints {
  rotate: string;
  sendToTray: string;
  placeFromTray: string;
  trayHelpText: string;
  emptyTrayText: string;
}

/**
 * Returns device-appropriate input hints.
 * Prevents showing "Right click" on mobile or "Keyboard shortcuts" on touch devices.
 */
export function useInputHints(isCoarsePointer: boolean): InputHints {
  return useMemo(() => {
    if (isCoarsePointer) {
      return {
        rotate: "Tap to rotate",
        sendToTray: "Long-press to store",
        placeFromTray: "Tap to place on board",
        trayHelpText: "Long-press to store • Tap to rotate",
        emptyTrayText: "Long-press pieces to store them here",
      };
    }
    return {
      rotate: "Right-click to rotate",
      sendToTray: "Middle-click to store",
      placeFromTray: "Click to place on board",
      trayHelpText: "Middle-click to store • Right-click to rotate",
      emptyTrayText: "Middle-click pieces to store them here",
    };
  }, [isCoarsePointer]);
}
