# Future Features

Ideas and planned enhancements for Phuzzle.

---

## Piece Heatmap Overlay (Post-Completion)

**Section:** Completion / Stats

**Behavior:**
- Track drag counts per piece during play
- Show a heatmap overlay on the completion summary screen
- Visualize which pieces were moved most often before placement

**Goal:**
- Fun replay insight
- Shareable stats moment (e.g. "My trickiest piece was moved 47 times!")

**Implementation notes:**
- Add `dragCount` to piece state or track separately in `PuzzleManager`
- On each piece drag (start → move → drop), increment counter for that piece
- Completion overlay: render board with semi-transparent heatmap (e.g. red = hot/many moves, blue = cold/few moves)
- Consider PostHog event for heatmap views
