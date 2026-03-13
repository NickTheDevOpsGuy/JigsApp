import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchImageUrlAsDataUrl, validateImageForGrid } from "../useImagePicker";

describe("validateImageForGrid", () => {
  it("returns error on invalid or unloadable data URL", async () => {
    const result = await validateImageForGrid("not-an-image", 3, 3);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe("string");
    }
  });
});

describe("fetchImageUrlAsDataUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid URLs before fetching", async () => {
    await expect(
      fetchImageUrlAsDataUrl("not-a-url", vi.fn() as typeof fetch),
    ).rejects.toThrow("Enter a valid image URL starting with http:// or https://.");
  });

  it("rejects non-image responses", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(new Blob(["hello"], { type: "text/plain" }), {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
    );

    await expect(
      fetchImageUrlAsDataUrl("https://example.com/file.txt", fetchMock as typeof fetch),
    ).rejects.toThrow(
      "That URL did not return an image. Try a direct PNG, JPG, or WebP link.",
    );
  });

  it("converts supported image responses into data URLs", async () => {
    const readerMock = class {
      public result: string | ArrayBuffer | null = null;
      public onload: null | (() => void) = null;
      public onerror: null | (() => void) = null;

      readAsDataURL(blob: Blob) {
        this.result = `data:${blob.type};base64,ZmFrZQ==`;
        this.onload?.();
      }
    };

    vi.stubGlobal("FileReader", readerMock);

    const fetchMock = vi.fn(
      async () =>
        new Response(new Blob(["fake"], { type: "image/png" }), {
          status: 200,
          headers: { "content-type": "image/png" },
        }),
    );

    await expect(
      fetchImageUrlAsDataUrl("https://example.com/puzzle.png", fetchMock as typeof fetch),
    ).resolves.toBe("data:image/png;base64,ZmFrZQ==");
  });
});
