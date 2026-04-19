import { describe, it, expect } from "vitest";
import { buildReplayExportPayload, replayExportFilename } from "./replayExport";

describe("replayExport", () => {
  it("builds a versioned payload from snapshots", () => {
    const payload = buildReplayExportPayload({
      snapshots: [
        {
          elapsedSeconds: 0,
          moveCount: 0,
          savedPieces: [],
        },
        {
          elapsedSeconds: 12,
          moveCount: 3,
          savedPieces: [],
        },
      ],
      puzzleKey: 42,
      puzzleName: "Test Puzzle!",
      totalSeconds: 12,
    });
    expect(payload).not.toBeNull();
    expect(payload?.version).toBe(1);
    expect(payload?.app).toBe("phuzzle");
    expect(payload?.puzzleKey).toBe("42");
    expect(payload?.snapshotCount).toBe(2);
  });

  it("returns null for empty snapshots", () => {
    expect(
      buildReplayExportPayload({
        snapshots: [],
        puzzleKey: null,
        totalSeconds: 0,
      }),
    ).toBeNull();
  });

  it("builds a safe filename from puzzle name", () => {
    const payload = buildReplayExportPayload({
      snapshots: [
        { elapsedSeconds: 0, moveCount: 0, savedPieces: [] },
        { elapsedSeconds: 1, moveCount: 1, savedPieces: [] },
      ],
      puzzleKey: null,
      puzzleName: "Hello World",
      totalSeconds: 1,
    });
    expect(payload).not.toBeNull();
    const name = replayExportFilename(payload!);
    expect(name).toMatch(/^phuzzle-replay-hello-world-\d{8}\.json$/);
  });
});
