/**
 * FeedbackChoiceModal – choose Report a bug or Suggest a feature.
 * Opens mailto for the chosen type; caller can pass custom email or use default.
 */
import { Modal } from "@/components/Modal/Modal";
import styles from "./FeedbackChoiceModal.module.css";

const DEFAULT_EMAIL = "anickclark@gmail.com";

export function buildFeedbackMailtoUrl(subject: string, body: string) {
  return `mailto:${DEFAULT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function openMailto(subject: string, body: string) {
  const encoded = buildFeedbackMailtoUrl(subject, body);
  window.location.href = encoded;
}

type FeedbackChoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Optional environment snippet (e.g. puzzle context) for bug report body */
  environmentSnippet?: string;
};

export function FeedbackChoiceModal({
  isOpen,
  onClose,
  environmentSnippet,
}: FeedbackChoiceModalProps) {
  const handleReportBug = () => {
    const body = [
      "What went wrong?",
      "",
      "---",
      environmentSnippet ? `Environment:\n${environmentSnippet}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    openMailto("Phuzzle Bug Report", body);
    onClose();
  };

  const handleSuggestFeature = () => {
    const body = "I'd like to suggest:\n\n";
    openMailto("Phuzzle Feature Request", body);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feedback" showCloseButton>
      <div className={styles.feedbackChoice}>
        <button
          type="button"
          className={styles.feedbackChoiceBtn}
          onClick={handleReportBug}
          aria-label="Report a bug"
        >
          🐛 Report a bug
        </button>
        <button
          type="button"
          className={styles.feedbackChoiceBtn}
          onClick={handleSuggestFeature}
          aria-label="Suggest a feature"
        >
          💡 Suggest a feature
        </button>
      </div>
    </Modal>
  );
}
