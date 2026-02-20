# Supabase Setup for Phuzzle

Phuzzle uses Supabase for **leaderboards**, **player stats**, **achievements**, and **co-op puzzle sharing**. The app works without Supabase, but these features require a configured project.

## What Supabase Powers

| Feature           | Description                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| **Leaderboards**  | Daily puzzle, Time Attack, weekly/monthly totals, streaks, all-time completions, best times per grid size |
| **Player Stats**  | Puzzles completed, total play time, daily streaks                                                         |
| **Achievements**  | Unlock badges (first puzzle, streaks, speed demon, etc.)                                                  |
| **Profile**       | Display name, anonymous mode (raccoon names on leaderboards)                                              |
| **Co-op Sharing** | "Play with friend" – real-time collaborative puzzle sessions                                              |

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose organization, name, database password, and region
4. Wait for the project to finish provisioning

---

## 2. Environment Variables

Create or update `.env` in the project root (or `.env.local`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these:**

- **Supabase Dashboard** → **Settings** → **API**
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

**Production (e.g. Vercel):** Add the same variables to your hosting provider’s environment settings.

---

## 3. Enable Anonymous Auth

1. **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable **Anonymous sign-ins**
3. Save

Anonymous auth lets users track stats and appear on leaderboards without signing up. They get a persistent session stored in the browser.

---

## 4. Run Database Migrations

Run the migrations in order so tables and policies are created correctly.

### Option A: Supabase Dashboard (SQL Editor)

1. **Dashboard** → **SQL Editor** → **New query**
2. Copy and run each file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_player_profiles.sql`
   - `supabase/migrations/003_puzzle_sessions.sql`
   - `supabase/migrations/004_puzzle_sessions_expiration.sql`
   - `supabase/migrations/005_time_attack_completions.sql`
   - `supabase/migrations/006_avatars_and_events.sql`
   - `supabase/migrations/007_time_decay_completions.sql`
   - `supabase/migrations/008_completions_realtime.sql`
   - `supabase/migrations/009_piece_cut_completions.sql` (piece_cut for alternate piece shapes)

### Option B: Supabase CLI

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

---

## 5. Enable Realtime (Co-op Puzzles)

Required for "Play with friend" real-time sessions.

### Option A: Supabase Dashboard (Publications)

1. Open your [Supabase Dashboard](https://app.supabase.com) and select your project
2. In the left sidebar, go to **Database** → **Publications**
   - Direct URL: `https://app.supabase.com/project/<your-project-ref>/database/publications`
3. Click the **supabase_realtime** publication
4. Under **Tables**, find `puzzle_sessions` and **toggle it ON**

If `puzzle_sessions` is missing, run the migrations first (step 4 above).

### Option B: SQL Editor

If the table isn’t listed or you prefer SQL:

1. **Dashboard** → **SQL Editor** → **New query**
2. Run:

```sql
alter publication supabase_realtime add table public.puzzle_sessions;
```

The migration already sets `REPLICA IDENTITY FULL` on `puzzle_sessions`, so Realtime can send full row data on updates.

---

## 5b. Enable Realtime (Today's Completion Counter)

The **Stats** screen shows a live count of players who completed today's puzzle. This requires the `completions` table in the Realtime publication.

### Option A: Supabase Dashboard (Publications)

1. In **Database** → **Publications** → **supabase_realtime**
2. Under **Tables**, find `completions` and **toggle it ON**

### Option B: SQL Editor

```sql
alter publication supabase_realtime add table public.completions;
```

Without this, the today counter will show the initial fetch count but won't update in real time when others complete puzzles.

---

## 6. Verify Setup

1. Start the app: `npm run dev`
2. Open the app in the browser
3. Go to **Leaderboard** (Menu → Leaderboards)
4. If Supabase is configured, you’ll see leaderboard tabs
5. Complete a puzzle to confirm stats and achievements are recorded

If you see "Connect Supabase to track your stats...", check:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Dev server was restarted after adding env vars
- Migrations completed without errors

---

## Database Schema Overview

| Table               | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `player_stats`      | One row per user: puzzles completed, play time, streaks |
| `completions`       | Each puzzle completion – used for leaderboards          |
| `player_profiles`   | Display name, `show_on_leaderboard` (anonymous mode)    |
| `user_achievements` | Unlocked achievement IDs per user                       |
| `puzzle_sessions`   | Co-op sessions (pieces, elapsed time, completion state) |

Row Level Security (RLS) is enabled on all tables:

- Users can insert/update only their own stats, profiles, and achievements
- Completions are readable by everyone (for leaderboards)
- Puzzle sessions allow create/read/update for anyone (shareable links)

---

## Troubleshooting

**Anonymous sign-in fails**

- Confirm Anonymous auth is enabled
- Check Supabase Auth settings (e.g. email confirmations not required for anonymous)

**Leaderboards empty**

- Complete at least one puzzle (especially a daily puzzle)
- Ensure RLS policies were created and migrations ran successfully

**Co-op sessions not syncing / WebSocket "closed before connection established"**

- **Realtime publication:** Ensure `puzzle_sessions` is in the `supabase_realtime` publication (see [Enable Realtime](#5-enable-realtime-co-op-puzzles))
- **API keys:** Use the **anon** or **publishable** key from Supabase → Settings → API. Both `eyJ...` (JWT) and `sb_publishable_...` formats work
- **Vercel env vars:** Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel → Project → Settings → Environment Variables, then **redeploy**
- **Browser extensions:** Ad blockers or privacy tools can block WebSockets; try incognito or disable them

**Environment variables not loading**

- Ensure variable names start with `VITE_` (Vite only exposes those to the client)
- Restart dev server after changing env files

---

## Verifying Share / Co-op

**"Play with friend"** (Menu → Help → Share → Play with friend?):

1. Ensure Supabase is configured (env vars, migrations, anonymous auth).
2. Start a puzzle (any image, any grid).
3. Open Menu (☰) → Share → **Play with friend?**
4. A session is created and you get a share URL (clipboard or native share sheet).
5. Open that URL in another tab or send to another device — the same puzzle loads.
6. Move a piece in one tab — it should appear in the other (Realtime sync).

**Completion share** (after finishing a puzzle) works without Supabase: Twitter, Facebook, Reddit, WhatsApp, Copy link, or native share.

---

## Related Files

- `src/app/supabase/client.ts` – Supabase client and config
- `src/app/supabase/auth.ts` – Anonymous auth helpers
- `supabase/migrations/` – SQL migrations
- `supabase/README.md` – Shorter reference
