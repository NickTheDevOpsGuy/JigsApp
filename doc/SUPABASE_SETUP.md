# Supabase setup for Phuzzle

Phuzzle uses Supabase for leaderboards, stats, achievements, profiles, and co-op. The app runs without it, but those features need a configured project.

---

## What Supabase provides

| Feature        | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| Leaderboards   | Daily, weekly, all-time; streaks; best times per grid         |
| Player stats   | Completions, play time, streaks                               |
| Achievements   | Badges (first puzzle, streaks, speed runs, etc.)              |
| Profile        | Display name, anonymous mode (raccoon names on leaderboards)  |
| Co-op          | “Play with friend” real-time sessions                         |
| Daily comments | Reactions and comments on daily puzzle; report for moderation |

---

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New Project** → organization, name, password, region.
3. Wait for provisioning.

---

## 2. Environment variables

Create or update `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

- **Where:** Dashboard → Settings → API. Project URL → `VITE_SUPABASE_URL`; anon public key → `VITE_SUPABASE_ANON_KEY`.
- **Note:** Only vars starting with `VITE_` are exposed. Restart the dev server after changing env. In production (e.g. Vercel), add the same vars and redeploy.

---

## 3. Enable anonymous auth

1. Dashboard → Authentication → Providers.
2. Enable **Anonymous sign-ins**.
3. Save.

Anonymous users can have stats and leaderboard entries without signing up.

---

## 4. Run migrations

Two migration files (both idempotent):

| File                                            | Contents                                   |
| ----------------------------------------------- | ------------------------------------------ |
| `supabase/migrations/20260225120000_tables.sql` | Tables, indexes, Realtime, server-time RPC |
| `supabase/migrations/20260225120001_rls.sql`    | RLS policies                               |

**Option A — CLI**

```bash
npx supabase db push
```

**Option B — Dashboard**

1. SQL Editor → New query.
2. Run `20260225120000_tables.sql`, then `20260225120001_rls.sql`.

Run tables first, then RLS.

---

## 5. Enable Realtime

Required for co-op and live completion counts.

**Option A — Dashboard**  
Database → Publications → `supabase_realtime` → add tables `puzzle_sessions`, `completions`.

**Option B — SQL**

```sql
alter publication supabase_realtime add table public.puzzle_sessions;
alter publication supabase_realtime add table public.completions;
```

The tables migration sets `REPLICA IDENTITY FULL` on `puzzle_sessions` for Realtime.

---

## 6. Verify

1. `npm run dev` and open the app.
2. Open Leaderboards (Menu → Leaderboards).
3. Complete a puzzle and confirm stats record.

If you see “Connect Supabase to track your stats…”:

- Env vars set and dev server restarted
- Migrations ran without errors
- Anonymous auth enabled

---

## Main tables

| Table               | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `player_stats`      | Per-user: completions, play time, streaks |
| `completions`       | Each completion; used for leaderboards    |
| `player_profiles`   | Display name, leaderboard visibility      |
| `user_achievements` | Unlocked achievements per user            |
| `puzzle_sessions`   | Co-op session state                       |

---

## Security (RLS)

RLS is on for all tables. Policies: users manage their own stats/profiles/achievements; completions readable by all (leaderboards); puzzle_sessions allow create/read/update for participants.

If leaderboards stay empty after completing puzzles, check that RLS migrations ran.

---

## Troubleshooting

**Anonymous sign-in fails**

- Confirm Anonymous auth is enabled and not restricted.

**Leaderboards empty**

- Complete at least one puzzle.
- Confirm migrations and that the client has an anonymous session.

**Co-op not syncing / WebSocket closes**

- Realtime: `puzzle_sessions` and `completions` in `supabase_realtime`.
- Env vars set in Vercel and app redeployed.
- Try incognito (extensions can block WebSockets).

**Env vars not loading**

- Names must start with `VITE_`.
- Restart dev server.
- Check for `.env` syntax errors.

---

## Verifying share and co-op

1. Supabase configured (env, migrations, anonymous auth, Realtime).
2. Start any puzzle → Menu → Share → **Play with friend**.
3. Copy or share the URL; open in another tab or device.
4. Move a piece in one tab; it should appear in the other.

Completion share (after finishing a puzzle) does not need Supabase.

---

## Related files

- `src/app/supabase/client.ts` — client and config
- `src/app/supabase/auth.ts` — anonymous auth helpers
- `supabase/migrations/` — tables and RLS
- `supabase/README.md` — short reference
