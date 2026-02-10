import { describe, it, expect } from "vitest";
import { parseGrid } from "./playScreenUtils";

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
