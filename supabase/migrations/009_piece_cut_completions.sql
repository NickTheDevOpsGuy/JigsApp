-- Add piece_cut to completions for separate stats per cut type (classic, irregular, hard)
ALTER TABLE completions ADD COLUMN IF NOT EXISTS piece_cut TEXT NOT NULL DEFAULT 'classic';

-- Index for cut-specific leaderboard queries
CREATE INDEX IF NOT EXISTS idx_completions_piece_cut
  ON completions(grid_rows, grid_cols, piece_cut, elapsed_seconds);
