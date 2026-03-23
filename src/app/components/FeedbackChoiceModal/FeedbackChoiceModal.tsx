/**
 * FeedbackChoiceModal – choose Report a bug or Suggest a feature.
 * Opens the configured feedback forms for the chosen type via POST submission.
 */
import { Modal } from "@/components/Modal/Modal";
import { FEEDBACK_FORM_TARGETS, normalizeFeedbackFormUrl } from "./feedbackLinks";
import styles from "./FeedbackChoiceModal.module.css";

type FeedbackFormFields = {
  subject: string;
  body?: string;
  environment?: string;
};

export function buildFeedbackFormSubmission(
  target: string,
  subject: string,
  body?: string,
  environmentSnippet?: string,
) {
  const action = normalizeFeedbackFormUrl(target);
  if (!action) return null;

  const fields: FeedbackFormFields = { subject };
  if (body) fields.body = body;
  if (environmentSnippet) fields.environment = environmentSnippet;

  return { action, method: "POST" as const, target: "_blank", fields };
}

function submitFeedbackForm(
  target: string,
  subject: string,
  body?: string,
  environmentSnippet?: string,
) {
  const submission = buildFeedbackFormSubmission(
    target,
    subject,
    body,
    environmentSnippet,
  );
  if (!submission) return;

  const form = document.createElement("form");
  form.action = submission.action;
  form.method = submission.method;
  form.target = submission.target;
  form.style.display = "none";

  for (const [name, value] of Object.entries(submission.fields)) {
    if (!value) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
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
    submitFeedbackForm(
      FEEDBACK_FORM_TARGETS.bug,
      "Phuzzle Bug Report",
      "What went wrong?",
      environmentSnippet,
    );
    onClose();
  };

  const handleSuggestFeature = () => {
    submitFeedbackForm(
      FEEDBACK_FORM_TARGETS.feature,
      "Phuzzle Feature Request",
      "I'd like to suggest:",
      environmentSnippet,
    );
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
          title="Report a bug"
        >
          🐛 Report a bug
        </button>
        <button
          type="button"
          className={styles.feedbackChoiceBtn}
          onClick={handleSuggestFeature}
          aria-label="Suggest a feature"
          title="Suggest a feature"
        >
          💡 Suggest a feature
        </button>
      </div>
    </Modal>
  );
}
