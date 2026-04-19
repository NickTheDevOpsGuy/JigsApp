import { useState, useCallback, useEffect, useRef } from "react";
import type { OnboardingState } from "@/screens/Play/components/overlay/PlayToasts.types";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

const TRAY_TIP_KEY = "phuzzle:onboarding:trayTip";
const ZOOM_TIP_KEY = "phuzzle:onboarding:zoomTip";
const FIRST_SNAP_KEY = "phuzzle:onboarding:firstSnap";

export function useOnboarding(placedCount: number, totalCount: number): OnboardingState {
  const [needsTrayTip, setNeedsTrayTip] = useState(
    () => safeLocalStorage.getItem(TRAY_TIP_KEY) !== "done",
  );
  const [needsZoomTip, setNeedsZoomTip] = useState(
    () => totalCount >= 25 && safeLocalStorage.getItem(ZOOM_TIP_KEY) !== "done",
  );
  const [showFirstSnapToast, setShowFirstSnapToast] = useState(false);
  const firstSnapShownRef = useRef(false);

  // Show first-snap toast when first piece is placed
  useEffect(() => {
    if (
      placedCount === 1 &&
      !firstSnapShownRef.current &&
      safeLocalStorage.getItem(FIRST_SNAP_KEY) !== "done"
    ) {
      firstSnapShownRef.current = true;
      setShowFirstSnapToast(true);
    }
  }, [placedCount]);

  // Show zoom tip for large puzzles when 10% placed
  useEffect(() => {
    if (totalCount >= 25 && placedCount > 0 && placedCount / totalCount >= 0.1) {
      if (safeLocalStorage.getItem(ZOOM_TIP_KEY) !== "done") {
        setNeedsZoomTip(true);
      }
    }
  }, [placedCount, totalCount]);

  const dismissTrayTip = useCallback(() => {
    safeLocalStorage.setItem(TRAY_TIP_KEY, "done");
    setNeedsTrayTip(false);
  }, []);

  const dismissZoomTip = useCallback(() => {
    safeLocalStorage.setItem(ZOOM_TIP_KEY, "done");
    setNeedsZoomTip(false);
  }, []);

  const dismissFirstSnapToast = useCallback(() => {
    safeLocalStorage.setItem(FIRST_SNAP_KEY, "done");
    setShowFirstSnapToast(false);
  }, []);

  return {
    needsTrayTip,
    needsZoomTip,
    showFirstSnapToast,
    dismissTrayTip,
    dismissZoomTip,
    dismissFirstSnapToast,
  };
}
