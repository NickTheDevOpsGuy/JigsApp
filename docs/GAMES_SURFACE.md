# Phuzzle on the Games surface

Phuzzle is a **solo jigsaw puzzle** web app. This document supports **registering** it on an external **Games** catalog (UAT / Prod) and running **QA** against the product requirements.

---

## Launch configuration

| Environment | Base URL (replace UAT when known) | Entry |
|---------------|-------------------------------------|--------|
| **Production** | `https://phuzzle.vercel.app/` | Open in new tab/window or embed (see [Embedding](#embedding)). |
| **UAT** | Set to your UAT deployment base URL | Same paths as prod (`/` home, `/play` game). |

**Machine-readable metadata** (for catalog ingestion or automation):

- `https://phuzzle.vercel.app/games-surface-manifest.json` (update `launchUrls.uat` in repo when UAT URL is fixed, then redeploy).

**PWA manifest** (name, icons, categories):

- `https://phuzzle.vercel.app/manifest.webmanifest` (generated at build; categories include `games`).

---

## Core behavior (requirement → product)

| Requirement | Phuzzle behavior |
|-------------|------------------|
| User can launch from Games surface | Deep-link to **Prod/UAT base URL** (`/`). User taps **Play Today**, **Quick Play**, or **Puzzle Packs** to start a puzzle. |
| Puzzle challenge presented | Jigsaw **board + piece tray**; image visible on pieces/board. |
| User interacts per mechanic | **Drag/drop**, snap to neighbors, optional **rotate**; HUD (timer, moves, pieces). |
| System validates completion | **All pieces placed** on the board → completion detected → **win / completion overlay**. |
| Records metrics | **Time**, **moves**, **grid/piece count**; **daily** runs also tie to **streak / weekly album** where enabled. |
| New puzzle after finish | From completion UI: **next puzzle**, **back to menu**, or open **Quick Play / Packs** again from home. |

---

## Persistence rules

| Topic | Behavior |
|-------|----------|
| **In progress** | **Resumable** for typical play: state is persisted locally (game save / daily state). Returning to the app or refreshing can restore an active puzzle (from play route or documented resume flows). |
| **Single-session only** | Not the default for jigsaw play; abandoning without saving may lose progress depending on mode—**daily** and **saved games** are designed to persist. |
| **Completed** | Completion is **recorded** (local stats; optional **Supabase** for leaderboards/profile when configured). A finished puzzle should not stay “active” as unsolved in the same session once the win flow completes. |

---

## UX (clarity & solved vs in progress)

- Clean, mobile-first UI; obvious **primary actions** on home (**Play Today**, packs, quick play).
- **Solved**: completion overlay, stats, and clear CTAs to leave or play again.
- **In progress**: board + tray; HUD shows **pieces remaining** and **timer** (when applicable).

---

## Acceptance criteria checklist

- [ ] User can **start** a Phuzzle session (open app → start puzzle).
- [ ] Puzzle **renders** (image, pieces, board) and accepts **interaction**.
- [ ] **Completion** is detected when the puzzle is finished.
- [ ] **Metrics** (time, moves, etc.) appear or are persisted appropriately after solve.
- [ ] User can **start another** puzzle after completion (via completion UI or home).
- [ ] **Refresh mid-puzzle**: progress **persists** where the mode supports save/resume (verify on `/play` with an in-progress save).
- [ ] **Solved** state does not incorrectly show as **active** unsolved after win (board should reflect complete / overlay).

---

## QA script (UAT · Windows 11 · Chrome)

Use your **UAT base URL** for all steps.

1. **Launch**  
   - Open UAT root URL.  
   - Confirm title/branding and **Play Today** or **Quick Play** visible.

2. **Render**  
   - Start **Quick Play** → pick category → puzzle → difficulty → **Start**.  
   - Confirm **board**, **tray**, and **pieces** render; no broken image icons.

3. **Interaction**  
   - Drag a piece toward the board; confirm **snap** or placement behavior.  
   - Confirm HUD updates (e.g. **moves** / **pieces**) if visible.

4. **Completion**  
   - Complete the puzzle (or use a **small grid** for speed).  
   - Confirm **win / completion** UI and that the puzzle is clearly **finished**.

5. **Metrics**  
   - Note **time** and **moves** (or equivalent) on completion screen.  
   - Optional: open **Stats** from home if signed-in features are in scope.

6. **Next puzzle**  
   - From completion, choose **play again** / **menu** / **another puzzle** and confirm a **new** round starts without the old board stuck as incomplete.

7. **Persistence (resumable)**  
   - Start a puzzle, place **some** pieces, **refresh** the page.  
   - Confirm either **resume** prompt or **restored board** (per current save behavior for that flow).  
   - If no resume: document as limitation for that path.

8. **Solved vs active**  
   - After a full solve, return to **home** and re-enter the same puzzle if applicable; confirm UI does not show an **impossible** “0 pieces left but unsolved” state.

Record **pass/fail** and **screenshots** for Games sign-off.

---

## Embedding (iframe)

If the Games client embeds Phuzzle:

1. **HTTPS** only.
2. **CSP `frame-ancestors`**: the deployment must **allow the Games parent origin**. Today `vercel.json` does not set `frame-ancestors`; add a `Content-Security-Policy` (or meta) header that includes the Games host once known, e.g.  
   `frame-ancestors 'self' https://games-parent.example.com`
3. **Third-party cookies**: not required for core local play; Supabase/session features may need same-site policy review if embedded.

---

## Related code (for engineers)

- Routes: `src/app/App.tsx` (`/`, `/play`, `/packs`, …).
- Play / completion: `src/app/screens/Play/`, completion overlay modules.
- Daily / persistence: `src/app/daily/`, local storage helpers, save/resume flows.
- PWA manifest: `vite.config.ts` (`VitePWA` `manifest`).

---

## Changelog for catalog owners

When **UAT URL** is finalized, update `public/games-surface-manifest.json` → `launchUrls.uat` and redeploy so the public manifest stays accurate.
