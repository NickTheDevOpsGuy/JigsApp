/**
 * ReplaySolveModal – smoke render and key UI (heading, play/pause, close).
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReplaySolveModal } from "./ReplaySolveModal";

const defaultProps = {
  isPaused: true,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onRewind: vi.fn(),
  onFastForward: vi.fn(),
  speed: 1,
  onSpeedChange: vi.fn(),
  currentIndex: 0,
  totalSnapshots: 10,
  elapsedSeconds: 0,
  totalSeconds: 27,
  onSeek: vi.fn(),
  onClose: vi.fn(),
};

describe("ReplaySolveModal", () => {
  it("renders heading and subtitle", () => {
    render(<ReplaySolveModal {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /replay solve/i })).toBeTruthy();
    expect(screen.getByText(/watch replay/i)).toBeTruthy();
  });

  it("renders play button when paused", () => {
    render(<ReplaySolveModal {...defaultProps} isPaused={true} />);
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  it("renders pause button when not paused", () => {
    render(<ReplaySolveModal {...defaultProps} isPaused={false} />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  });

  it("renders close button", () => {
    render(<ReplaySolveModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /close replay/i })).toBeTruthy();
  });

  it("renders restart and go to end controls", () => {
    render(<ReplaySolveModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /restart/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /go to end/i })).toBeTruthy();
  });

  it("shows time display", () => {
    render(<ReplaySolveModal {...defaultProps} elapsedSeconds={12} totalSeconds={45} />);
    expect(screen.getByText(/0:12 \/ 0:45/)).toBeTruthy();
  });

  it("does not render a back to results button", () => {
    render(<ReplaySolveModal {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /back to results/i })).toBeNull();
  });

  it("calls onSeek once when the seek slider is focused and ArrowRight is pressed", () => {
    const onSeek = vi.fn();
    render(
      <ReplaySolveModal
        {...defaultProps}
        onSeek={onSeek}
        currentIndex={0}
        totalSnapshots={10}
      />,
    );
    const slider = screen.getByRole("slider", { name: /replay progress/i });
    slider.focus();
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onSeek).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledWith(1);
  });

  it("does not toggle play/pause when Space is pressed while Close is focused", () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    render(
      <ReplaySolveModal
        {...defaultProps}
        onPlay={onPlay}
        onPause={onPause}
        isPaused={true}
      />,
    );
    const closeBtn = screen.getByRole("button", { name: /close replay/i });
    closeBtn.focus();
    fireEvent.keyDown(closeBtn, { key: " " });
    expect(onPlay).not.toHaveBeenCalled();
    expect(onPause).not.toHaveBeenCalled();
  });

  it("keeps cutout panels aligned to the visible viewport when visualViewport is offset", () => {
    const mql = () =>
      ({
        matches: true,
        media: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList;

    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
      if (query.includes("(pointer: coarse)")) {
        return {
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      }
      if (
        query.includes("min-width: 1024px") ||
        query.includes("pointer: fine") ||
        query.includes("hover: hover")
      ) {
        return mql();
      }
      return {
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    });

    try {
      Object.defineProperty(window, "visualViewport", {
        configurable: true,
        value: {
          width: 1280,
          height: 480,
          offsetLeft: 24,
          offsetTop: 36,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      });

      render(
        <ReplaySolveModal
          {...defaultProps}
          boardRect={{ top: 10, left: 20, width: 220, height: 180 }}
        />,
      );

      const panels = Array.from(document.querySelectorAll("[data-cutout-panel]"));
      expect(panels).toHaveLength(4);
      expect((panels[0] as HTMLElement).style.top).toBe("0px");
      expect((panels[1] as HTMLElement).style.width).toBe("20px");
      // Bottom panel uses visual viewport coordinates (offsetTop + height) so it
      // still covers the visible area when the viewport is shifted.
      expect((panels[3] as HTMLElement).style.minHeight).toBe("326px");
    } finally {
      vi.restoreAllMocks();
    }
  });
});
