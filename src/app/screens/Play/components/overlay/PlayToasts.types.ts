export type OnboardingState = {
  needsTrayTip: boolean;
  needsZoomTip: boolean;
  showFirstSnapToast: boolean;
  dismissTrayTip: () => void;
  dismissZoomTip: () => void;
  dismissFirstSnapToast: () => void;
};
