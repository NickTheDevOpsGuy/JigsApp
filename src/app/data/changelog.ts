/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
import { safeLocalStorage } from "@/utils/safeLocalStorage";

export const CHANGELOG_VERSION = "30";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
      "📤 Share polish – Completion share copy is now neutral (no taunts), and challenge action is renamed to “Share with People”.",
      "🖼️ Share Card refresh – New cleaner, message-style card layout with large puzzle preview and result chips for mobile sharing.",
      "✅ Win screen tone – Replaced competitive “beat X%” line with calm completion/share messaging.",
      "↔️ Setup gallery now has left/right arrow buttons for horizontal scrolling.",
      "↔️ Pack puzzle lists now use the same left/right arrow scroll controls as setup.",
      "🧭 Horizontal scrollbars are visible again on setup and pack rows.",
      "📱 Mobile sizing is tighter with smaller scroll arrows and compact row spacing.",
      "📤 Share screen – Share Result and Challenge Friend both open the same inline share screen (no modal): one panel with result options (Copy link, Share Card, Download) and challenge options (Copy link, Send challenge).",
      "🧩 Piece order – Locked/placed pieces draw underneath; movable pieces always on top so they never get stuck behind completed sections.",
      "✨ Seam alignment – Pieces snap to integer positions so seams (e.g. eyes at piece boundaries) line up 100%.",
      "🔧 Unwinnable fix – You can always drag a group back into view; overlap-based clamp prevents getting stuck off the board.",
      "📐 Grid sizes – Smallest grid is now 3×3 (Starter); 2×2 removed.",
      "📐 Puzzle in canvas – The complete puzzle is always centered and scaled to fit the board so it never clips.",
      "📤 Share Result – Same share panel as Challenge: Copy link, Share Card (a capture of your result to share), and Download; Challenge Friend uses native share/copy with the challenge link.",
      "🧘 Zen Ambient – Toggle in Settings → Modes: no timer or rankings, subtle animated background, softer transitions for a pressure-free play.",
      "🕵️ Mystery Mode – Hide the full reference image; sections reveal only after you place pieces correctly (Settings → Modes).",
      "🎯 Precision Mode – Snap distance is scored; completion overlay shows average precision (px) and bonus points for tight snaps (Settings → Modes).",
      "📈 Dynamic Difficulty – Snap tolerance adjusts from your completion history: slightly tighter when you're fast, more forgiving when you're slower (Settings → Modes).",
      "😌 Adaptive Personality – UI tone follows your pace: fast play gets competitive microcopy and snappier HUD transitions; slow play gets calm copy and gentler animations (Settings → Modes).",
      "🏆 Win screen – Cycling positive message below “Puzzle Completed!” (e.g. You did it!, Nailed it!); “New best time!” when you beat your record; performance badge (Speed Demon, Precision Pro, Chill Mode) when not.",
      "📤 Share screen – Share text and card include a link to the exact puzzle: phuzzle.vercel.app/daily or phuzzle.vercel.app/play?session=… so friends can play the same puzzle.",
      "🏠 Start page – Today’s Puzzle button matches others (star on top, “Today’s Puzzle” below); starry background; under logo: streak and either “X players solved” (when Supabase has data) or teaser taglines when Supabase is blank",
      "📱 Win screen – No URL on overlay; puzzle link lives on the share card image (Share Result → Share Card PNG); Continue menu opens upward",
      "🏠 Start page – Date above card; bar shows Trophy, “Daily Phuzzle” (center), Help (?); “Next puzzle in Xh Ym” at bottom",
      "📅 Weekly album – Stats → Leaderboard → Week → Album: 7-slot page with daily puzzle thumbnails; mastery (⚡) when completed with no hints or undo",
      "🌫️ Fog modifier – Pieces gradually gain clarity when placed; unplaced stay foggy (daily modifier)",
      "🔥 Streak flame – Subtle flame animation when placement streak pops (“On fire!”)",
      "⏱️ Hint screens – All hint and onboarding toasts auto-dismiss after 3 seconds",
      "🔗 Share Result – Puzzle URL (phuzzle.vercel.app) and “Challenge a friend” in completion share popup; branded footer on share card image",
      "🏅 Mastery tracking – Daily completions without hints or undo tracked for weekly album and mastery streak",
      "🧩 Snap on release – Pieces snap when you release; no mid-drag snap for a smoother lock animation",
      "📱 Win screen – Share is a full menu option (same style as Continue, Play again, Back to home)",
      "🧩 Lock animation – Smooth snap restored: lock lerp in usePlayScreenAnimation (120ms, ease-out); drag position captured when drag ends",
      "🔧 Code refactor (continued) – Menu config constants, header menu items (display/rest) split, viewport storage and pointer-handler types extracted (see README file structure)",
      "🔧 Code refactor – Stats, Piece Tray, SFX, Play hooks, Setup, Leaderboard, and UI persistence split into smaller modules (see README file structure)",
      "🧩 Smoother lock – Pieces ease into place when they snap (no more jump); works on desktop and mobile",
      "📱 Completion screen – Larger puzzle image and a clear vertical menu for Continue, Play again, Back to home, Share Result",
      "📐 Mobile tray – Slightly shorter tray on small screens so the board has more room",
      "🎊 Confetti upgrade – Layered bursts on completion (main + side + lower arc); respects reduced motion & battery saver",
      "🏅 Percentile badges – Completion overlay shows Top 10%, Top 25%, or Top 50% badge when you rank in those tiers",
      "🧲 Snap during drag – Pieces snap when dragged quickly through the target (no need to release exactly on the spot)",
      "🔍 Zoom limits – Max zoom capped at 2.5× to prevent excessive zoom-in; smoother zoom steps",
      "💬 Daily comment counter – Live character count (280 max) with near-limit and at-limit styling",
      "🧩 Grid sizes – Starter 2×2 and Epic 10×10 presets; build up from 4 to 100 pieces gradually",
      "🏆 New win screen – Puzzle completed: image, Time/Moves/Accuracy/Rank, “Can you beat my run?”, Continue + Share",
      "🎊 Confetti on win – Celebration burst when the completion overlay appears (respects reduced motion & battery saver)",
      "📱 Mobile polish – Compact layouts (no page scroll), 44px touch targets, skip link, loading spinners for Stats/Packs",
      "♿ Accessibility – “Skip to main content” link for keyboard users; reduced motion disables tray pulse and confetti",
      "↩️ Undo snap-back – Undo animates pieces back to their prior position (Ctrl/Cmd+Z or button)",
      "🔼 Drag lift – Dragged pieces feel physically lifted (stronger shadow, slight scale)",
      "💬 Daily comments & reactions – React with emoji (👍 🎉 🔥 ✨ 💪) and leave a 280-char comment after completing today's puzzle",
      "📤 Share Result popup – New completion flow: Share Result opens modal with Share Card PNG, Seasonal frame, and Download",
      "🌸 Seasonal packs – Pack list highlights the season's pick (spring, summer, fall, winter) at the top with a badge",
      "🗺️ Heatmap – Post-completion overlay shows which pieces you moved most (red = hot, blue = cold)",
      "⏱️ Speedrun mode – Quadrant timers (TL, TR, BL, BR) with per-quadrant personal bests",
      "🔍 Zoom-out on complete – 600ms camera zoom when the last piece snaps in",
      "⭕ Circular progress – Ring around the board fills as you place pieces; color shifts at 75% and 95%",
      "🌀 Drift mode – Unplaced pieces gently drift every ~10s (Settings → Gameplay)",
      "🔊 Snap sound picker – Choose Default, Classic, Soft, Punchy, or Muted (Theme modal)",
      "⏱️ Daily countdown – Server-synced timer to next daily unlock on the Leaderboard; celebration when new puzzle is ready",
      "🛡️ Streak shield – Earn one freeze per week after a 5-day streak; auto-applied if you miss a day",
      "🧩 Alternate piece shapes – Classic, Irregular, Hard (Settings → Display → Piece shape)",
      "🖼️ Progressive reveal – Hide full reference; reveal only regions where pieces are placed (Settings → Display)",
      "⚡ Snap combo – Combo meter when 2+ placements within 2.5s; breaks on idle",
      "🔽 Filter in tray – Compact Filter dropdown in Piece Drawer (All, Edges, Color)",
      "📊 Live completion counter – See how many players completed today's puzzle in real time on the leaderboard",
      "🏅 Top X% – Your percentile ranking (e.g. Top 12%) shown on the completion overlay, per grid size",
      "✨ Snap proximity glow – Visual feedback while dragging: glow intensifies as you near the snap point",
      "📐 Layout reverted – Board on top, tray below. HUD in top bar. Tray 150px (desktop), 160px (mobile).",
      "🔤 Font – Nunito for UI (replaced Inter); Arial removed from fallback stack.",
      "💀 Extreme (9×9) – New 81-piece preset between Legend and Custom",
      "📊 Piece counts in labels – Difficulty dropdowns now show piece count (e.g. 🌱 3×3 (9 pieces))",
      "📱 Stats on mobile – Leaderboard and Stats screens fit and scroll properly on small screens",
      "↩️ Smarter undo – 50 steps for ≤64 pieces, 25 for 81+ to protect memory on large puzzles",
      "💡 Custom grid hint – Brief note when choosing 81+ pieces that larger puzzles may run slower on some devices",
      "🧩 Edge & corner pieces – Full image content now visible on straight edges (no cropping)",
      "❄️ Streak freeze – One per week; protect your daily streak if you miss a day",
      "🔍 Zoom & pan – Animated zoom transitions, persistent per grid size, soft board clamp",
      "👻 Ghost when idle – Faint ghost overlay after a few seconds of inactivity (Settings → View)",
      "🔲 Edge piece highlight – Optional faint border on edge pieces (Settings → View)",
      "🎯 Near-snap nudge – Gentle nudge when pieces are very close but not quite snapping",
      "🏆 Dynamic completion badges – Speed Demon, Chill Mode, Precision Pro, and more",
      "🔋 Battery-saver detection – Reduces confetti when low-power or data-saver is on",
      "📥 Piece drawer – Taller tray, compact mode, sticky filters, scroll snapping",
      "📊 Stats & Leaderboards – Daily puzzle, streaks, achievements (Supabase)",
      "↩️ Undo / Redo · 👻 Ghost hint · 🔒 Lock pieces",
    ],
  },
];

export function getLastSeenVersion(): string {
  return safeLocalStorage.getItem(STORAGE_KEY) ?? "0";
}

export function markChangelogSeen(): void {
  safeLocalStorage.setItem(STORAGE_KEY, CHANGELOG_VERSION);
}

export function shouldShowChangelog(): boolean {
  return getLastSeenVersion() !== CHANGELOG_VERSION;
}
