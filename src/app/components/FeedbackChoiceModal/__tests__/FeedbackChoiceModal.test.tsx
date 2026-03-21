/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FeedbackChoiceModal, buildFeedbackMailtoUrl } from "../FeedbackChoiceModal";

describe("FeedbackChoiceModal", () => {
  it("builds a bug-report mailto URL with encoded subject and body", () => {
    const url = buildFeedbackMailtoUrl(
      "Phuzzle Bug Report",
      "What went wrong?\n\n---\nEnvironment:\nFirefox",
    );

    expect(url).toContain("mailto:anickclark@gmail.com");
    expect(url).toContain("subject=Phuzzle%20Bug%20Report");
    expect(url).toContain("Environment%3A%0AFirefox");
  });

  it("renders feedback options when open", () => {
    render(<FeedbackChoiceModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: /feedback/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /report a bug/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /suggest a feature/i })).toBeTruthy();
  });

  it("closes after choosing report a bug", () => {
    const onClose = vi.fn();
    render(
      <FeedbackChoiceModal
        isOpen
        onClose={onClose}
        environmentSnippet={"Browser: Test"}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /report a bug/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes after choosing suggest a feature", () => {
    const onClose = vi.fn();
    render(<FeedbackChoiceModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /suggest a feature/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
