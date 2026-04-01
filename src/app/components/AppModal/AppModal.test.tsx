/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppModal } from "./AppModal";

describe("AppModal", () => {
  it("does not close from backdrop click when closeOnBackdropClick is false", () => {
    const onClose = vi.fn();

    render(
      <AppModal
        isOpen
        onClose={onClose}
        title="Locked modal"
        closeOnBackdropClick={false}
      >
        <div>Content</div>
      </AppModal>,
    );

    fireEvent.click(screen.getByRole("presentation"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close from Escape when closeOnEscape is false", () => {
    const onClose = vi.fn();

    render(
      <AppModal isOpen onClose={onClose} title="Locked modal" closeOnEscape={false}>
        <div>Content</div>
      </AppModal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
