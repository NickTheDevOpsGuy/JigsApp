/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FeedbackChoiceModal, buildFeedbackFormSubmission } from "./FeedbackChoiceModal";
import {
  DEFAULT_BUG_FORM_URL,
  DEFAULT_FEATURE_FORM_URL,
  FEEDBACK_FORM_TARGETS,
} from "./feedbackLinks";

describe("FeedbackChoiceModal", () => {
  it("builds a bug-report POST form submission", () => {
    const submission = buildFeedbackFormSubmission(
      "https://formspree.io/f/test123",
      "Phuzzle Bug Report",
      "What went wrong?\n\n---\nEnvironment:\nFirefox",
      "Firefox",
    );

    expect(submission).toEqual({
      action: "https://formspree.io/f/test123",
      method: "POST",
      target: "_blank",
      fields: {
        subject: "Phuzzle Bug Report",
        body: "What went wrong?\n\n---\nEnvironment:\nFirefox",
        environment: "Firefox",
      },
    });
  });

  it("renders feedback options when open", () => {
    render(<FeedbackChoiceModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: /feedback/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /report a bug/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /suggest a feature/i })).toBeTruthy();
  });

  it("uses the configured default forms targets", () => {
    expect(FEEDBACK_FORM_TARGETS.bug).toBe(DEFAULT_BUG_FORM_URL);
    expect(FEEDBACK_FORM_TARGETS.feature).toBe(DEFAULT_FEATURE_FORM_URL);
  });

  it("closes after choosing report a bug", () => {
    const onClose = vi.fn();
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});
    render(
      <FeedbackChoiceModal
        isOpen
        onClose={onClose}
        environmentSnippet={"Browser: Test"}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /report a bug/i }));

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    submitSpy.mockRestore();
  });

  it("closes after choosing suggest a feature", () => {
    const onClose = vi.fn();
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});
    render(<FeedbackChoiceModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /suggest a feature/i }));

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    submitSpy.mockRestore();
  });
});
