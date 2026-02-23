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

## Not Implemented (Future)

- **24-hour speed challenges** – Separate challenge tab, special leaderboard, badge (requires new DB schema, scheduling)
- **XP system + Prestige** – Reset XP for cosmetic badge (requires new progression system)
- **Separate stats per cut type** – Leaderboard filtering by cut (schema change)
