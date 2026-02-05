-- Profiles: optional display names for leaderboards
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_completions_grid ON completions(grid_rows, grid_cols);
CREATE INDEX IF NOT EXISTS idx_completions_elapsed ON completions(puzzle_date, elapsed_seconds);
CREATE INDEX IF NOT EXISTS idx_player_stats_streak ON player_stats(daily_streak DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_completed ON player_stats(puzzles_completed DESC);
