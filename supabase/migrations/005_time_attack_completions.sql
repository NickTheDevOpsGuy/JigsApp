-- Add is_time_attack flag for Time Attack leaderboard
ALTER TABLE completions ADD COLUMN IF NOT EXISTS is_time_attack BOOLEAN NOT NULL DEFAULT FALSE;

-- Score for Time Attack (higher = better): time_remaining * 10 + bonus points
ALTER TABLE completions ADD COLUMN IF NOT EXISTS time_attack_score INTEGER;

CREATE INDEX IF NOT EXISTS idx_completions_time_attack
  ON completions(puzzle_date, time_attack_score DESC NULLS LAST)
  WHERE is_time_attack = TRUE;

-- Add puzzles_under_5_min for Speed Runner achievement
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS puzzles_under_5_min INTEGER NOT NULL DEFAULT 0;
