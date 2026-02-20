# Future Features

Ideas and planned enhancements for Phuzzle.

---

## ✅ Recently Added

- **Piece Scatter Animation** – At puzzle start, pieces animate into the tray with a quick scatter effect: scale up, slight random rotation, offset-to-center motion. ~0.75s, ease-out-back. Respects `prefers-reduced-motion`.
- **Animated Background Gradient** – Extracts 2–3 dominant colors from the puzzle image and renders a soft animated gradient behind the board. Respects `prefers-reduced-motion`. Cohesive with image; lightweight sampling (32×32).
- **Streak Flame Animation** – Subtle animated flame icon (🔥3/🌟7) next to streak holders on daily/Time Attack/Time Decay leaderboards. Encourages daily participation; respects reduced motion.
- **Placement Speed Metrics** – Time between snaps, snaps/min, idle %, and avg drag-to-snap time from your last session. View in Stats → Dashboard. Read-only metrics (no impact on touch or drag).
- **Border Complete Celebration** – Confetti + "Border complete!" toast when all edge and corner pieces are placed (once per puzzle).
- **Challenge Mode** – Menu → Gameplay. Full image shown 5 seconds at start, then solve from memory; no ghost image.
- **Leaderboard Redesign** – Today's Daily Puzzle card with mascot, Start Puzzle button, filter pills; Leaderboard button on home menu.
- **Ghost Image (Behind Board)** – Toggle under Settings → View / Assistance → Reference. Very low opacity (7%) to help align pieces. Auto-disabled in competitive/daily mode.
- **Time Attack Mode** – Countdown-based competitive mode with dedicated leaderboard. Select in Setup or Time Mode.
- **Multi-Tier Achievements** – 10, 50, 100 puzzles; 5 puzzles under 5 minutes (Speed Runner).
- **Relaxed Mode (Snap Tolerance)** – Already implemented: after ~15s without placement, snap tolerance increases. Toggle in Settings → Gameplay.

---

## Crop and Position Images Before Generation

**Section:** Feature

**Features:**

- Zoom + pan crop window
- Aspect ratio lock
- Preview grid overlay before generation

**Success criteria:** Better looking puzzles from user uploads; fewer poorly cropped pieces.

**Implementation notes:**

- New `ImageCropper` component in SetupScreen
- Crop state: x, y, scale, aspectRatio
- Pass cropped region to puzzle piece generation

---

## Puzzle Replay Animation

**Section:** Gameplay

**Behavior:**

- Record puzzle state snapshots during play
- Fast-forward build animation after completion
- Scrubbable timeline
- Optional shareable replay clip

**Success criteria:** Share-worthy moment; performance remains stable during recording.

**Implementation notes:**

- Snapshot keyframes: timestamp + piece positions
- Replay: interpolate between keyframes, render at configurable speed
- Consider WebCodecs or MediaRecorder for clip export

---

## Custom Piece Clusters in Tray

**Section:** Gameplay

**Behavior:**

- Select multiple pieces
- Assign to temporary cluster
- Drag cluster together

**Success criteria:** Advanced players solve faster; no snap logic conflicts.

---

## Customizable Raccoon Avatars

**Section:** Future

**Options:**

- Hat styles
- Glasses
- Hoodie colors
- Unlock via achievements

**Success criteria:** Players personalize profiles; visible on leaderboard.

---

## Limited-Time Puzzle Events

**Section:** Gameplay

**Examples:**

- Halloween pack
- Winter event
- Limited leaderboard season

**Success criteria:** Time-bound engagement; seasonal badge or leaderboard.

**Implementation notes:**

- `eventId` or `event_slug` on completions/packs
- Event metadata: start_date, end_date, badge_id
- Filter leaderboards by event

---

## Daily Streak Milestones (Enhancements)

**Section:** Feature

**Planned enhancements:**

- 3-day and 7-day streak badges (achievements exist; consider UI badges)
- Special confetti colors for streak milestones
- Unique raccoon name flair for long streaks

**Success criteria:** Increased daily retention; clear visible streak progress.

---

## Community Difficulty Rating

**Section:** Gameplay / Setup

**Behavior:**

- Aggregate average completion time per puzzle/grid
- Show 1–5 flame icons as difficulty indicator
- Updates dynamically with real data

**Success criteria:** Helps players choose appropriate challenge; visible before starting puzzle.

**Implementation notes:**

- Requires backend aggregation: avg elapsed per grid size (and optionally per image hash)
- New `difficulty_rating` or computed from completion stats
- Display on Setup or pack selection screen

---

## Smart Hint

**Section:** Gameplay

**Behavior:**

- Analyzes current board state
- Highlights best candidate piece for placement
- Cooldown between uses

**Success criteria:** Helps stuck players; does not auto-solve puzzle.

**Implementation notes:**

- Heuristic: find unplaced piece with most placed neighbors, or best edge/pattern match
- Highlight via ghost or glow; cooldown 30–60s
- Settings toggle for hint availability

---

## Ghost Race Mode

**Section:** Gameplay

**Behavior:**

- Replay ghost piece placements in real-time from another player's session
- Semi-transparent ghost pieces
- Time comparison indicator

**Success criteria:** Clear visual distinction between live and ghost; separate leaderboard for race mode.

**Implementation notes:**

- Store placement timestamps + piece IDs in completion records
- Playback: render ghost pieces at interpolated positions based on elapsed time
- Requires schema for `placement_sequence` or similar; race-specific leaderboard

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
