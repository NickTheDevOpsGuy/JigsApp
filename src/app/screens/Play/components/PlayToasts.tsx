/**
 * PlayToasts – engagement and onboarding toast overlays.
 * Renders first-snap, streak, milestone, share, and onboarding tooltips.
 */
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import type { OnboardingState } from "./PlayToasts.types";

type Props = {
  onboarding: OnboardingState;
  placed: number;
  showFirstSnapToast: boolean;
  showStreakToast: boolean;
  milestoneMessage: string | null;
  borderCompleteToast: string | null;
  shareToast: string | null;
  classNames: {
    engagementToast: string;
    engagementToastStartTip: string;
    toastDismiss: string;
    onboardingOverlay: string;
    onboardingOverlayTray: string;
  };
};

export function PlayToasts({
  onboarding,
  placed,
  showFirstSnapToast,
  showStreakToast,
  milestoneMessage,
  borderCompleteToast,
  shareToast,
  classNames: s,
}: Props) {
  return (
    <>
      {showFirstSnapToast && (
        <div className={s.engagementToast} role="status">
          First piece! ✨
        </div>
      )}
      {showStreakToast && (
        <div className={s.engagementToast} role="status">
          🔥 On fire!
        </div>
      )}
      {milestoneMessage && (
        <div className={s.engagementToast} role="status">
          {milestoneMessage}
        </div>
      )}
      {borderCompleteToast && (
        <div className={s.engagementToast} role="status">
          {borderCompleteToast}
        </div>
      )}
      {shareToast && (
        <div className={s.engagementToast} role="status">
          {shareToast}
        </div>
      )}
      {onboarding.needsStartTip && placed === 0 && (
        <div className={`${s.engagementToast} ${s.engagementToastStartTip}`} role="status">
          <span>Drag a piece to start</span>
          <button
            type="button"
            className={s.toastDismiss}
            onClick={onboarding.dismissStartTip}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {onboarding.needsTrayTip && (
        <div className={s.onboardingOverlayTray}>
          <OnboardingTooltip
            message="Use the tray below to store or recall pieces"
            onDismiss={onboarding.dismissTrayTip}
            showButton
          />
        </div>
      )}
      {onboarding.needsZoomTip && (
        <div className={s.onboardingOverlay}>
          <OnboardingTooltip
            message="Pinch or scroll to zoom on larger puzzles"
            onDismiss={onboarding.dismissZoomTip}
            showButton
          />
        </div>
      )}
    </>
  );
}
