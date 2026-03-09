# Sharing in Phuzzle (Completion Share + Co-op Share)

This doc explains how **sharing** works in Phuzzle, where the code lives, and what needs to be configured for the Supabase-powered "Play with friend" flow.

## Two types of share

### 1) Share a completed puzzle (image + result text)

This works **without Supabase**.

**What it does**

- Builds social share URLs (X/Twitter, Facebook, Reddit, WhatsApp, etc.)
- Supports copy-to-clipboard
- Uses the Web Share API on supported mobile browsers
- Can export a PNG share card of the completed puzzle (clean layout, no taunt text)
- **Share text** is neutral and includes your result plus a **link to the exact puzzle** (phuzzle.vercel.app/daily for daily, or phuzzle.vercel.app/play?session=… for a session) so others can play the same puzzle
- **Win overlay share section** uses two clear actions:
  - **Share Result** for your completion summary (time, moves, accuracy)
  - **Share with People** to share the same puzzle + difficulty quickly
    Both use native share/copy where available and support Share Card + Download.

**Key files**

- `src/app/screens/Play/hooks/useShareResults.ts`
  - Creates neutral share text + per-platform URLs; play URL is the exact puzzle (daily or session)
  - Handles copy + `navigator.share` when available
- `src/app/screens/Play/hooks/useDownloadImage.ts`
  - Exports the puzzle canvas as PNG
  - Adds a footer like: `🧩 Phuzzle - {pieces} pieces in {time}`
- `src/app/screens/Play/hooks/useShareCardImage.ts`
  - Share Card PNG: **Challenge** mode is image-only (dark gradient background, centered puzzle image with gold border; no text on the card). **Result** mode: header, time, piece count and difficulty, accuracy, footer with play URL. Share text uses a random taunt phrase (e.g. "BOOM! I just crushed that puzzle! 😎") plus time/moves and same-puzzle URL. Share title "Phuzzle" to avoid duplicate "Phuzzle Challenge" in shared text.
- `src/app/screens/Play/components/CompletionOverlay.tsx`
  - UI: Win overlay with **Share Result** and **Share with People** actions. Puzzle image shown without text overlay; time/stats in block above image. Share card image built in `useShareCardImage.ts`. Wires overlay to `useShareResults` + `useDownloadImage` + `useShareCardImage`. Panel centered (margin: auto).
- **Board when complete** (after dismissing overlay): Share-card-style banner at top of board with "Solved in X:XX!" and move count (`PlayScreen.tsx` + `PlayScreen.module.css` `.boardCompleteMessage` / `.boardCompleteBanner`).
- **Piece tray**: Horizontal scrollbar is hidden (tray still scrolls); see `PlayScreen.module.css` `.trayScroll`.

**How it's triggered**

- When the puzzle is completed, the completion overlay renders share actions.
- Clicking a social button opens the corresponding share URL.
- "Download image" uses `useDownloadImage` to generate a PNG.

---

### 2) Co-op share ("Play with friend" real-time session)

This **requires Supabase** (database + Realtime).

**What it does**

- Creates a shareable session URL that encodes a `sessionId`
- A second device opens that URL and loads the same puzzle state
- Piece moves sync through Supabase Realtime

**Key files**

- `src/app/services/puzzleSessionService.ts`
  - `createPuzzleSession(...)`: inserts a new row and returns `sessionId`
  - `getPuzzleSession(sessionId)`: fetches session row by id
  - `updatePuzzleSession(sessionId, patch)`: persists changes (pieces, state, etc.)
  - `subscribePuzzleSession(sessionId, onUpdate)`: Realtime subscription for updates; optional presence for connected count
- `src/app/screens/Play/hooks/usePuzzleSession.ts`
  - Reads `?session=...` from URL to join or create
  - `createSession(...)`: calls `createPuzzleSession`, stores `sessionId`, updates URL
  - `getShareUrl()` / `copyShareLink()` / `nativeShare()`: share the current session URL
  - `pushState(...)`: debounced write to `updatePuzzleSession`
  - Subscribes to Realtime; when remote state arrives, exposes it for PlayScreen to apply
- `src/app/screens/Play/PlayScreen.tsx`
  - Uses `usePuzzleSession`; passes `handleSharePuzzle` to `HeaderMenu`
  - If `sessionId` in URL and Supabase configured: fetches session, restores pieces, subscribes
  - When in a session and state changes: calls `pushState`; when remote state arrives: `manager.restoreFromSaved()`
- `src/app/screens/Play/components/headerMenuConfig.tsx`
  - "Play with friend?" menu item; only visible when Supabase is configured

**How it's triggered**

1. User starts a puzzle (any image, any grid).
2. User opens Menu (☰) → Share → **Play with friend?**
3. `handleSharePuzzle` runs: if no session yet, calls `createSession(...)`, then shares the URL via clipboard or `navigator.share`.
4. Friend opens the shared URL (e.g. `https://phuzzle.vercel.app/play?session=abc123`).
5. PlayScreen sees `session` in the URL, fetches the session, restores pieces, subscribes to Realtime.
6. Either side moves a piece → `pushState` writes to DB → Realtime pushes to the other tab → `remoteState` updates → `manager.restoreFromSaved()` syncs the board.

---

## What needs to be configured

For **completion share**: nothing. It works out of the box.

For **co-op**:

1. **Supabase project** – Create a project at [supabase.com](https://supabase.com).
2. **Environment variables** – Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)).
3. **Database migrations** – Run `supabase/migrations/20260225120000_tables.sql` then `supabase/migrations/20260225120001_rls.sql` (tables include `puzzle_sessions`).
4. **Anonymous auth** – Enable Anonymous sign-ins in Supabase Auth.
5. **Realtime** – The migration adds `puzzle_sessions` and `completions`. If needed: Database → Replication → toggle both ON, or run the ALTER PUBLICATION commands from [SUPABASE_SETUP.md § Enable Realtime](./SUPABASE_SETUP.md#5-enable-realtime).

See [Verifying Share / Co-op](./SUPABASE_SETUP.md#verifying-share--co-op) in the Supabase doc for a step-by-step check.

---

## Troubleshooting

### Co-op: WebSocket "closed before connection established"

1. Ensure `puzzle_sessions` and `completions` are in the Realtime publication (migration adds both; see [SUPABASE_SETUP.md § Enable Realtime](./SUPABASE_SETUP.md#5-enable-realtime))
2. Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel (or your host) and **redeploy** after adding them
3. Try incognito or disable ad blockers – some extensions block WebSocket connections

### Vercel: "Failed to fetch" or blank screen after deploy

This happens when cached HTML references old chunk files that no longer exist. The app now auto-reloads on chunk load failures. If it persists:

1. **Hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear site data:** DevTools → Application → Storage → Clear site data
3. Ensure the latest `vercel.json` (Cache-Control headers) and `index.html` (error handler) are deployed
