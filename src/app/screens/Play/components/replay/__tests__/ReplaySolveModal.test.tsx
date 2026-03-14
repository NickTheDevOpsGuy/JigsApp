/**
 * ReplaySolveModal – smoke render and key UI (heading, play/pause, close).
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReplaySolveModal } from "../ReplaySolveModal";

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
    expect(screen.getByText(/watch how the puzzle was completed/i)).toBeTruthy();
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

  it("Back to Results calls onBackToResults when provided", () => {
    const onBackToResults = vi.fn();
    const onClose = vi.fn();
    render(
      <ReplaySolveModal
        {...defaultProps}
        onClose={onClose}
        onBackToResults={onBackToResults}
      />,
    );
    const backBtn = screen.getByRole("button", { name: /back to results/i });
    backBtn.click();
    expect(onBackToResults).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Back to Results calls onClose when onBackToResults not provided", () => {
    const onClose = vi.fn();
    render(<ReplaySolveModal {...defaultProps} onClose={onClose} />);
    const backBtn = screen.getByRole("button", { name: /back to results/i });
    backBtn.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
