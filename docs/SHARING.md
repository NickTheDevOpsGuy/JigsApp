# Sharing in Phuzzle

Sharing in Phuzzle: **completion share** (your result), **Daily Share** (Wordle-style, daily only), and **co-op share** (play with a friend in real time).

---

## 1. Completion share (no Supabase)

- Share your finished puzzle: **PNG share card** (stats + link) plus companion **share text** when the platform supports it.
- On the win screen, **Options** opens a menu. **Challenge Friend** and **Share Result** **start share immediately** (native share sheet when available, otherwise **PNG download**). There is **no** nested share modal or duplicate preview step.
- **Share Result** — concise text from `shareMessages` (puzzle context, time, moves, URL) **without** the challenge invite line; share card is the **result** variant; link has **no new** `ct`/`cm`. If the player opened a challenge link, result text can still mention the target or win.
- **Challenge Friend** — adds a short challenge line; URL includes `ct` & `cm`. The playable link comes from **`puzzleShareUrl`** on the play screen; when a co-op **session** exists, `usePlayScreenShareSession` keeps **`shareSessionId`** in sync so the URL can include `session=…` when appropriate. Incoming challenge links show a HUD target and the win overlay calls out wins or runbacks.
- Share card PNG: **challenge** (with CTA) or **result** (stats band, no taunt). If the user **dismisses** the native share UI (`AbortError`), the app **falls through to download** so the image is not lost.
- Errors use **toasts** (`setShareToast`), not a blocking dialog.
- Completion capture uses async canvas **blob / object URL** (not synchronous `toDataURL()`) to keep the win transition smooth on mobile.
- **Key files:** `useCompletionOverlayData.ts`, `CompletionOverlayActions.tsx`, `CompletionOverlayCore.tsx`, `usePlayScreenShareSession.ts`, `useShareCardImageCore.ts`, `shareCardImageShare.ts`, `shareMessages.ts`, `useShareResults.ts`, `useDownloadImage.ts`.

Triggered from the win overlay after completing a puzzle. Works without any backend.

---

## 1b. Daily Share (Wordle-style, daily only)

- **When:** Only after completing the **Daily Puzzle**. **Daily Share** appears in the win-screen **Options** menu (calendar icon), alongside items like next puzzle, replay, **Challenge Friend**, and **Share Result**.
- **What:** A compact, copyable text block similar to Wordle shares:
  - `Phuzzle Daily #N` (N = deterministic daily number)
  - Difficulty • piece count
  - ⏱ time, 🔁 moves
  - Optional streak line when the daily streak is active
  - A 4-cell emoji grid (🟦 = hit, ⬜ = miss): completed, good time, efficient moves, clean solve (no hint/undo)
  - Play link (opens the same daily)
- **Daily archive:** The daily picker can launch recent archived dailies for extra play. Archived runs do not mark today's daily complete or advance today's streak.
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
