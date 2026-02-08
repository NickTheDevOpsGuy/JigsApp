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
        sendToTray: "Drag to tray",
        placeFromTray: "Tap to place on board",
        trayHelpText: "Drag pieces here to store • Tap to place",
        emptyTrayText: "Drag pieces here to store them",
      };
    }
    return {
      rotate: "Right-click to rotate",
      sendToTray: "Drag to tray",
      placeFromTray: "Click to place on board",
      trayHelpText: "Drag pieces here to store • Right-click to rotate",
      emptyTrayText: "Drag pieces here to store them",
    };
  }, [isCoarsePointer]);
}
