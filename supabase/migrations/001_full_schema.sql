-- Phuzzle Supabase schema (idempotent - safe to re-run)
-- Run in Supabase SQL Editor or: npx supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. Player stats (one row per user)
-- =============================================================================
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

-- =============================================================================
-- 2. Completions (for leaderboards and history)
-- =============================================================================
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

-- =============================================================================
-- 3. User achievements
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- =============================================================================
-- 4. Player profiles (display name, anonymous mode for leaderboards)
-- =============================================================================
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Puzzler',
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT true,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);

-- =============================================================================
-- 5. Puzzle sessions (co-op real-time sharing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS puzzle_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url TEXT NOT NULL,
  grid_rows INTEGER NOT NULL,
  grid_cols INTEGER NOT NULL,
  state_json JSONB NOT NULL,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_puzzle_sessions_updated ON puzzle_sessions(updated_at);

-- =============================================================================
-- RLS (idempotent: only enable if not already)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'player_stats' AND c.relrowsecurity) THEN
    ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'completions' AND c.relrowsecurity) THEN
    ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'user_achievements' AND c.relrowsecurity) THEN
    ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'player_profiles' AND c.relrowsecurity) THEN
    ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'puzzle_sessions' AND c.relrowsecurity) THEN
    ALTER TABLE puzzle_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =============================================================================
-- Policies (idempotent: drop if exists, then create)
-- =============================================================================
DROP POLICY IF EXISTS "Users can manage own stats" ON player_stats;
CREATE POLICY "Users can manage own stats" ON player_stats
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own completions" ON completions;
CREATE POLICY "Users can insert own completions" ON completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read completions" ON completions;
CREATE POLICY "Anyone can read completions" ON completions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own achievements" ON user_achievements;
CREATE POLICY "Users can manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own profile" ON player_profiles;
CREATE POLICY "Users can manage own profile" ON player_profiles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read profiles for leaderboards" ON player_profiles;
CREATE POLICY "Anyone can read profiles for leaderboards" ON player_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert puzzle_sessions" ON puzzle_sessions;
CREATE POLICY "Anyone can insert puzzle_sessions" ON puzzle_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can select puzzle_sessions" ON puzzle_sessions;
CREATE POLICY "Anyone can select puzzle_sessions" ON puzzle_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update puzzle_sessions" ON puzzle_sessions;
CREATE POLICY "Anyone can update puzzle_sessions" ON puzzle_sessions
  FOR UPDATE USING (true);

-- =============================================================================
-- Replica identity (for Realtime UPDATE/DELETE)
-- =============================================================================
ALTER TABLE puzzle_sessions REPLICA IDENTITY FULL;

-- Co-op session expiration: 8h inactivity. Cleanup: DELETE FROM puzzle_sessions WHERE updated_at < NOW() - INTERVAL '8 hours';
COMMENT ON TABLE puzzle_sessions IS 'Real-time co-op sessions. Expire after 8h inactivity. See puzzleSessionService.';

-- =============================================================================
-- Realtime publications (co-op + live today completion counter)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'puzzle_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE puzzle_sessions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'completions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE completions;
  END IF;
END $$;

-- =============================================================================
-- Server time RPC (for daily countdown sync; idempotent)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_server_utc_now()
RETURNS TIMESTAMPTZ
LANGUAGE SQL
STABLE
AS $$
  SELECT NOW() AT TIME ZONE 'UTC';
$$;

GRANT EXECUTE ON FUNCTION get_server_utc_now() TO anon;
GRANT EXECUTE ON FUNCTION get_server_utc_now() TO authenticated;
