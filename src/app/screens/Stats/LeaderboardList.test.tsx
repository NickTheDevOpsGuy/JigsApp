/**
 * LeaderboardList tests – rendering and expand behavior.
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  LeaderboardList,
  TimeLeaderboardList,
  StreakLeaderboardList,
  CompletionLeaderboardList,
} from "./LeaderboardList";
import type {
  LeaderboardEntry,
  StreakEntry,
  CompletionCountEntry,
} from "@/services/leaderboardService";

vi.mock("@/screens/Play/playUtils", () => ({
  formatTime: (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`,
}));

describe("LeaderboardList", () => {
  it("shows empty message when no entries", () => {
    render(
      <LeaderboardList
        entries={[]}
        emptyMsg="No one yet"
        compact={false}
        expandedRowKey={null}
        onToggleExpand={() => {}}
        getValue={() => ""}
        keyPrefix="test"
      />,
    );
    expect(screen.getByText("No one yet")).toBeTruthy();
  });

  it("renders entries with expand toggle", () => {
    const entries: LeaderboardEntry[] = [
      { rank: 1, elapsedSeconds: 90, displayName: "Alice" },
      { rank: 2, elapsedSeconds: 120, displayName: "Bob" },
    ];
    render(
      <LeaderboardList
        entries={entries}
        emptyMsg="Empty"
        compact={false}
        expandedRowKey={null}
        onToggleExpand={() => {}}
        getValue={(e) => `${(e as LeaderboardEntry).elapsedSeconds}s`}
        getDetail={(e) => `Detail: ${(e as LeaderboardEntry).displayName}`}
        keyPrefix="test"
      />,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("90s")).toBeTruthy();
    expect(screen.getByText("120s")).toBeTruthy();
  });
});

describe("TimeLeaderboardList", () => {
  it("shows formatted times and empty message", () => {
    render(
      <TimeLeaderboardList
        entries={[]}
        emptyMsg="No completions"
        compact={false}
        expandedRowKey={null}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("No completions")).toBeTruthy();
  });

  it("renders time entries", () => {
    const entries: LeaderboardEntry[] = [
      { rank: 1, elapsedSeconds: 65, displayName: "Fast" },
    ];
    render(
      <TimeLeaderboardList
        entries={entries}
        emptyMsg="Empty"
        compact={false}
        expandedRowKey={null}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("Fast")).toBeTruthy();
    expect(screen.getByText("1:05")).toBeTruthy();
  });
});

describe("StreakLeaderboardList", () => {
  it("shows streak entries", () => {
    const entries: StreakEntry[] = [{ rank: 1, streak: 7, displayName: "Fire" }];
    render(
      <StreakLeaderboardList
        entries={entries}
        emptyMsg="Empty"
        compact={false}
        expandedRowKey={null}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("Fire")).toBeTruthy();
    expect(screen.getByText("7 days")).toBeTruthy();
  });
});

describe("CompletionLeaderboardList", () => {
  it("shows count entries", () => {
    const entries: CompletionCountEntry[] = [{ rank: 1, count: 50, displayName: "Pro" }];
    render(
      <CompletionLeaderboardList
        entries={entries}
        emptyMsg="Empty"
        compact={false}
        expandedRowKey={null}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText("Pro")).toBeTruthy();
    expect(screen.getByText("50 puzzles")).toBeTruthy();
  });
});
