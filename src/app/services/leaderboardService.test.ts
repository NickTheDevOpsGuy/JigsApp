import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPercentileRank,
  getTodayCompletionCount,
  type PercentileResult,
} from "./leaderboardService";

const { results, mockSupabase } = vi.hoisted(() => {
  const results: { count: number | null; error: Error | null }[] = [];
  const makeChain = () => ({
    then: (r: (v: unknown) => void) =>
      Promise.resolve(results.shift() ?? { count: 0, error: null }).then(r),
    eq: () => makeChain(),
    lt: () => Promise.resolve(results.shift() ?? { count: 0, error: null }),
  });
  const mockSupabase = {
    from: () => ({
      select: () => makeChain(),
    }),
  };
  return { results, mockSupabase };
});

vi.mock("@/supabase/client", () => ({
  supabase: mockSupabase,
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/daily/dailyPuzzleCore", () => ({
  getTodayDateString: () => "2025-02-15",
}));

beforeEach(() => {
  results.length = 0;
});

describe("getPercentileRank", () => {
  it("returns null when Supabase is not configured", async () => {
    const { isSupabaseConfigured } = await import("@/supabase/client");
    vi.mocked(isSupabaseConfigured).mockReturnValueOnce(false);
    const { getPercentileRank: getRank } = await import("./leaderboardService");
    const result = await getRank("2025-02-15", { rows: 4, cols: 4 }, 120);
    expect(result).toBeNull();
  });

  it("returns firstFinisher when totalCount is 1", async () => {
    results.push({ count: 1, error: null });
    const result = await getPercentileRank("2025-02-15", { rows: 4, cols: 4 }, 90);
    expect(result).toEqual({ percentile: null, firstFinisher: true });
  });

  it("returns percentile when totalCount >= 2", async () => {
    results.push({ count: 100, error: null }, { count: 11, error: null });
    const result = await getPercentileRank("2025-02-15", { rows: 4, cols: 4 }, 90);
    expect(result).toEqual({
      percentile: 12,
      firstFinisher: false,
    } as PercentileResult);
  });

  it("returns null on count error", async () => {
    results.push({ count: null, error: new Error("db") });
    const result = await getPercentileRank("2025-02-15", { rows: 4, cols: 4 }, 90);
    expect(result).toBeNull();
  });
});

describe("getTodayCompletionCount", () => {
  it("returns 0 when Supabase is not configured", async () => {
    const { isSupabaseConfigured } = await import("@/supabase/client");
    vi.mocked(isSupabaseConfigured).mockReturnValueOnce(false);
    const { getTodayCompletionCount: getCount } = await import("./leaderboardService");
    const result = await getCount();
    expect(result).toBe(0);
  });

  it("returns count from Supabase", async () => {
    results.push({ count: 42, error: null });
    const result = await getTodayCompletionCount();
    expect(result).toBe(42);
  });

  it("returns 0 on error", async () => {
    results.push({ count: null, error: new Error("db") });
    const result = await getTodayCompletionCount();
    expect(result).toBe(0);
  });
});
