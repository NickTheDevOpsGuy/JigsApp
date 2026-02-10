# LinkedIn post — Phuzzle update (copy-paste)

---

**Phuzzle just got a big update.** 🧩

I shipped a batch of improvements to the jigsaw puzzle game I've been building — mobile polish, leaderboards, performance, and making it installable as an app.

**Mobile & UX**
• Completion screen now fits on small screens (scroll, responsive text).
• Piece selection is thinner and auto-clears after 1 second so it doesn't stick.
• Board size scales with piece count so planning on mobile is easier.
• Leaderboard tab is scrollable and touch-friendly.

**Leaderboards (Supabase)**
• Daily puzzle, weekly totals, monthly totals, and all-time completions.
• Anonymous mode: toggle in Profile and you show up as a fun raccoon-style name (e.g. "Trash Eater 42") — still tracked, and you can switch back to your display name anytime.

**Performance**
• For 100+ piece puzzles: idle redraw throttled, snap and overlap logic optimized so big puzzles stay smooth.

**Help**
• Two clear options: How to Play and Keyboard & Controls — no duplicate content.

**Testing & PWA**
• Unit tests (Vitest) and E2E (Playwright) run in CI and before push.
• Phuzzle is now a PWA: install from the browser (Add to Home Screen / Install app) and use it like a standalone app.

Docs and README are updated. Try it (or install it on your phone) — link in the comments. 👇

#Phuzzle #WebDev #PWA #React #SideProject #ProgressiveWebApp

---

**Link to add in comments:** https://phuzzle.vercel.app
