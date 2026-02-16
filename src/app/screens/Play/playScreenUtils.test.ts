import { describe, it, expect } from "vitest";
import { parseGrid, getSuggestedGrid } from "./playScreenUtils";

describe("parseGrid", () => {
  it("returns default 4x4 when stored is null", () => {
    expect(parseGrid(null)).toEqual({ rows: 4, cols: 4 });
  });

  it("returns default 4x4 when stored is empty string", () => {
    expect(parseGrid("")).toEqual({ rows: 4, cols: 4 });
  });

  it("parses 3x3", () => {
    expect(parseGrid("3x3")).toEqual({ rows: 3, cols: 3 });
  });

  it("parses 6x6", () => {
    expect(parseGrid("6x6")).toEqual({ rows: 6, cols: 6 });
  });

  it("returns default for invalid format", () => {
    expect(parseGrid("invalid")).toEqual({ rows: 4, cols: 4 });
    expect(parseGrid("5")).toEqual({ rows: 4, cols: 4 });
  });
});

describe("getSuggestedGrid", () => {
  it("suggests 3x3 when no sizes completed", () => {
    const getBestTime = () => null;
    const result = getSuggestedGrid(getBestTime);
    expect(result).toEqual({
      gridIndex: 0,
      rows: 3,
      cols: 3,
      label: "Easy 🌱 (3×3)",
    });
  });

  it("suggests 4x4 when 3x3 completed", () => {
    const getBestTime = (r: number, c: number) => (r === 3 && c === 3 ? 120 : null);
    const result = getSuggestedGrid(getBestTime);
    expect(result).toEqual({
      gridIndex: 1,
      rows: 4,
      cols: 4,
      label: "Medium ⚡ (4×4)",
    });
  });

  it("suggests 6x6 when 5x5 completed", () => {
    const getBestTime = (r: number, c: number) => (r <= 5 && c <= 5 ? 60 : null);
    const result = getSuggestedGrid(getBestTime);
    expect(result).toEqual({
      gridIndex: 3,
      rows: 6,
      cols: 6,
      label: "Expert 👑 (6×6)",
    });
  });

  it("returns null when all preset sizes completed", () => {
    const getBestTime = () => 90;
    const result = getSuggestedGrid(getBestTime);
    expect(result).toBeNull();
  });

  it("returns null when getBestTime throws", () => {
    const getBestTime = () => {
      throw new Error("storage error");
    };
    const result = getSuggestedGrid(getBestTime);
    expect(result).toBeNull();
  });
});
