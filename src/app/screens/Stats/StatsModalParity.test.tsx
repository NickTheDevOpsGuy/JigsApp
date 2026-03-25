/**
 * Stats modal parity coverage for profile, board, badges, and shared header/tab UI.
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StatsScreenHeader } from "./components/StatsScreenHeader";
import { StatsTabBar } from "./components/StatsTabBar";
import { ProfileTab } from "./tabs/ProfileTab";
import { LeaderboardTabHeader } from "./tabs/LeaderboardTabHeader";
import { AchievementsTab } from "./tabs/AchievementsTab";
import {
  renderCompletionList,
  renderEfficiencyList,
  renderTimeList,
} from "./tabs/LeaderboardTabLists";

vi.mock("@/screens/Play/core/time/timeMode", () => ({
  getBestTime: vi.fn(() => 95),
}));

vi.mock("@/services/player/prestigeService", () => ({
  prestigeReset: vi.fn(async () => true),
}));

describe("Stats modal parity", () => {
  it("keeps leaderboard header compact while surfacing weekly progress", () => {
    render(
      <StatsScreenHeader
        activeTab="leaderboard"
        headerTitle="Board"
        weeklyAlbumProgress={4}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Phuzzle")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /board/i })).toBeTruthy();
    expect(screen.getByText("4/7 weekly")).toBeTruthy();
    expect(screen.getByRole("button", { name: /close/i })).toBeTruthy();
  });

  it("renders all top tabs with the board progress pill attached", () => {
    render(
      <StatsTabBar
        activeTab="leaderboard"
        setActiveTab={vi.fn()}
        isNarrow={true}
        weeklyAlbumProgress={6}
      />,
    );

    expect(screen.getByRole("tab", { name: /profile/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /board/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /badges/i })).toBeTruthy();
    expect(screen.getByText("6/7")).toBeTruthy();
  });

  it("keeps profile hierarchy grouped and expands settings inline", async () => {
    const onSave = vi.fn(async () => undefined);
    const setProfile = vi.fn();
    const setDisplayNameInput = vi.fn();

    render(
      <ProfileTab
        profile={{ displayName: "Raccoon Ace", showOnLeaderboard: true }}
        setProfile={setProfile}
        displayNameInput="Raccoon Ace"
        setDisplayNameInput={setDisplayNameInput}
        raccoonName={null}
        stats={{
          puzzlesCompleted: 12,
          totalPlayTimeSeconds: 5432,
          dailyStreak: 4,
          bestDailyStreak: 9,
          level: 6,
        }}
        weeklyAlbumSlots={[
          { date: "2026-03-09", dayLabel: "Mon", imageUrl: null, completed: true },
          { date: "2026-03-10", dayLabel: "Tue", imageUrl: null, completed: true },
          { date: "2026-03-11", dayLabel: "Wed", imageUrl: null, completed: false },
        ]}
        weeklyAlbumProgress={5}
        onSave={onSave}
        profileSaving={false}
        loadData={vi.fn(async () => undefined)}
        onNavigateToBoard={vi.fn()}
        onNavigateToAchievements={vi.fn()}
        onSeeRankingFor4x4={vi.fn()}
      />,
    );

    expect(screen.getByText("Player")).toBeTruthy();
    expect(screen.getByText("Stats")).toBeTruthy();
    expect(screen.getByText("Daily Mastery")).toBeTruthy();
    expect(screen.getByText("Profile & privacy")).toBeTruthy();
    expect(screen.getByRole("button", { name: /see ranking/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /edit profile/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /account settings/i }));

    expect(screen.getByLabelText(/display name/i)).toBeTruthy();
    expect(screen.getByLabelText(/show my name on leaderboards/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("keeps leaderboard sort and filters readable in a single control cluster", () => {
    render(
      <LeaderboardTabHeader
        leaderboardType="alltime"
        setLeaderboardType={vi.fn()}
        leaderboardMetric="moves"
        setLeaderboardMetric={vi.fn()}
        filtersOpen={true}
        setFiltersOpen={vi.fn()}
        cutTypeFilter="classic"
        setCutTypeFilter={vi.fn()}
        modifierFilter="fog"
        setModifierFilter={vi.fn()}
        sourceFilter="daily"
        setSourceFilter={vi.fn()}
        allTimeGrid="4x4"
        setAllTimeGrid={vi.fn()}
      />,
    );

    expect(screen.getByText("Sort")).toBeTruthy();
    expect(screen.getAllByText("Least moves")).toHaveLength(2);
    expect(screen.getByText("classic • fog • daily • 4x4")).toBeTruthy();
    expect(screen.getByLabelText(/filter by shape/i)).toBeTruthy();
    expect(screen.getByLabelText(/filter by modifier/i)).toBeTruthy();
    expect(screen.getByLabelText(/filter by source/i)).toBeTruthy();
    expect(screen.getByLabelText(/filter all-time by grid size/i)).toBeTruthy();
  });

  it("shows polished badge progress and locked/unlocked states", () => {
    render(
      <AchievementsTab
        achievements={[
          {
            id: "first-win",
            name: "First Win",
            description: "Finish your first puzzle.",
            icon: "🏆",
            unlocked: true,
            unlockedAt: "2026-03-12T12:00:00.000Z",
          },
          {
            id: "streak-7",
            name: "Lucky Seven",
            description: "Hold a 7 day streak.",
            icon: "🔥",
            unlocked: false,
            unlockedAt: null,
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /badges/i })).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("/ 2")).toBeTruthy();
    expect(screen.getByText("Unlocked")).toBeTruthy();
    expect(screen.getByText("Locked")).toBeTruthy();
  });

  it("renders polished empty states for each leaderboard mode", () => {
    render(
      <div>
        {renderTimeList([], "No completions yet. Be the first!", 0, true)}
        {renderCompletionList([], 0, true, "No completions in the last 7 days.")}
        {renderEfficiencyList(
          [],
          0,
          true,
          "No completions with moves recorded this week.",
        )}
      </div>,
    );

    expect(screen.getByText("No scores yet")).toBeTruthy();
    expect(screen.getByText("Nothing posted yet")).toBeTruthy();
    expect(screen.getByText("No efficiency runs yet")).toBeTruthy();
  });
});
