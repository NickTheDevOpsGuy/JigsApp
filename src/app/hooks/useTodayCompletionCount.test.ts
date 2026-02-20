/**
 * useTodayCompletionCount tests – returns 0 when Supabase not configured.
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useTodayCompletionCount } from "./useTodayCompletionCount";

vi.mock("@/supabase/client", () => ({
  supabase: null,
  isSupabaseConfigured: vi.fn(() => false),
}));

vi.mock("@/daily/dailyPuzzleCore", () => ({
  getTodayDateString: () => "2025-02-15",
}));

describe("useTodayCompletionCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when Supabase is not configured", () => {
    const { result } = renderHook(() => useTodayCompletionCount());
    expect(result.current).toBe(0);
  });
});
