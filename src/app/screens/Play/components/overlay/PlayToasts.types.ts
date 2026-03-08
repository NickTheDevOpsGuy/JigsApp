/** Onboarding state passed to PlayToasts. */
export type OnboardingState = {
  needsStartTip: boolean;
  needsTrayTip: boolean;
  needsZoomTip: boolean;
  showFirstSnapToast: boolean;
  dismissStartTip: () => void;
  dismissTrayTip: () => void;
  dismissZoomTip: () => void;
};
