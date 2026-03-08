/**
 * useReplay tests – snapshot recording, canReplay, clearSnapshots, start/stop replay.
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Piece, PuzzleState } from "@/puzzle/core/types";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { ReplayStateRef } from "../useReplay";
import { useReplay } from "../useReplay";

function makePiece(id: string, overrides: Partial<Piece> = {}): Piece {
  return {
    id,
    row: 0,
    col: 0,
    x: 0,
    y: 0,
    z: 1,
    w: 100,
    h: 100,
    tileW: 80,
    tileH: 80,
    pad: 10,
    targetX: 0,
    targetY: 0,
    rotation: 0,
    targetRotation: 0,
    isPlaced: false,
    locked: false,
    groupId: id,
    justSnapped: false,
    shapePath: "",
    inTray: true,
    edges: { top: "flat", right: "flat", bottom: "flat", left: "flat" },
    ...overrides,
  };
}

function makeState(pieces: Piece[]): PuzzleState {
  return {
    imageUrl: "test-image",
    grid: { rows: 2, cols: 2 },
    pieces,
    placedCount: 0,
    totalCount: pieces.length,
    isComplete: false,
  };
}

describe("useReplay", () => {
  it("returns canReplay false when manager is null", () => {
    const setState = vi.fn();
    const replayStateRef = { current: null as ReplayStateRef | null };
    const { result } = renderHook(() => useReplay(null, setState, replayStateRef, false));
    expect(result.current.canReplay).toBe(false);
    expect(result.current.snapshots).toEqual([]);
  });

  it("clearSnapshots does not throw and leaves snapshots empty", () => {
    const setState = vi.fn();
    const replayStateRef = { current: null as ReplayStateRef | null };
    const { result } = renderHook(() => useReplay(null, setState, replayStateRef, false));
    act(() => {
      result.current.clearSnapshots();
    });
    expect(result.current.snapshots).toEqual([]);
  });

  it("startReplay and stopReplay do not throw when manager is null", () => {
    const setState = vi.fn();
    const replayStateRef = { current: null as ReplayStateRef | null };
    const { result } = renderHook(() => useReplay(null, setState, replayStateRef, false));
    act(() => {
      result.current.startReplay();
    });
    act(() => {
      result.current.stopReplay();
    });
    expect(result.current.isReplaying).toBe(false);
  });

  it("recordSnapshot adds snapshots; canReplay is true only when snapshots.length > 1", () => {
    const state = makeState([makePiece("p1")]);
    const setState = vi.fn();
    const replayStateRef = {
      current: {
        getState: () => state,
        elapsedSeconds: 0,
        moveCount: 0,
      } as ReplayStateRef,
    };
    const manager = {
      restoreFromSaved: vi.fn(),
      getState: () => state,
    } as unknown as PuzzleManager;

    const { result } = renderHook(() =>
      useReplay(manager, setState, replayStateRef, false),
    );

    expect(result.current.canReplay).toBe(false);
    expect(result.current.snapshots).toHaveLength(0);

    act(() => {
      result.current.recordSnapshot();
    });
    expect(result.current.snapshots).toHaveLength(1);
    expect(result.current.canReplay).toBe(false);

    act(() => {
      result.current.recordSnapshot();
    });
    expect(result.current.snapshots).toHaveLength(2);
    expect(result.current.canReplay).toBe(true);

    act(() => {
      result.current.clearSnapshots();
    });
    expect(result.current.snapshots).toHaveLength(0);
    expect(result.current.canReplay).toBe(false);
  });

  it("resumeReplay restarts from start when currently at end", () => {
    const state = makeState([makePiece("p1")]);
    const setState = vi.fn();
    const replayStateRef = {
      current: {
        getState: () => state,
        elapsedSeconds: 0,
        moveCount: 0,
      } as ReplayStateRef,
    };
    const manager = {
      restoreFromSaved: vi.fn(),
      getState: () => state,
    } as unknown as PuzzleManager;

    const { result } = renderHook(() =>
      useReplay(manager, setState, replayStateRef, false),
    );

    act(() => {
      result.current.recordSnapshot();
      result.current.recordSnapshot();
      result.current.startReplay();
      result.current.goToEnd();
    });

    expect(result.current.replayIndex).toBe(1);
    expect(result.current.isReplayPaused).toBe(true);

    act(() => {
      result.current.resumeReplay();
    });

    expect(result.current.replayIndex).toBe(0);
    expect(result.current.isReplaying).toBe(true);
    expect(result.current.isReplayPaused).toBe(false);
  });
});
