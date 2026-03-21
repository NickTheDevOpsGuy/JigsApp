/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const removeChannel = vi.fn();
  const track = vi.fn();
  const subscribe = vi.fn();
  const channelOn = vi.fn();
  const selectSingle = vi.fn();
  const eq = vi.fn(() => ({
    single: selectSingle,
  }));
  const updateEq = vi.fn();
  const insertSelectSingle = vi.fn();
  const update = vi.fn(() => ({
    eq: updateEq,
  }));
  const insert = vi.fn(() => ({
    select: () => ({
      single: insertSelectSingle,
    }),
  }));
  const select = vi.fn(() => ({
    eq,
    single: selectSingle,
  }));
  const from = vi.fn(() => ({
    insert,
    select,
    update,
  }));
  const channel = vi.fn(() => ({
    on: channelOn,
    subscribe,
    track,
    presenceState: () => ({}),
  }));

  return {
    removeChannel,
    track,
    subscribe,
    channelOn,
    selectSingle,
    eq,
    updateEq,
    insertSelectSingle,
    update,
    insert,
    select,
    from,
    channel,
  };
});

vi.mock("@/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    from: mocks.from,
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
  },
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

import {
  createPuzzleSession,
  getPuzzleSession,
  subscribePuzzleSession,
  updatePuzzleSession,
} from "../puzzleSessionService";

describe("puzzleSessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertSelectSingle.mockResolvedValue({
      data: { id: "session-123" },
      error: null,
    });
    mocks.selectSingle.mockResolvedValue({
      data: {
        id: "session-123",
        image_url: "https://example.com/puzzle.png",
        grid_rows: 3,
        grid_cols: 3,
        state_json: { pieces: [], elapsedSeconds: 12, isComplete: false },
        elapsed_seconds: 12,
        is_complete: false,
        created_at: "2099-01-01T00:00:00.000Z",
        updated_at: "2099-01-01T00:00:00.000Z",
      },
      error: null,
    });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.subscribe.mockImplementation(async (cb?: (status: string) => void) => {
      await cb?.("SUBSCRIBED");
    });
    mocks.channelOn.mockImplementation(() => ({
      on: mocks.channelOn,
      subscribe: mocks.subscribe,
      track: mocks.track,
      presenceState: () => ({}),
    }));
  });

  it("creates a session and returns the session id", async () => {
    const result = await createPuzzleSession(
      "https://example.com/puzzle.png",
      { rows: 3, cols: 3 },
      { pieces: [], elapsedSeconds: 0, isComplete: false },
    );

    expect(result).toEqual({ sessionId: "session-123" });
    expect(mocks.from).toHaveBeenCalledWith("puzzle_sessions");
  });

  it("loads a non-expired session", async () => {
    const result = await getPuzzleSession("session-123");

    expect(mocks.eq).toHaveBeenCalledWith("id", "session-123");
    expect(result?.id).toBe("session-123");
    expect(result?.grid).toEqual({ rows: 3, cols: 3 });
  });

  it("updates an existing session", async () => {
    const ok = await updatePuzzleSession("session-123", {
      pieces: [],
      elapsedSeconds: 25,
      isComplete: true,
    });

    expect(ok).toBe(true);
    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.updateEq).toHaveBeenCalledWith("id", "session-123");
  });

  it("subscribes and returns cleanup helpers", () => {
    const onUpdate = vi.fn();
    const onPresence = vi.fn();
    const onStatus = vi.fn();

    const result = subscribePuzzleSession("session-123", onUpdate, onPresence, onStatus);

    expect(mocks.channel).toHaveBeenCalledWith("puzzle:session-123");
    expect(mocks.channelOn).toHaveBeenCalled();
    expect(mocks.subscribe).toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalled();

    result.setPresence({ role: "host" });
    expect(mocks.track).toHaveBeenCalledWith({ role: "host" });

    result.unsubscribe();
    expect(mocks.removeChannel).toHaveBeenCalled();
  });
});
