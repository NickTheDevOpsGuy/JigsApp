# Supabase setup for Phuzzle

Phuzzle integrates with Supabase for leaderboards, player stats, achievements, profiles, and co-op puzzle sharing.

The app runs without Supabase, but these features require a configured project:

- Leaderboards
- Player stats
- Achievements
- Profiles (display name, anonymous mode)
- Co-op sharing (Realtime session sync)

---

## What Supabase powers

| Feature        | Description                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------ |
| Leaderboards   | Daily puzzle, weekly and monthly totals, streaks, all-time completions, best times per grid size |
| Player stats   | Puzzles completed, total play time, daily streaks                                                |
| Achievements   | Unlock badges (first puzzle, streaks, speed runs, etc.)                                          |
| Profile        | Display name and anonymous mode (raccoon names on leaderboards)                                  |
| Co-op sharing  | "Play with friend" real-time collaborative puzzle sessions                                       |
| Daily comments | Emoji reactions and 280-char comments on daily puzzle completion; report for moderation          |

---

## 1. Create a Supabase project

1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Choose organization, name, database password, and region
4. Wait for provisioning to complete

---

## 2. Configure environment variables

Create or update `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

Where to find these:

- Supabase Dashboard -> Settings -> API
- Project URL -> `VITE_SUPABASE_URL`
- anon public key -> `VITE_SUPABASE_ANON_KEY`

Notes:

- Vite only exposes environment variables prefixed with `VITE_`.
- Restart the dev server after changing env files.
- In production (Vercel), add the same vars in Project Settings -> Environment Variables, then redeploy.

---

## 3. Enable anonymous auth

Anonymous auth lets users track stats and appear on leaderboards without signing up. The session persists in the browser.

1. Supabase Dashboard -> Authentication -> Providers
2. Enable **Anonymous sign-ins**
3. Save

---

## 4. Run database migration

Supabase schema is **two files**: one for tables, one for RLS. Both are idempotent (safe to run multiple times).

| File                                            | Contents                                                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260225120000_tables.sql` | All tables, indexes, realtime, server-time RPC. Includes `completions` columns: move_count, undo_count, completion_source. |
| `supabase/migrations/20260225120001_rls.sql`    | RLS enable + policies.                                                                                                     |

Run in order: tables first, then RLS.

### Option A: Supabase CLI

```bash
npx supabase db push
```

### Option B: Dashboard (SQL editor)

1. Dashboard -> SQL Editor -> New query
2. Copy and run `supabase/migrations/20260225120000_tables.sql`
3. New query: copy and run `supabase/migrations/20260225120001_rls.sql`

For CLI, run `npx supabase db push` from project root (after `npx supabase link` if needed).

---

## 5. Enable Realtime (co-op and live counts)

Realtime is required for:

- Co-op sessions (`puzzle_sessions`)
- Live "today's completions" counter (`completions`)

### Option A: Dashboard (publications)

1. Database -> Publications
2. Open `supabase_realtime`
3. Under Tables, enable:
   - `puzzle_sessions`
   - `completions`

If tables are missing, run the migration first.

### Option B: SQL editor

```sql
alter publication supabase_realtime add table public.puzzle_sessions;
alter publication supabase_realtime add table public.completions;
```

Note: The migration sets `REPLICA IDENTITY FULL` on `puzzle_sessions` so Realtime can send full row data on updates.

---

## 6. Verify setup

1. Start the app: `npm run dev`
2. Open the app in the browser
3. Go to Leaderboards (Menu -> Leaderboards)
4. Complete a puzzle to confirm stats and achievements record

If you see "Connect Supabase to track your stats...", check:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- The dev server was restarted after adding env vars
- The migration ran without errors
- Anonymous auth is enabled

---

## Database schema overview

| Table               | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `player_stats`      | One row per user: puzzles completed, play time, streaks |
| `completions`       | Each puzzle completion; used for leaderboards           |
| `player_profiles`   | Display name and leaderboard visibility                 |
| `user_achievements` | Unlocked achievements per user                          |
| `puzzle_sessions`   | Co-op sessions (pieces, elapsed time, completion state) |

---

## Security model (RLS)

Row Level Security (RLS) is enabled on all tables.

Policies enforce:

- Users can insert and update only their own stats, profiles, and achievements
- `completions` are readable by everyone (for leaderboards)
- `puzzle_sessions` are share-link driven and allow create/read/update for participants

If leaderboards are empty despite completing puzzles, verify that RLS policies were created successfully by the migration.

---

## Troubleshooting

### Anonymous sign-in fails

- Confirm Anonymous auth is enabled
- Check Supabase Auth settings for restrictions that might block session creation

### Leaderboards empty

- Complete at least one puzzle (daily counts show on "Today")
- Ensure migrations ran successfully
- Ensure your client is authenticated (anonymous session created)

### Co-op sessions not syncing or WebSocket closes immediately

- Realtime publication: ensure `puzzle_sessions` and `completions` are in `supabase_realtime` (see section 5)
- API keys: use the anon public key (or Supabase publishable key if your project uses it)
- Vercel env vars: ensure vars are set and you redeployed after changes
- Browser extensions: ad blockers or privacy tools can block WebSockets; try incognito

### Environment variables not loading

- Ensure variable names start with `VITE_`
- Restart the dev server after changing env files
- Confirm no `.env` syntax errors

---

## Verifying share and co-op

1. Ensure Supabase is configured (env vars, migration, anonymous auth, Realtime)
2. Start a puzzle (any image, any grid)
3. Open Menu -> Share -> Play with friend
4. A session is created and you get a share URL
5. Open that URL in another tab or device
6. Move a piece in one tab and confirm it appears in the other (Realtime sync)

Completion share (after finishing a puzzle) works without Supabase.

---

## Related files

- `src/app/supabase/client.ts` - Supabase client and config
- `src/app/supabase/auth.ts` - Anonymous auth helpers
- `supabase/migrations/20260225120000_tables.sql` - Tables migration (idempotent)
- `supabase/migrations/20260225120001_rls.sql` - RLS migration (idempotent)
- `supabase/README.md` - Short reference
