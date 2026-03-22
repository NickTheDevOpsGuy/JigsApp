import { describe, it, expect } from "vitest";
import { getCurrentSeason } from "./seasons";

describe("getCurrentSeason", () => {
  it("returns winter for Dec, Jan, Feb", () => {
    expect(getCurrentSeason(new Date(2025, 11, 15))).toBe("winter"); // Dec
    expect(getCurrentSeason(new Date(2025, 0, 15))).toBe("winter"); // Jan
    expect(getCurrentSeason(new Date(2025, 1, 15))).toBe("winter"); // Feb
  });

  it("returns spring for Mar, Apr, May", () => {
    expect(getCurrentSeason(new Date(2025, 2, 15))).toBe("spring"); // Mar
    expect(getCurrentSeason(new Date(2025, 3, 15))).toBe("spring"); // Apr
    expect(getCurrentSeason(new Date(2025, 4, 15))).toBe("spring"); // May
  });

  it("returns summer for Jun, Jul, Aug", () => {
    expect(getCurrentSeason(new Date(2025, 5, 15))).toBe("summer"); // Jun
    expect(getCurrentSeason(new Date(2025, 6, 15))).toBe("summer"); // Jul
    expect(getCurrentSeason(new Date(2025, 7, 15))).toBe("summer"); // Aug
  });

  it("returns fall for Sep, Oct, Nov", () => {
    expect(getCurrentSeason(new Date(2025, 8, 15))).toBe("fall"); // Sep
    expect(getCurrentSeason(new Date(2025, 9, 15))).toBe("fall"); // Oct
    expect(getCurrentSeason(new Date(2025, 10, 15))).toBe("fall"); // Nov
  });
});
