-- Raccoon avatar customization
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS avatar_hat TEXT;
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS avatar_glasses TEXT;
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS avatar_hoodie TEXT;

-- Limited-time puzzle events
CREATE TABLE IF NOT EXISTS puzzle_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  badge_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link completions to events (optional)
ALTER TABLE completions ADD COLUMN IF NOT EXISTS event_id TEXT REFERENCES puzzle_events(id);
CREATE INDEX IF NOT EXISTS idx_completions_event ON completions(event_id) WHERE event_id IS NOT NULL;
