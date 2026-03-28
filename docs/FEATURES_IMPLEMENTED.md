# Features implemented

Implemented features and where they live. Migration note at the end.

---

## Daily unlock countdown

Server-synced timer via Supabase RPC `get_server_utc_now()`. Shown on leaderboard; celebration when countdown hits zero.  
**Files:** `serverTimeService.ts`, `DailyCountdown/`, `StatsScreen.tsx`, migrations (RPC).

---

## Streak freeze

Earn one freeze per week after a 5-day streak. Auto-applied when a day is missed.  
**Files:** `dailyPuzzleCore.ts` — `tryEarnStreakFreeze()`, `tryAutoApplyStreakFreeze()`. See [STREAK-FREEZE.md](STREAK-FREEZE.md).

---

## Alternate piece shapes

Classic, Irregular, Hard. Settings → Display → Piece shape. Persisted; applies to next puzzle.  
**Files:** `puzzle/core/types.ts` (PieceCutType), `puzzle/core/shape.ts`, `createInitialPieces.ts`, header menu config.

---

## Progressive reveal

Toggle hides full reference; only correctly placed regions reveal.  
**Files:** `ProgressivePreviewOverlay.tsx`, `usePlayScreenUI.ts`, `PlayScreen.tsx`.

---

## Snap combo

Combo meter when 2+ placements within 2.5s (“Combo ×2”, “×3”); resets after 2.5s idle.  
**Files:** `SnapComboMeter.tsx`, manager hooks, `PlayScreen.tsx`.

---

## Stats per cut type

Leaderboard filters: shape (Classic/Irregular/Hard), modifier, source; All-time also grid size. Cut type stored with completions.  
**Files:** migrations (`cut_type` column), `leaderboardService.ts`, `statsService.ts`, `StatsScreen.tsx`.

---

## 24-hour speed challenge

Same as daily but framed as speed challenge; winner badge. Challenge wins in `player_stats`.  
**Files:** `statsService.ts`, `StatsScreen.tsx`.

---

## XP and prestige

XP on completion (per piece + bonus); levels. At level 5+, prestige reset to Lv1 with ★; completions and challenge wins kept.  
**Files:** `statsService.ts`, `prestigeService.ts`, migration `002_cut_type_xp_prestige_challenge.sql`.

---

## Seasonal packs

10 packs with emojis; optional `season` in metadata. Season’s pick shown first with badge.  
**Files:** `utils/seasons.ts`, `packMetadata.ts`, `puzzlePacks.ts`, `samplePuzzles.ts`, `PackListScreen.tsx`.

---

## Weekly album, fog, streak flame, hints, share

- **Weekly album** — Leaderboard → Week → Album (7 slots, mastery ⚡).
- **Fog** — Unplaced pieces foggy; placed clear. Preview/tray global fog.
- **Streak flame** — “On fire!” toast with flame animation.
- **Hints** — Toasts auto-dismiss (configurable).
- **Share** — Result and “Challenge a friend”; share card with URL.
- **Mastery** — No hints/undo recorded as mastery; weekly album shows ⚡.

**Files:** `LeaderboardTab.tsx`, `renderBoard.ts`, `usePlayScreenAnimation.ts`, `PlayToasts.tsx`, `useShareCardImageCore.ts`, `shareCardImageShare.ts`, `statsService.ts`, `leaderboardFetchersShared.ts`.

---

## Start page and win screen

Start: compact top bar (Stats, Phuzzle, Help); one primary `Play Today’s Puzzle` CTA that switches to `Continue Daily` when today is already in progress; momentum strip with streak, freezes, and 7-day history; optional resume card with clearer daily context; secondary actions for Puzzle Packs and Quick Play; Feedback as a lightweight action.  
Win: drop-up for Continue/Play again; one celebration line; “New best time!” or performance badge; **Options** menu with **Share Result**, **Challenge Friend**, daily **Daily Share**, replay, next puzzle; URL on share card.  
**Files:** `MenuScreen.tsx`, `DailyCountdown.tsx`, `CompletionOverlay.tsx`, `CompletionOverlayActions.tsx`, `CompletionOverlayCore.tsx`, `useCompletionOverlayData.ts`, `useShareCardImageCore.ts`, `shareCardImageShare.ts`, `completionMessages.ts`.

---

## Migration

Run `supabase/migrations/002_cut_type_xp_prestige_challenge.sql` to add:

- `completions.cut_type`
- `player_stats`: `xp`, `level`, `prestige_count`, `challenge_wins`
