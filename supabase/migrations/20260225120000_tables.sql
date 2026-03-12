-- 20260225120000 Phuzzle tables (idempotent – safe to re-run, skips existing objects)
-- Run via npx supabase db push, or paste in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. Player stats (one row per user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzles_completed INTEGER NOT NULL DEFAULT 0,
  total_play_time_seconds INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0,
  best_daily_streak INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_stats') THEN
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS prestige_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS challenge_wins INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS mastery_streak INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS best_mastery_streak INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS mastery_last_date DATE;
  END IF;
END $$;

-- =============================================================================
-- 2. Completions (for leaderboards and history)
-- =============================================================================
CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_date DATE NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  grid_rows INTEGER NOT NULL,
  grid_cols INTEGER NOT NULL,
  is_daily BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completions') THEN
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS cut_type TEXT NOT NULL DEFAULT 'classic';
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS is_mastery BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS visual_modifier TEXT NOT NULL DEFAULT 'none';
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS move_count INTEGER;
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS undo_count INTEGER;
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS completion_source TEXT NOT NULL DEFAULT 'custom';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_completions_puzzle_date ON completions(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_daily ON completions(puzzle_date, elapsed_seconds) WHERE is_daily = TRUE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'cut_type') THEN
    CREATE INDEX IF NOT EXISTS idx_completions_cut_type ON completions(cut_type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'is_mastery') THEN
    CREATE INDEX IF NOT EXISTS idx_completions_is_mastery ON completions(is_mastery);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'visual_modifier') THEN
    CREATE INDEX IF NOT EXISTS idx_completions_visual_modifier ON completions(visual_modifier);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'completion_source') THEN
    CREATE INDEX IF NOT EXISTS idx_completions_completion_source ON completions(completion_source);
  END IF;
END $$;

-- =============================================================================
-- 3. User achievements
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 6. Daily comments (280 char limit, post-completion)
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_comments_body_length CHECK (char_length(body) <= 280)
);

CREATE INDEX IF NOT EXISTS idx_daily_comments_puzzle_date ON daily_comments(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_daily_comments_created_at ON daily_comments(created_at DESC);

-- =============================================================================
-- 7. Daily reactions (emoji, one per user per puzzle_date)
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(puzzle_date, user_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_reactions_puzzle_date ON daily_reactions(puzzle_date);

-- =============================================================================
-- 8. Comment reports (moderation support)
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES daily_comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_comment_reports_comment ON daily_comment_reports(comment_id);

-- =============================================================================
-- Replica identity (for Realtime UPDATE/DELETE)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'puzzle_sessions') THEN
    ALTER TABLE puzzle_sessions REPLICA IDENTITY FULL;
  END IF;
END $$;

-- =============================================================================
-- Realtime publications (co-op + live completion counter)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'puzzle_sessions') AND
     NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'puzzle_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE puzzle_sessions;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completions') AND
     NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'completions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE completions;
  END IF;
END $$;

-- =============================================================================
-- Server time RPC (for daily countdown sync)
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

-- =============================================================================
-- Indexes for leaderboard variants (least moves, cleanest solve)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'move_count') THEN
    CREATE INDEX IF NOT EXISTS idx_completions_daily_least_moves ON completions(puzzle_date, move_count ASC NULLS LAST, elapsed_seconds) WHERE is_daily = TRUE;
    CREATE INDEX IF NOT EXISTS idx_completions_grid_least_moves ON completions(grid_rows, grid_cols, move_count ASC NULLS LAST, elapsed_seconds);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'undo_count') THEN
    CREATE INDEX IF NOT EXISTS idx_completions_daily_cleanest ON completions(puzzle_date, undo_count ASC NULLS LAST, elapsed_seconds) WHERE is_daily = TRUE;
    CREATE INDEX IF NOT EXISTS idx_completions_grid_cleanest ON completions(grid_rows, grid_cols, undo_count ASC NULLS LAST, elapsed_seconds);
  END IF;
END $$;
