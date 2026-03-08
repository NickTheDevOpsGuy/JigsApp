/**
 * useTheme tests – setTheme and cycleTheme behavior.
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme, THEMES } from "../useTheme";

vi.mock("@/audio/audioManager", () => ({
  audioManager: { onThemeChange: vi.fn() },
}));

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
    const initial = result.current.theme;
    expect(THEMES).toContain(initial);
    act(() => result.current.cycleTheme());
    const afterOne = result.current.theme;
    expect(afterOne).not.toBe(initial);
    for (let i = 0; i < THEMES.length - 1; i++) {
      act(() => result.current.cycleTheme());
    }
    expect(result.current.theme).toBe(initial);
  });
});
