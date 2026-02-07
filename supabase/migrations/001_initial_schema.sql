-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Player stats (one row per user)
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzles_completed INTEGER NOT NULL DEFAULT 0,
  total_play_time_seconds INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0,
  best_daily_streak INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Completions (for leaderboards and history)
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_date DATE NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  grid_rows INTEGER NOT NULL,
  grid_cols INTEGER NOT NULL,
  is_daily BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completions_puzzle_date ON completions(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_daily ON completions(puzzle_date, elapsed_seconds) WHERE is_daily = TRUE;

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- RLS policies
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own stats
CREATE POLICY "Users can manage own stats" ON player_stats
  FOR ALL USING (auth.uid() = user_id);

-- Users can insert their own completions, anyone can read for leaderboards
CREATE POLICY "Users can insert own completions" ON completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read completions" ON completions
  FOR SELECT USING (true);

-- Users can manage their own achievements
CREATE POLICY "Users can manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

-- Service role can insert for anonymous users (we'll use anon key with RLS)
-- For anonymous auth, auth.uid() returns the anon user's id
