-- Completions: move_count, undo_count, completion_source (idempotent)
-- Enables efficiency stats, cleanest-solve views, and daily/pack/custom breakdowns.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completions') THEN
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS move_count INTEGER;
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS undo_count INTEGER;
    ALTER TABLE completions ADD COLUMN IF NOT EXISTS completion_source TEXT NOT NULL DEFAULT 'custom';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'completion_source') THEN
    CREATE INDEX IF NOT EXISTS idx_completions_completion_source ON completions(completion_source);
  END IF;
END $$;
