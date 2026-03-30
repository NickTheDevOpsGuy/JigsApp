/**
 * Dialog parity coverage for shared shell (Modal), async loading, and staged puzzle flows.
 * @vitest-environment happy-dom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AboutModal } from "@/components/AboutModal/AboutModal";
import { ChoosePuzzleModal } from "@/components/ChoosePuzzleModal/ChoosePuzzleModal";
import { DailyDifficultyModal } from "@/components/DailyDifficultyModal/DailyDifficultyModal";
import { HelpChoiceModal } from "@/components/HelpChoiceModal/HelpChoiceModal";
import { PackChoiceModal } from "@/components/PackChoiceModal/PackChoiceModal";
import { WhatsNewModal } from "@/components/WhatsNew/WhatsNewModal";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  loadPacksData: vi.fn(),
  getTodayDailyPuzzle: vi.fn(),
  startDailyPuzzle: vi.fn(),
  markChangelogSeen: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: "/" }),
  };
});

vi.mock("@/daily/dailyPuzzleCore", () => ({
  GRID_OPTIONS: [
    { label: "Easy", rows: 3, cols: 3, pieces: 9 },
    { label: "Medium", rows: 4, cols: 4, pieces: 16 },
    { label: "Hard", rows: 5, cols: 5, pieces: 25 },
    { label: "Expert", rows: 6, cols: 6, pieces: 36 },
    { label: "Master", rows: 7, cols: 7, pieces: 49 },
  ],
  dismissFreezeOfferToday: vi.fn(),
  getDailyPreferredModifier: vi.fn(() => "classic"),
  getStreakFreezeCount: vi.fn(() => 0),
  getYesterdayDateString: vi.fn(() => "2026-03-20"),
  useStreakFreeze: vi.fn(() => true),
  wasFreezeOfferDismissedToday: vi.fn(() => false),
  wasYesterdayMissed: vi.fn(() => false),
  getDailyPreferredDifficultyIndex: vi.fn(() => 1),
  setDailyPreferredDifficultyIndex: vi.fn(),
}));

vi.mock("@/daily/dailyPuzzle", () => ({
  getTodayDailyPuzzle: (...args: unknown[]) => mocks.getTodayDailyPuzzle(...args),
  startDailyPuzzle: (...args: unknown[]) => mocks.startDailyPuzzle(...args),
  getTodayDailySpotlight: vi.fn(() => null),
}));

vi.mock("@/data/packs/loadPacksData", () => ({
  loadPacksData: (...args: unknown[]) => mocks.loadPacksData(...args),
}));

vi.mock("@/data/packs/packCompletion", () => ({
  getCompletedPuzzleIds: vi.fn(() => new Set(["charcuterie-board"])),
  getPackProgress: vi.fn(() => ({ completed: 1, total: 2 })),
  setCurrentPuzzleId: vi.fn(),
}));

vi.mock("@/data/content/changelog", () => ({
  CHANGELOG_ENTRIES: [
    { title: "Version 1.0", items: ["Dialog parity", "Async pack loading"] },
  ],
  markChangelogSeen: (...args: unknown[]) => mocks.markChangelogSeen(...args),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.loadPacksData.mockReset();
  mocks.getTodayDailyPuzzle.mockReset();
  mocks.startDailyPuzzle.mockReset();
  mocks.markChangelogSeen.mockReset();
  mocks.getTodayDailyPuzzle.mockReturnValue({
    id: "daily-food",
    name: "Daily Food",
    fullImage: "/daily-food.jpg",
  });
  mocks.startDailyPuzzle.mockReturnValue(true);
  mocks.loadPacksData.mockResolvedValue({
    PUZZLE_PACKS: [
      {
        id: "food",
        name: "Food",
        description: "Desserts, coffee, burgers, pasta, fruit",
        emoji: "🍕",
        category: "food",
      },
    ],
    getPuzzlesForPack: () => [
      {
        id: "burger",
        name: "Burger",
        category: "food",
        thumbnail: "/burger-thumb.jpg",
        fullImage: "/burger-full.jpg",
      },
      {
        id: "charcuterie-board",
        name: "Charcuterie Board",
        category: "food",
        thumbnail: "/charcuterie-thumb.jpg",
        fullImage: "/charcuterie-full.jpg",
      },
    ],
  });

  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    writable: true,
    value: vi.fn(function scrollTo(
      this: HTMLElement,
      { left = 0 }: ScrollToOptions = {},
    ) {
      Object.defineProperty(this, "scrollLeft", {
        configurable: true,
        value: left,
        writable: true,
      });
    }),
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
      return 0;
    },
  });
});

describe("dialog parity", () => {
  it("keeps shared action dialogs consistent with title, close button, and actions", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <HelpChoiceModal
        isOpen
        onClose={vi.fn()}
        onHowToPlay={vi.fn()}
        onKeyboardShortcuts={vi.fn()}
        onShowAbout={vi.fn()}
        onOpenTheme={vi.fn()}
        onOpenFeedback={vi.fn()}
        onOpenAdvanced={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: /help/i })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^close$/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /how to play/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /keyboard and controls/i })).toBeTruthy();

    render(<AboutModal isOpen onClose={vi.fn()} onShowWhatsNew={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: /about/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /get involved/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /meet the team/i })).toBeTruthy();

    render(<WhatsNewModal isOpen onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: /what's new/i })).toBeTruthy();
    expect(screen.getByText("Version 1.0")).toBeTruthy();

    openSpy.mockRestore();
  });

  it("keeps the daily dialog async-safe and startable after load", async () => {
    render(<DailyDifficultyModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/loading/i)).toBeTruthy();
    expect(await screen.findByText(/same puzzle for everyone/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /show more difficulty options/i }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /show more difficulty options/i }),
    );
    expect(screen.getByRole("button", { name: /master - 49 pieces/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /start today.?s puzzle/i }));
    expect(mocks.startDailyPuzzle).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith("/play");
  });

  it("keeps choose puzzle parity across staged flow with persistent arrow controls", async () => {
    render(<ChoosePuzzleModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("option", { name: /^food$/i }));

    expect(await screen.findByRole("listbox", { name: /choose a puzzle/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /scroll left/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /scroll right/i })).toBeTruthy();

    fireEvent.click(screen.getAllByRole("option")[0]!);

    expect(await screen.findByRole("button", { name: /start puzzle/i })).toBeTruthy();
    expect(screen.getAllByText(/pieces/i).length).toBeGreaterThan(0);
  });

  it("keeps pack choice async-safe from loading state through setup", async () => {
    const packsDeferred = deferred<{
      PUZZLE_PACKS: Array<{
        id: string;
        name: string;
        description: string;
        emoji: string;
        category: string;
      }>;
      getPuzzlesForPack: () => Array<{
        id: string;
        name: string;
        category: string;
        thumbnail: string;
        fullImage: string;
      }>;
    }>();

    mocks.loadPacksData.mockReturnValueOnce(packsDeferred.promise);

    render(<PackChoiceModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText(/loading/i)).toBeTruthy();

    await act(async () => {
      packsDeferred.resolve({
        PUZZLE_PACKS: [
          {
            id: "food",
            name: "Food",
            description: "Desserts, coffee, burgers, pasta, fruit",
            emoji: "🍕",
            category: "food",
          },
        ],
        getPuzzlesForPack: () => [
          {
            id: "burger",
            name: "Burger",
            category: "food",
            thumbnail: "/burger-thumb.jpg",
            fullImage: "/burger-full.jpg",
          },
          {
            id: "charcuterie-board",
            name: "Charcuterie Board",
            category: "food",
            thumbnail: "/charcuterie-thumb.jpg",
            fullImage: "/charcuterie-full.jpg",
          },
        ],
      });
      await packsDeferred.promise;
    });

    expect(
      await screen.findByRole("option", { name: /food, 2 puzzles, 1 solved/i }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: /food, 2 puzzles, 1 solved/i }));

    expect(await screen.findByRole("listbox", { name: /choose a puzzle/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /scroll left/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /scroll right/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("option", { name: /burger/i }));

    expect(await screen.findByRole("button", { name: /start puzzle/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /^food$/i })).toBeTruthy();
    expect(screen.queryByText("Burger")).toBeNull();
  });
});
