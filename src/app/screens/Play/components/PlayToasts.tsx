/**
 * PlayToasts – engagement and onboarding toast overlays.
 * Renders first-snap, streak, milestone, share, and onboarding tooltips.
 */
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import type { OnboardingState } from "./PlayToasts.types";

type Props = {
  onboarding: OnboardingState;
  showFirstSnapToast: boolean;
  showStreakToast: boolean;
  milestoneMessage: string | null;
  announcerLine: string | null;
  shareToast: string | null;
  classNames: {
    engagementToast: string;
    announcerToast: string;
    toastDismiss: string;
    onboardingOverlay: string;
    onboardingOverlayTray: string;
  };
};

export function PlayToasts({
  onboarding,
  showFirstSnapToast,
  showStreakToast,
  milestoneMessage,
  announcerLine,
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
      {announcerLine && (
        <div className={s.announcerToast} role="status">
          {announcerLine}
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
      {shareToast && (
        <div className={s.engagementToast} role="status">
          {shareToast}
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
