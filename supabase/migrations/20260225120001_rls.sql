-- 20260225120001 Phuzzle RLS and policies (idempotent – safe to re-run, skips if already enabled)
-- Run after tables migration. Via npx supabase db push, or paste in Supabase SQL Editor.

-- =============================================================================
-- Enable RLS on tables (skip if already enabled)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_stats') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'player_stats' AND c.relrowsecurity) THEN
    ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completions') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'completions' AND c.relrowsecurity) THEN
    ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'user_achievements' AND c.relrowsecurity) THEN
    ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_profiles') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'player_profiles' AND c.relrowsecurity) THEN
    ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'puzzle_sessions') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'puzzle_sessions' AND c.relrowsecurity) THEN
    ALTER TABLE puzzle_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_comments') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'daily_comments' AND c.relrowsecurity) THEN
    ALTER TABLE daily_comments ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_reactions') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'daily_reactions' AND c.relrowsecurity) THEN
    ALTER TABLE daily_reactions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_comment_reports') AND
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'daily_comment_reports' AND c.relrowsecurity) THEN
    ALTER TABLE daily_comment_reports ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =============================================================================
-- Policies (DROP IF EXISTS then CREATE – idempotent)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_stats') THEN
    DROP POLICY IF EXISTS "Users can manage own stats" ON player_stats;
    CREATE POLICY "Users can manage own stats" ON player_stats
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completions') THEN
    DROP POLICY IF EXISTS "Users can insert own completions" ON completions;
    CREATE POLICY "Users can insert own completions" ON completions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Anyone can read completions" ON completions;
    CREATE POLICY "Anyone can read completions" ON completions
      FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
    DROP POLICY IF EXISTS "Users can manage own achievements" ON user_achievements;
    CREATE POLICY "Users can manage own achievements" ON user_achievements
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_profiles') THEN
    DROP POLICY IF EXISTS "Users can manage own profile" ON player_profiles;
    CREATE POLICY "Users can manage own profile" ON player_profiles
      FOR ALL USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Anyone can read profiles for leaderboards" ON player_profiles;
    CREATE POLICY "Anyone can read profiles for leaderboards" ON player_profiles
      FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'puzzle_sessions') THEN
    DROP POLICY IF EXISTS "Anyone can insert puzzle_sessions" ON puzzle_sessions;
    CREATE POLICY "Anyone can insert puzzle_sessions" ON puzzle_sessions
      FOR INSERT WITH CHECK (true);
    DROP POLICY IF EXISTS "Anyone can select puzzle_sessions" ON puzzle_sessions;
    CREATE POLICY "Anyone can select puzzle_sessions" ON puzzle_sessions
      FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Anyone can update puzzle_sessions" ON puzzle_sessions;
    CREATE POLICY "Anyone can update puzzle_sessions" ON puzzle_sessions
      FOR UPDATE USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_comments') THEN
    DROP POLICY IF EXISTS "Anyone can read daily comments" ON daily_comments;
    CREATE POLICY "Anyone can read daily comments" ON daily_comments FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Authenticated users can insert own comments" ON daily_comments;
    CREATE POLICY "Authenticated users can insert own comments" ON daily_comments
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own comments" ON daily_comments;
    CREATE POLICY "Users can delete own comments" ON daily_comments
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_reactions') THEN
    DROP POLICY IF EXISTS "Anyone can read daily reactions" ON daily_reactions;
    CREATE POLICY "Anyone can read daily reactions" ON daily_reactions FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Authenticated users can insert own reactions" ON daily_reactions;
    CREATE POLICY "Authenticated users can insert own reactions" ON daily_reactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own reactions" ON daily_reactions;
    CREATE POLICY "Users can update own reactions" ON daily_reactions
      FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own reactions" ON daily_reactions;
    CREATE POLICY "Users can delete own reactions" ON daily_reactions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_comment_reports') THEN
    DROP POLICY IF EXISTS "Users can report comments" ON daily_comment_reports;
    CREATE POLICY "Users can report comments" ON daily_comment_reports
      FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;
