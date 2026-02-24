# Future Features

Ideas and planned enhancements for Phuzzle.

---

## ✅ Piece Heatmap Overlay (Post-Completion) - Implemented

**Section:** Completion / Stats

**Status:** Done. Post-game overlay shows which pieces were moved most (red = hot, blue = cold).

**Behavior:**

- Track drag counts per piece during play
- Show a heatmap overlay on the completion summary screen
- Visualize which pieces were moved most often before placement

**Goal:**

- Fun replay insight
- Shareable stats moment (e.g. "My trickiest piece was moved 47 times!")

---

## ✅ Seasonal Puzzle Packs - Implemented

**Status:** Done. Pack list detects current season (spring, summer, fall, winter) and surfaces the matching pack as "Season's pick" at the top.

**Behavior:**

- `getCurrentSeason()` maps date to season (Northern Hemisphere)
- Packs with optional `season` field in `packMetadata.ts` / `puzzlePacks.ts`
- Season's pick shown first with badge and highlighted styling

---

## Other Implemented Features (from previous sessions)

- **Speedrun mode** - Quadrant timers (TL, TR, BL, BR) with PB comparison
- **Camera zoom-out** - 600ms ease-out on completion
- **Circular progress ring** - Around board, color shift at 75% / 95%
- **Drift mode** - Unplaced pieces nudge every ~10s
- **Snap sound picker** - Dedicated preference in Theme modal (Default, Classic, Soft, Punchy, Muted)
