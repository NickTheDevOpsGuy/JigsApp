/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CompletionOverlayActions } from "./CompletionOverlayActions";
import type { UseCompletionOverlayDataResult } from "./useCompletionOverlayData";

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
}

function completionData(
  overrides: Partial<UseCompletionOverlayDataResult> = {},
): UseCompletionOverlayDataResult {
  return {
    percentile: null,
    dailyStreak: 0,
    masteryStreak: 0,
    completionRecorded: true,
    percentileBadgeTier: null,
    newlyUnlocked: [],
    isGenerating: false,
    handleShareResultCard: vi.fn(),
    handleShareChallengeCard: vi.fn(),
    handleNativeDailyShare: vi.fn(),
    lastXpReward: null,
    ...overrides,
  };
}

describe("CompletionOverlayActions", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps replay accessible while share generation is busy", () => {
    const onReplayClick = vi.fn();

    render(
      <CompletionOverlayActions
        completionData={completionData({ isGenerating: true })}
        canReplay
        onReplayClick={onReplayClick}
        onShareProgress={vi.fn()}
        onShareChallenge={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /options/i }));

    const replay = screen.getByRole("menuitem", { name: /replay solve/i });
    expect(replay.getAttribute("disabled")).toBeNull();

    fireEvent.click(replay);

    expect(onReplayClick).toHaveBeenCalledTimes(1);
  });
});
