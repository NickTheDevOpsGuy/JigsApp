import { describe, expect, it } from "vitest";
import { computeBoardFitScale } from "./boardFitScale";

describe("computeBoardFitScale", () => {
  it("scales down when board is smaller than content", () => {
    expect(computeBoardFitScale(100, 100, 200, 200)).toBe(0.5);
  });

  it("scales up when board is larger than content (no max of 1)", () => {
    expect(computeBoardFitScale(400, 400, 200, 200)).toBe(2);
  });

  it("uses the tighter axis when aspect ratios differ", () => {
    expect(computeBoardFitScale(400, 200, 200, 200)).toBe(1);
  });

  it("returns 1 for non-positive content", () => {
    expect(computeBoardFitScale(100, 100, 0, 200)).toBe(1);
    expect(computeBoardFitScale(100, 100, 200, -1)).toBe(1);
  });
});
