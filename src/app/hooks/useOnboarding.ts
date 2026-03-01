/**
 * useOnboarding – step-based tips: start (drag piece), tray, zoom. Persisted in localStorage.
 * All hint screens auto-dismiss after 4 seconds.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

const STORAGE_KEY = "phuzzle:onboarding";
const HINT_AUTO_DISMISS_MS = 4_000;

export type OnboardingStep =
  | "start" // show "Drag a piece"
  | "firstSnapDone" // celebrated, show tray tip
  | "trayTipSeen" // show zoom tip (if applicable)
  | "done";

function getStoredStep(): OnboardingStep {
  if (typeof window === "undefined") return "done";
  const v = safeLocalStorage.getItem(STORAGE_KEY);
  if (v === "start" || v === "firstSnapDone" || v === "trayTipSeen" || v === "done") {
    return v;
  }
  return "start";
}

function setStoredStep(step: OnboardingStep): void {
  safeLocalStorage.setItem(STORAGE_KEY, step);
}

export function useOnboarding(placedCount: number, pieceCount: number) {
  const [step, setStepState] = useState<OnboardingStep>(() => getStoredStep());
  const [showFirstSnapToast, setShowFirstSnapToast] = useState(false);
  const prevPlacedRef = useRef(placedCount);

  const setStep = useCallback((next: OnboardingStep) => {
    setStepState(next);
    setStoredStep(next);
  }, []);

  // Detect first snap (0 → 1)
  useEffect(() => {
    if (prevPlacedRef.current === 0 && placedCount === 1 && step === "start") {
      setStep("firstSnapDone");
      setShowFirstSnapToast(true);
      const t = setTimeout(() => setShowFirstSnapToast(false), HINT_AUTO_DISMISS_MS);
      return () => clearTimeout(t);
    }
    prevPlacedRef.current = placedCount;
  }, [placedCount, step, setStep]);

  const dismissStartTip = useCallback(() => {
    setStep("done");
  }, [setStep]);

  const dismissTrayTip = useCallback(() => {
    setStep(pieceCount >= 16 ? "trayTipSeen" : "done");
  }, [setStep, pieceCount]);

  const dismissZoomTip = useCallback(() => {
    setStep("done");
  }, [setStep]);

  const needsStartTip = step === "start";
  const [trayTipVisible, setTrayTipVisible] = useState(false);
  useEffect(() => {
    if (step !== "firstSnapDone") return;
    const t = setTimeout(() => setTrayTipVisible(true), 2800);
    return () => clearTimeout(t);
  }, [step]);
  const needsTrayTip = step === "firstSnapDone" && trayTipVisible;
  const needsZoomTip = step === "trayTipSeen" && pieceCount >= 16;

  // Auto-dismiss all hint screens after 4 seconds
  useEffect(() => {
    if (step === "start") {
      const t = setTimeout(() => setStep("done"), HINT_AUTO_DISMISS_MS);
      return () => clearTimeout(t);
    }
  }, [step, setStep]);
  useEffect(() => {
    if (!needsTrayTip) return;
    const t = setTimeout(() => dismissTrayTip(), HINT_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [needsTrayTip, dismissTrayTip]);
  useEffect(() => {
    if (!needsZoomTip) return;
    const t = setTimeout(() => dismissZoomTip(), HINT_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [needsZoomTip, dismissZoomTip]);

  return {
    step,
    needsStartTip,
    needsTrayTip,
    needsZoomTip,
    showFirstSnapToast,
    dismissStartTip,
    dismissTrayTip,
    dismissZoomTip,
  };
}

export function resetOnboarding() {
  setStoredStep("start");
}
