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

  it("closes from backdrop Escape by default", () => {
    const onClose = vi.fn();

    render(
      <AppModal isOpen onClose={onClose} title="Default modal">
        <div>Content</div>
      </AppModal>,
    );

    fireEvent.keyDown(screen.getByRole("presentation"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
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

  it("does not close from backdrop Escape when closeOnEscape is false", () => {
    const onClose = vi.fn();

    render(
      <AppModal isOpen onClose={onClose} title="Locked modal" closeOnEscape={false}>
        <div>Content</div>
      </AppModal>,
    );

    fireEvent.keyDown(screen.getByRole("presentation"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("centers anchored dialogs inside the mobile viewport", () => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        width: 360,
        height: 480,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: class ResizeObserver {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    });

    Object.defineProperty(window, "requestAnimationFrame", {
      writable: true,
      value: (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      },
    });

    const anchor = document.createElement("div");
    anchor.getBoundingClientRect = () =>
      ({
        top: 40,
        left: 24,
        width: 260,
        height: 260,
        right: 284,
        bottom: 300,
        x: 24,
        y: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.appendChild(anchor);

    render(
      <AppModal
        isOpen
        onClose={vi.fn()}
        title="Anchored mobile modal"
        anchorRef={{ current: anchor }}
      >
        <div>Content</div>
      </AppModal>,
    );

    const dialog = screen.getByRole("dialog", { name: /anchored mobile modal/i });
    expect((dialog as HTMLElement).style.top).toBe("240px");
    expect((dialog as HTMLElement).style.left).toBe("180px");
  });
});
