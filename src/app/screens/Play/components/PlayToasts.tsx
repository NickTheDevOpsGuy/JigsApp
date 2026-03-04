/**
 * PlayToasts – engagement and onboarding toast overlays.
 * Renders at most ONE engagement toast at a time (first in priority order) so toasts
 * don’t stack; tray and zoom onboarding tips are separate overlays.
 */
import type React from "react";
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import type { OnboardingState } from "./PlayToasts.types";

type Props = {
  isComplete?: boolean;
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
    streakToast?: string;
    streakFlame?: string;
  };
};

/** Priority order: only the first truthy toast is shown so they don’t overlap. */
function getSingleToast(
  showFirstSnapToast: boolean,
  announcerLine: string | null,
  showStreakToast: boolean,
  milestoneMessage: string | null,
  shareToast: string | null,
): { content: React.ReactNode; isStreak: boolean } | null {
  if (showFirstSnapToast) return { content: "First piece! ✨", isStreak: false };
  if (announcerLine) return { content: announcerLine, isStreak: false };
  if (showStreakToast) return { content: null, isStreak: true }; // "On fire!" + flame
  if (milestoneMessage) return { content: milestoneMessage, isStreak: false };
  if (shareToast) return { content: shareToast, isStreak: false };
  return null;
}

export function PlayToasts({
  isComplete = false,
  onboarding,
  showFirstSnapToast,
  showStreakToast,
  milestoneMessage,
  announcerLine,
  shareToast,
  classNames: s,
}: Props) {
  const single = isComplete
    ? null
    : getSingleToast(
        showFirstSnapToast,
        announcerLine,
        showStreakToast,
        milestoneMessage,
        shareToast,
      );

  return (
    <>
      {single && (
        <div
          className={
            single.isStreak
              ? `${s.engagementToast} ${s.streakToast ?? ""}`
              : s.engagementToast
          }
          role="status"
        >
          {single.isStreak && (
            <span className={s.streakFlame ?? ""} aria-hidden>
              🔥
            </span>
          )}
          {single.content}
          {single.isStreak && " On fire!"}
        </div>
      )}
      {!isComplete && onboarding.needsTrayTip && (
        <div className={s.onboardingOverlayTray}>
          <OnboardingTooltip
            message="Use the tray below to store or recall pieces"
            onDismiss={onboarding.dismissTrayTip}
            showButton
          />
        </div>
      )}
      {!isComplete && onboarding.needsZoomTip && (
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
