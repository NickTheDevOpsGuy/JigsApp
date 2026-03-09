# Supabase Setup for Phuzzle

Phuzzle uses Supabase for player statistics, leaderboards, achievements, and daily puzzle comments/reactions. The app is a PWA (installable from the browser); Supabase is used when the user is online.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **Settings > API**, copy your project URL and anon (public) key

## 2. Environment variables

Add to `.env.development` (and Vercel env vars for production):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Run the migrations (idempotent – safe to re-run)

Supabase schema is split into **two files**: one for tables, one for RLS.

| File | Contents |
|------|----------|
| `migrations/20260225120000_tables.sql` | All tables, indexes, replica identity, realtime publication, `get_server_utc_now()`. Includes `completions` columns: move_count, undo_count, completion_source. |
| `migrations/20260225120001_rls.sql` | RLS enable + policies for all tables. |

**Option A – Supabase CLI:**

```bash
npx supabase db push
```

**Option B – SQL Editor:** Run in order:

1. `migrations/20260225120000_tables.sql`
2. `migrations/20260225120001_rls.sql`

## 4. Enable anonymous auth

In **Authentication > Providers**, enable **Anonymous sign-ins**. This lets users track stats without creating an account.

## Realtime

The `tables.sql` script adds `puzzle_sessions` and `completions` to the Realtime publication. If needed, enable in **Database > Replication** for both tables.

## Play modes (Zen, Mystery, Precision, Dynamic Difficulty, Adaptive Personality)

These modes are **client-only**. No Supabase schema or migration changes are required. Toggles and precision/difficulty state use localStorage or in-session state; `recordCompletion` is unchanged.

## Tables

- **player_stats** – One row per user: puzzles completed, play time, streaks
- **completions** – Each puzzle completion (leaderboards); includes move_count, undo_count, completion_source (daily | pack | custom)
- **player_profiles** – Display name and `show_on_leaderboard`
- **user_achievements** – Unlocked achievements per user
- **puzzle_sessions** – Session state for co-op puzzles
- **daily_comments** – Comments on daily puzzles (280 chars)
- **daily_reactions** – Emoji reactions on daily puzzles
- **daily_comment_reports** – Report flags for moderation
