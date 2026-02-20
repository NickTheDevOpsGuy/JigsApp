-- Add completions to Realtime publication for live "today's completion count"
-- Enables postgres_changes subscription on INSERT for the completion counter
-- Idempotent: skips if already in publication (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'completions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE completions;
  END IF;
END $$;
