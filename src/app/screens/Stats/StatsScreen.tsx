/**
 * StatsScreen – leaderboards, achievements, profile, streaks (Supabase).
 * State and data logic live in hooks/useStatsScreenState and hooks/useStatsScreenData.
 */
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button/Button";
import styles from "./StatsScreen.module.css";
import { isSupabaseConfigured, getSupabaseConfigStatus } from "@/supabase/client";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Loader } from "@/components/Loader";
import { ProfileTab, LeaderboardTab, AchievementsTab } from "./tabs";
import { StatsTabBar } from "./components/StatsTabBar";
import { StatsScreenHeader } from "./components/StatsScreenHeader";
import { useStatsScreenState, useStatsScreenData } from "./hooks";

export function StatsScreen() {
  const nav = useNavigate();
  const configured = isSupabaseConfigured();
  const isNarrow = useMediaQuery("(max-width: 520px)");
  const state = useStatsScreenState();
  const { loadData, handleSaveProfile, handleShareLeaderboard, handleShareWeeklyAlbum } =
    useStatsScreenData(configured, state);

  const weeklyCompleted = Math.max(0, Math.min(7, state.weeklyAlbumProgress));
  const _weeklyRemaining = Math.max(0, 7 - weeklyCompleted);
  const _masteryPuzzlesRemaining = Math.max(0, 1 - (state.stats?.masteryStreak ?? 0));
  const headerTitle =
    state.activeTab === "leaderboard"
      ? "Board"
      : state.activeTab === "profile"
        ? "Profile"
        : "Badges";

  if (!configured) {
    const status = getSupabaseConfigStatus();
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Leaderboard</h1>
          <div className={styles.cardContent} data-testid="stats-card-content">
            <p className={styles.placeholder}>
              Connect Supabase to track your stats, compete on leaderboards, and unlock
              achievements.
            </p>
            <p className={styles.hint}>
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.
            </p>
            <p className={styles.debug}>
              VITE_SUPABASE_URL: {status.url ? "✓ set" : "✗ missing"} ·
              VITE_SUPABASE_ANON_KEY: {status.key ? "✓ set" : "✗ missing"}
            </p>
            <p className={styles.hint}>
              Local: add to .env.development and restart dev server. Vercel: add in
              project Settings → Environment Variables, then redeploy.
            </p>
            <Button onClick={() => nav("/")}>
              <ArrowLeft size={18} />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <StatsScreenHeader
          activeTab={state.activeTab}
          headerTitle={headerTitle}
          weeklyAlbumProgress={state.weeklyAlbumProgress}
          leaderboardType={state.leaderboardType}
          weekSubview={state.weekSubview}
          shareCopied={state.shareCopied}
          albumShareCopied={state.albumShareCopied}
          onClose={() => nav("/")}
          onShareLeaderboard={handleShareLeaderboard}
          onShareWeeklyAlbum={handleShareWeeklyAlbum}
        />

        <StatsTabBar
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
          isNarrow={isNarrow}
          weeklyAlbumProgress={state.weeklyAlbumProgress}
        />

        <div className={styles.cardContent} data-testid="stats-card-content">
          {state.loading ? (
            <Loader label="Loading stats…" />
          ) : (
            <>
              {state.activeTab === "profile" && (
                <ProfileTab
                  profile={state.profile}
                  setProfile={state.setProfile}
                  displayNameInput={state.displayNameInput}
                  setDisplayNameInput={state.setDisplayNameInput}
                  raccoonName={state.raccoonName}
                  stats={state.stats}
                  weeklyAlbumSlots={state.weeklyAlbumSlots}
                  weeklyAlbumProgress={state.weeklyAlbumProgress}
                  onSave={handleSaveProfile}
                  profileSaving={state.profileSaving}
                  loadData={loadData}
                  onNavigateToBoard={() => state.setActiveTab("leaderboard")}
                />
              )}

              {state.activeTab === "leaderboard" && (
                <LeaderboardTab
                  leaderboardType={state.leaderboardType}
                  setLeaderboardType={state.setLeaderboardType}
                  weekSubview={state.weekSubview}
                  setWeekSubview={state.setWeekSubview}
                  allTimeGrid={state.allTimeGrid}
                  setAllTimeGrid={state.setAllTimeGrid}
                  filtersOpen={state.filtersOpen}
                  setFiltersOpen={state.setFiltersOpen}
                  cutTypeFilter={state.cutTypeFilter}
                  setCutTypeFilter={state.setCutTypeFilter}
                  modifierFilter={state.modifierFilter}
                  setModifierFilter={state.setModifierFilter}
                  leaderboard={state.leaderboard}
                  weeklyTotalsLeaderboard={state.weeklyTotalsLeaderboard}
                  todayCompletionCount={state.todayCompletionCount}
                  weeklyAlbumSlots={state.weeklyAlbumSlots}
                  weeklyAlbumProgress={state.weeklyAlbumProgress}
                  weeklyCompleted={weeklyCompleted}
                  weekRangeLabel={state.weekRangeLabel}
                  loadData={loadData}
                  rowAnimEpoch={state.rowAnimEpoch}
                />
              )}

              {state.activeTab === "achievements" && (
                <AchievementsTab achievements={state.achievements} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
