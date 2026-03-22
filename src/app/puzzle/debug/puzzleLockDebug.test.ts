import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { lockDebug } from "@/puzzle/debug/puzzleLockDebug";

function installMockLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

describe("puzzleLockDebug", () => {
  beforeEach(() => {
    installMockLocalStorage();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not log when lock debug is disabled", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    lockDebug("disabled-case", { x: 1 });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("dedupes repeated identical logs in a short window", () => {
    localStorage.setItem("phuzzle:debugLocks", "1");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    lockDebug("overlap-block", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      dx: 33,
      dy: 0,
    });
    lockDebug("overlap-block", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      dx: 33,
      dy: 0,
    });
    lockDebug("overlap-block", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      dx: 33,
      dy: 0,
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("allows logging again after the dedupe window expires", () => {
    localStorage.setItem("phuzzle:debugLocks", "1");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    lockDebug("overlap-block-time-window", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      dx: 33,
      dy: 0,
    });
    vi.advanceTimersByTime(151);
    lockDebug("overlap-block-time-window", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      dx: 33,
      dy: 0,
    });

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("dedupes overlap-block even when bounds and deltas vary frame-to-frame", () => {
    localStorage.setItem("phuzzle:debugLocks", "1");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    lockDebug("overlap-block", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      movingPieceId: "p8",
      blockingPieceId: "p7",
      dx: 33,
      dy: 1,
      movingBounds: { minX: 100, minY: 200, maxX: 140, maxY: 240 },
      blockingBounds: { minX: 139, minY: 200, maxX: 179, maxY: 240 },
    });
    lockDebug("overlap-block", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      movingPieceId: "p8",
      blockingPieceId: "p7",
      dx: 32,
      dy: 0,
      movingBounds: { minX: 101, minY: 200, maxX: 141, maxY: 240 },
      blockingBounds: { minX: 139, minY: 200, maxX: 179, maxY: 240 },
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(751);
    lockDebug("overlap-block", {
      movingGroupId: "p8",
      blockingGroupId: "p4",
      movingPieceId: "p8",
      blockingPieceId: "p7",
      dx: 30,
      dy: -1,
      movingBounds: { minX: 102, minY: 200, maxX: 142, maxY: 240 },
      blockingBounds: { minX: 139, minY: 200, maxX: 179, maxY: 240 },
    });

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
