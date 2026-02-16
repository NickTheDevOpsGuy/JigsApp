/**
 * useTheme tests – setTheme and cycleTheme behavior.
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme } from "./useTheme";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("useTheme", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("light");
  });

  it("setTheme updates theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("forest"));
    expect(result.current.theme).toBe("forest");
  });

  it("cycleTheme cycles through themes", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe("dark");
    act(() => {
      result.current.cycleTheme();
      result.current.cycleTheme();
    });
    expect(result.current.theme).toBe("ocean");
  });
});
