# Sharing in Phuzzle (Completion Share + Co-op Share)

This doc explains how **sharing** works in Phuzzle, where the code lives, and what needs to be configured for the Supabase-powered "Play with friend" flow.

## Two types of share

### 1) Share a completed puzzle (image + result text)

This works **without Supabase**.

**What it does**

- Builds social share URLs (X/Twitter, Facebook, Reddit, WhatsApp, etc.)
- Supports copy-to-clipboard
- Uses the Web Share API on supported mobile browsers
- Can export a PNG of the completed puzzle with a time overlay

**Key files**

- `src/app/screens/Play/hooks/useShareResults.ts`
  - Creates the share text and per-platform URLs
  - Handles copy + `navigator.share` when available
- `src/app/screens/Play/hooks/useDownloadImage.ts`
  - Exports the puzzle canvas as PNG
  - Adds a footer like: `🧩 Phuzzle - {pieces} pieces in {time}`
- `src/app/screens/Play/components/CompletionOverlay.tsx`
  - UI: buttons/links shown after completion
  - Wires the overlay to `useShareResults` + `useDownloadImage`

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
3. **Database migrations** – Run `supabase/migrations/001_full_schema.sql` (includes `puzzle_sessions`).
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
