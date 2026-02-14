-- Real-time collaborative puzzle sessions
-- Session ID in URL allows multiple users to join and sync state

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

ALTER TABLE puzzle_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a session (share link)
CREATE POLICY "Anyone can insert puzzle_sessions" ON puzzle_sessions
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read (join via session ID in URL)
CREATE POLICY "Anyone can select puzzle_sessions" ON puzzle_sessions
  FOR SELECT USING (true);

-- Allow anyone to update (participants sync state)
CREATE POLICY "Anyone can update puzzle_sessions" ON puzzle_sessions
  FOR UPDATE USING (true);

-- Enable Realtime: In Supabase Dashboard → Database → Replication,
-- add puzzle_sessions to the supabase_realtime publication.
-- REPLICA IDENTITY FULL helps Realtime deliver full row data on UPDATE.
ALTER TABLE puzzle_sessions REPLICA IDENTITY FULL;
