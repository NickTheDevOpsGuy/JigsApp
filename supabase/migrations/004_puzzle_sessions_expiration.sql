-- Co-op session expiration policy
-- Sessions are considered expired after 8 hours of inactivity (no updates).
-- Joins to expired sessions are rejected at application layer (puzzleSessionService).
-- Optional: run cleanup periodically via Supabase cron or manual DELETE:
--   DELETE FROM puzzle_sessions WHERE updated_at < NOW() - INTERVAL '8 hours';

COMMENT ON TABLE puzzle_sessions IS
  'Real-time co-op sessions. Expire after 8h inactivity. See puzzleSessionService.';
