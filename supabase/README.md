# Supabase Setup for Phuzzle

Phuzzle uses Supabase for player statistics, leaderboards, and achievements. The app is a PWA (installable from the browser); Supabase is used when the user is online.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **Settings > API**, copy your project URL and anon (public) key

## 2. Environment variables

Add to `.env.development` (and Vercel env vars for production):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Run the migrations

In the Supabase dashboard **SQL Editor**, run each migration in order:

1. `migrations/001_initial_schema.sql` – player_stats, completions, user_achievements, RLS
2. `migrations/002_player_profiles.sql` – player_profiles (display name, show_on_leaderboard for anonymous mode)
3. `migrations/003_puzzle_sessions.sql` – puzzle_sessions (co-op real-time sharing)

Or use the Supabase CLI:

```bash
supabase db push
```

## 4. Enable anonymous auth

In **Authentication > Providers**, enable **Anonymous sign-ins**. This lets users track stats without creating an account.

## Enable Realtime for co-op puzzles

For shared puzzle sessions (real-time co-op), add `puzzle_sessions` to the Realtime publication:

1. In Supabase dashboard: **Database > Replication**
2. Enable replication for the **puzzle_sessions** table

## Tables

- **player_stats** – One row per user: puzzles completed, play time, streaks
- **completions** – Each puzzle completion (used for daily, weekly, monthly, and all-time leaderboards)
- **player_profiles** – Display name and `show_on_leaderboard` (anonymous mode)
- **user_achievements** – Unlocked achievements per user
- **puzzle_sessions** – UUID session state for co-op puzzles (pieces, elapsed time, completion)
