import { describe, expect, it } from "vitest";
import { isFirefoxBrowser } from "./browserInfo";

describe("isFirefoxBrowser", () => {
  it("detects desktop Firefox", () => {
    expect(
      isFirefoxBrowser(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0",
      ),
    ).toBe(true);
  });

  it("detects Firefox on iOS", () => {
    expect(
      isFirefoxBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/146.0 Mobile/15E148 Safari/605.1.15",
      ),
    ).toBe(true);
  });

  it("does not flag Chromium browsers", () => {
    expect(
      isFirefoxBrowser(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
  });

  it("handles empty values", () => {
    expect(isFirefoxBrowser("")).toBe(false);
    expect(isFirefoxBrowser(undefined)).toBe(false);
    expect(isFirefoxBrowser(null)).toBe(false);
  });
});

