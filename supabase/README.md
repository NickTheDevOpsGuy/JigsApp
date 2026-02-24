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

**Option A – SQL Editor:** Paste and run `migrations/20260223120000_full_schema.sql` in the Supabase dashboard **SQL Editor**. It’s idempotent (safe to re-run).

**Option B – Supabase CLI:**

```bash
npx supabase db push
```

If you use a global Supabase workdir (e.g. `~/supabase`), ensure your project migrations exist there or run from the project directory.

## 4. Enable anonymous auth

In **Authentication > Providers**, enable **Anonymous sign-ins**. This lets users track stats without creating an account.

## Enable Realtime

The migration adds `puzzle_sessions` and `completions` to the Realtime publication. If needed, enable in **Database > Replication** for both tables.

## Tables

- **player_stats** – One row per user: puzzles completed, play time, streaks
- **completions** – Each puzzle completion (used for daily, weekly, monthly, and all-time leaderboards)
- **player_profiles** – Display name and `show_on_leaderboard` (anonymous mode)
- **user_achievements** – Unlocked achievements per user
- **puzzle_sessions** – UUID session state for co-op puzzles (pieces, elapsed time, completion)
