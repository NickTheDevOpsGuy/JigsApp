import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  DEFAULT_TIME_MODE,
  getQuadrant,
  getQuadrantPb,
  getQuadrantPbKey,
  normalizeTimeMode,
  setQuadrantPb,
} from "@/screens/Play/core/time/timeMode";

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

describe("getQuadrant", () => {
  it("returns 0 (TL) for top-left cells in 4x4", () => {
    expect(getQuadrant(0, 0, 4, 4)).toBe(0);
    expect(getQuadrant(1, 0, 4, 4)).toBe(0);
    expect(getQuadrant(0, 1, 4, 4)).toBe(0);
    expect(getQuadrant(1, 1, 4, 4)).toBe(0);
  });

  it("returns 1 (TR) for top-right cells in 4x4", () => {
    expect(getQuadrant(0, 2, 4, 4)).toBe(1);
    expect(getQuadrant(0, 3, 4, 4)).toBe(1);
    expect(getQuadrant(1, 2, 4, 4)).toBe(1);
    expect(getQuadrant(1, 3, 4, 4)).toBe(1);
  });

  it("returns 2 (BL) for bottom-left cells in 4x4", () => {
    expect(getQuadrant(2, 0, 4, 4)).toBe(2);
    expect(getQuadrant(3, 0, 4, 4)).toBe(2);
    expect(getQuadrant(2, 1, 4, 4)).toBe(2);
  });

  it("returns 3 (BR) for bottom-right cells in 4x4", () => {
    expect(getQuadrant(2, 2, 4, 4)).toBe(3);
    expect(getQuadrant(3, 3, 4, 4)).toBe(3);
  });

  it("handles odd grid 3x3", () => {
    // row < 1.5, col < 1.5 => 0
    expect(getQuadrant(0, 0, 3, 3)).toBe(0);
    expect(getQuadrant(0, 1, 3, 3)).toBe(0);
    expect(getQuadrant(1, 0, 3, 3)).toBe(0);
    expect(getQuadrant(1, 1, 3, 3)).toBe(0);
    // row < 1.5, col >= 1.5 => 1
    expect(getQuadrant(0, 2, 3, 3)).toBe(1);
    expect(getQuadrant(1, 2, 3, 3)).toBe(1);
    // row >= 1.5, col < 1.5 => 2
    expect(getQuadrant(2, 0, 3, 3)).toBe(2);
    expect(getQuadrant(2, 1, 3, 3)).toBe(2);
    // row >= 1.5, col >= 1.5 => 3
    expect(getQuadrant(2, 2, 3, 3)).toBe(3);
  });
});

describe("quadrant Pb", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    store = {};
  });

  afterEach(() => {
    try {
      for (let q = 0; q < 4; q++) {
        localStorage.removeItem(getQuadrantPbKey(4, 4, q as 0 | 1 | 2 | 3));
      }
    } catch {
      /* ignore */
    }
  });

  it("returns null when no pb stored", () => {
    expect(getQuadrantPb(4, 4, 0)).toBeNull();
    expect(getQuadrantPb(4, 4, 3)).toBeNull();
  });

  it("stores and retrieves quadrant pb", () => {
    setQuadrantPb(4, 4, 1, 45);
    const result = getQuadrantPb(4, 4, 1);
    expect(result).toBe(45);
  });

  it("uses correct key per grid and quadrant", () => {
    expect(getQuadrantPbKey(4, 4, 0)).toBe("phuzzle:quadrantPb_4x4_q0");
    expect(getQuadrantPbKey(6, 6, 3)).toBe("phuzzle:quadrantPb_6x6_q3");
  });
});

describe("normalizeTimeMode", () => {
  it("maps legacy elapsed mode to default mode", () => {
    expect(normalizeTimeMode("elapsed")).toBe(DEFAULT_TIME_MODE);
  });

  it("keeps selectable modes", () => {
    expect(normalizeTimeMode("countdown")).toBe("countdown");
    expect(normalizeTimeMode("active")).toBe("active");
  });

  it("falls back for invalid or empty values", () => {
    expect(normalizeTimeMode("unknown")).toBe(DEFAULT_TIME_MODE);
    expect(normalizeTimeMode(null)).toBe(DEFAULT_TIME_MODE);
    expect(normalizeTimeMode(undefined)).toBe(DEFAULT_TIME_MODE);
    expect(normalizeTimeMode("")).toBe(DEFAULT_TIME_MODE);
  });
});
