# Features Implemented (Feb 2025)

## 1. Daily Unlock Countdown ✓

- **Server-synced timer** via Supabase RPC `get_server_utc_now()` (fallback to client time if Supabase unavailable)
- **Prominent on leaderboard** – DailyCountdown component shown at top of Stats/Leaderboard tab
- **Celebration at unlock** – Confetti animation when countdown hits zero
- **Files**: `serverTimeService.ts`, `DailyCountdown/`, `StatsScreen.tsx`, `001_full_schema.sql` (includes `get_server_utc_now()` RPC)

## 2. Streak Shield ✓

- **Earn after 5-day streak** – Freeze only granted when streak reaches 5+ (once per week)
- **Auto-apply when day missed** – On app init, automatically consumes freeze for yesterday if missed
- **Files**: `dailyPuzzleCore.ts` – `tryEarnStreakFreeze()`, `tryAutoApplyStreakFreeze()`

## 3. Alternate Piece Shapes ✓

- **Classic** – Original cut (22% depth, 36% width)
- **Irregular** – Deeper/varied tabs (26% depth, 32% width, curvier)
- **Hard** – Subtle tabs (14% depth, 28% width)
- **Settings → Display** – "Piece shape" cycles Classic → Irregular → Hard
- **Replay** – Choose cut type before new game; persisted in localStorage
- **Files**: `puzzle/types.ts` (PieceCutType), `puzzle/shape.ts`, `createInitialPieces.ts`, `PuzzleManager.ts`, `headerMenuConfig.tsx`, `usePlayScreenUI.ts`

## 4. Progressive Reveal Mode ✓

- **No full preview** – Toggle hides full reference image
- **Gradual reveal** – Small overlay shows only the regions where pieces are correctly placed
- **Settings → Display** – "Progressive Reveal" toggle
- **Files**: `ProgressivePreviewOverlay.tsx`, `usePlayScreenUI.ts`, `PlayScreen.tsx`

## 5. Snap Combo ✓

- **Combo meter** – Appears when 2+ placements within 2.5s
- **Visible feedback** – "Combo ×2", "×3", etc. centered on board
- **Breaks on idle** – Combo resets after 2.5s without placement
- **Files**: `SnapComboMeter.tsx`, `usePlayScreenManager.ts`, `PlayScreen.tsx`

## 6. Separate Stats per Cut Type ✓

- **Cut type filter** – Leaderboard views (Today, Challenge, Best week/month, All-time) can filter by Classic, Irregular, or Hard
- **Stored with completions** – `cut_type` column in completions table (migration 002)
- **Files**: `002_cut_type_xp_prestige_challenge.sql`, `leaderboardService.ts`, `statsService.ts`, `StatsScreen.tsx`

## 7. 24-Hour Speed Challenge ✓

- **Challenge tab** – Same as Today's daily but framed as "24-hour speed challenge" with winner badge (🏆)
- **Challenge wins** – Stored in `player_stats.challenge_wins`; awarded when tied for #1 on daily
- **Files**: `statsService.ts`, `StatsScreen.tsx`

## 8. XP System + Prestige Reset ✓

- **XP on completion** – 10 per piece + 5 bonus; level thresholds: 2=100, 3=250, +150 per level
- **Prestige** – At level 5+, reset to Lv1, earn ★ badge; puzzles completed & challenge wins kept
- **Files**: `statsService.ts`, `prestigeService.ts`, `002_cut_type_xp_prestige_challenge.sql`, `StatsScreen.tsx`

## 9. Seasonal Puzzle Packs ✓

- **Season detection** – `getCurrentSeason()` maps current date to spring, summer, fall, or winter (Northern Hemisphere)
- **Pack metadata** – Packs can have optional `season` field in `packMetadata.ts` and `puzzlePacks.ts`
- **Season's pick** – Matching pack is shown first in the pack list with highlighted styling and "Season's pick" badge
- **Files**: `utils/seasons.ts`, `utils/seasons.test.ts`, `packMetadata.ts`, `puzzlePacks.ts`, `PackListScreen.tsx`

## Migration Required

Run `supabase/migrations/002_cut_type_xp_prestige_challenge.sql` to add:

- `completions.cut_type`
- `player_stats.xp`, `level`, `prestige_count`, `challenge_wins`
