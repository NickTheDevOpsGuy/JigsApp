# Sharing in Phuzzle

Sharing in Phuzzle: **completion share** (your result), **Daily Share** (Wordle-style, daily only), and **co-op share** (play with a friend in real time).

---

## 1. Completion share (no Supabase)

- Share your finished puzzle: image, time, moves, link to the same puzzle.
- **Share Result** — same preview-style text block as challenge (Phuzzle → Puzzle → Difficulty / Time / Moves → URL) **without** “Think you can beat me?”; share card matches; link is the same puzzle (no `ct`/`cm` on the result URL).
- **Beat My Puzzle** — same stats block + **“Think you can beat me?”**; link = same puzzle/difficulty (`grid`, `puzzle`, `session`, or `daily` from `ensureChallengeShareUrl`) plus `ct` & `cm` for the challenge.
- Share card PNG: challenge (with CTA) or result (stats only, no taunt). Download supported.
- **Key files:** `useShareResults.ts`, `useDownloadImage.ts`, `useShareCardImage.ts`, `CompletionOverlay.tsx`, `shareMessages.ts`.

Triggered from the win overlay after completing a puzzle. Works without any backend.

---

## 1b. Daily Share (Wordle-style, daily only)

- **When:** Only after completing the **Daily Puzzle**. A **Daily Share** button appears on the win screen (with Next Puzzle, Share Result, Beat My Puzzle, Review Solve).
- **What:** A compact, copyable text block similar to Wordle shares:
  - `Phuzzle Daily #N` (N = deterministic daily number)
  - Difficulty • piece count
  - ⏱ time, 🔁 moves
  - A 4-cell emoji grid (🟦 = hit, ⬜ = miss): completed, good time, efficient moves, clean solve (no hint/undo)
  - Play link (opens the same daily)
- **How:** Copy to clipboard or native share (mobile). No image required; the text is self-contained.
- **Key files:** `shareMessages.ts` (`buildDailyShareMessage`, `getDailyShareCompletionGrid`), `dailyPuzzleCoreImpl.ts` (`getDailyPuzzleNumber`), `useCompletionOverlayData.ts` (daily share handlers), `CompletionOverlayActions.tsx` (Daily Share button when `isDaily`).

---

## 2. Co-op share (“Play with friend”) — needs Supabase

- Create a session; share the URL. Someone else opens it and sees the same puzzle.
- Moves sync in real time via Supabase Realtime.

**Flow:**

1. Start any puzzle.
2. Menu → Share → **Play with friend**.
3. A session is created; you get a share URL.
4. Friend opens the URL.
5. Either side moves a piece; the other sees it.

**Key files:**

- `puzzleSessionService.ts` — create/get/update session, Realtime subscribe.
- `usePuzzleSession.ts` — read `?session=...` from URL, create/join, push state, subscribe.
- PlayScreen uses `usePuzzleSession`; on remote state, calls `manager.restoreFromSaved()`.

---

## Config for co-op

1. Supabase project ([supabase.com](https://supabase.com)).
2. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)).
3. Run migrations (tables then RLS); includes `puzzle_sessions`.
4. Enable Anonymous auth in Supabase.
5. Enable Realtime for `puzzle_sessions` and `completions` (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)#5-enable-realtime).

Verification steps are in [SUPABASE_SETUP.md](SUPABASE_SETUP.md#verifying-share--co-op).

---

## Troubleshooting

**Co-op: WebSocket closes before connection**

- Confirm `puzzle_sessions` and `completions` are in the Realtime publication.
- Check env vars on Vercel and redeploy.
- Try incognito or disable ad blockers.

**Vercel: “Failed to fetch” or blank screen**

- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or clear site data.
- Cached HTML may point at old chunks; app may auto-reload on chunk failure.
