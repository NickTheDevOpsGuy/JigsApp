import React from "react";
import styles from "./OnboardingTooltip.module.css";

type Props = {
  message: string;
  onDismiss: () => void;
  /** Optional: show a "Got it" button for explicit dismiss */
  showButton?: boolean;
};

/**
 * Lightweight contextual tooltip for onboarding steps.
 * Single line, non-blocking, dismissible.
 */
export function OnboardingTooltip({ message, onDismiss, showButton = false }: Props) {
  return (
    <div className={styles.tooltip} role="status" aria-live="polite">
      <span className={styles.message}>{message}</span>
      {showButton ? (
        <button type="button" className={styles.dismissBtn} onClick={onDismiss}>
          Got it
        </button>
      ) : (
        <button
          type="button"
          className={styles.dismissIcon}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
