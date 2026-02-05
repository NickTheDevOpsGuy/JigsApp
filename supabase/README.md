# Supabase Setup for Phuzzle

Phuzzle uses Supabase for player statistics, leaderboards, and achievements.

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

In the Supabase dashboard: **SQL Editor** → New query → paste and run each migration in order:

1. `migrations/001_initial_schema.sql`
2. `migrations/002_profiles_and_leaderboard_indexes.sql`

Or use the Supabase CLI:

```bash
supabase db push
```

## 4. Enable anonymous auth

In **Authentication > Providers**, enable **Anonymous sign-ins**. This lets users track stats without creating an account.

## Tables

- **player_stats** – One row per user: puzzles completed, play time, streaks
- **completions** – Each puzzle completion for leaderboards
- **user_achievements** – Unlocked achievements per user
- **profiles** – Optional display names for leaderboards
