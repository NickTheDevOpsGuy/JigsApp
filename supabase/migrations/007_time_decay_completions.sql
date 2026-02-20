-- Add is_time_decay and time_decay_score for Time Decay leaderboard
ALTER TABLE completions ADD COLUMN IF NOT EXISTS is_time_decay BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE completions ADD COLUMN IF NOT EXISTS time_decay_score INTEGER;

CREATE INDEX IF NOT EXISTS idx_completions_time_decay
  ON completions(puzzle_date, time_decay_score DESC NULLS LAST)
  WHERE is_time_decay = TRUE;
