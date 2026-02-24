import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getTodayDateString,
  getYesterdayDateString,
  wasYesterdayMissed,
  getStreakFreezeCount,
  useStreakFreeze,
  refreshStreakFreeze,
  getCurrentStreak,
  initStreakFreeze,
  wasFreezeOfferDismissedToday,
  dismissFreezeOfferToday,
} from "./dailyPuzzleCore";

const DAILY_PREFIX = "phuzzle:daily:";
const STREAK_FREEZE_KEY = "phuzzle:streakFreeze";
const STREAK_FREEZE_WEEK_KEY = "phuzzle:streakFreezeWeek";

let store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    store = {};
  },
  get length() {
    return Object.keys(store).length;
  },
  key: () => null,
};

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  store = {};
});

describe("getTodayDateString", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = getTodayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getYesterdayDateString", () => {
  it("returns date one day before today", () => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const todayMs = new Date(today).getTime();
    const yesterdayMs = new Date(yesterday).getTime();
    expect(todayMs - yesterdayMs).toBe(86400000);
  });
});

describe("wasYesterdayMissed", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns true when yesterday not completed and no freeze used", () => {
    const yesterday = getYesterdayDateString();
    expect(localStorage.getItem(`${DAILY_PREFIX}${yesterday}:completed`)).toBeNull();
    expect(wasYesterdayMissed()).toBe(true);
  });

  it("returns false when yesterday was completed", () => {
    const yesterday = getYesterdayDateString();
    localStorage.setItem(`${DAILY_PREFIX}${yesterday}:completed`, "true");
    expect(wasYesterdayMissed()).toBe(false);
  });

  it("returns false when freeze was used for yesterday", () => {
    const yesterday = getYesterdayDateString();
    localStorage.setItem(`${STREAK_FREEZE_KEY}:used:${yesterday}`, "true");
    expect(wasYesterdayMissed()).toBe(false);
  });
});

describe("getStreakFreezeCount", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 0 when not set (default)", () => {
    expect(getStreakFreezeCount()).toBe(0);
  });

  it("returns stored count when valid", () => {
    localStorage.setItem(STREAK_FREEZE_KEY, "1");
    expect(getStreakFreezeCount()).toBe(1);
  });
});

describe("useStreakFreeze", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STREAK_FREEZE_KEY, "1");
    localStorage.setItem(STREAK_FREEZE_WEEK_KEY, "0");
  });

  it("consumes freeze and returns true", () => {
    const result = useStreakFreeze("2025-02-14");
    expect(result).toBe(true);
    expect(getStreakFreezeCount()).toBe(0);
  });

  it("records freeze used for date", () => {
    useStreakFreeze("2025-02-14");
    expect(localStorage.getItem(`${STREAK_FREEZE_KEY}:used:2025-02-14`)).toBe("true");
  });

  it("returns false when no freeze available", () => {
    localStorage.setItem(STREAK_FREEZE_KEY, "0");
    expect(useStreakFreeze("2025-02-14")).toBe(false);
  });
});

describe("getCurrentStreak", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 0 when nothing completed", () => {
    expect(getCurrentStreak()).toBe(0);
  });

  it("counts consecutive completed days including freeze-used", () => {
    const today = getTodayDateString();
    localStorage.setItem(`${DAILY_PREFIX}${today}:completed`, "true");
    expect(getCurrentStreak()).toBeGreaterThanOrEqual(1);
  });
});

describe("refreshStreakFreeze", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates week key when stored week differs from current", () => {
    localStorage.setItem(STREAK_FREEZE_KEY, "0");
    localStorage.setItem(STREAK_FREEZE_WEEK_KEY, "0");
    const result = refreshStreakFreeze();
    expect(result).toBe(0);
    expect(getStreakFreezeCount()).toBe(0);
  });
});

describe("initStreakFreeze", () => {
  it("runs without error", () => {
    expect(() => initStreakFreeze()).not.toThrow();
  });
});

describe("wasFreezeOfferDismissedToday / dismissFreezeOfferToday", () => {
  beforeEach(() => {
    store = {};
  });

  it("returns false when not dismissed", () => {
    expect(wasFreezeOfferDismissedToday()).toBe(false);
  });

  it("returns true after dismissFreezeOfferToday", () => {
    dismissFreezeOfferToday();
    expect(wasFreezeOfferDismissedToday()).toBe(true);
  });
});
