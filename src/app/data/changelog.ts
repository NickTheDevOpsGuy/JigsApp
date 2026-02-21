/** Changelog for What's New popup. Bump CHANGELOG_VERSION when adding entries. */
export const CHANGELOG_VERSION = "9";
const STORAGE_KEY = "phuzzle:lastSeenChangelog";

export const CHANGELOG_ENTRIES: { title: string; items: string[] }[] = [
  {
    title: "What's New",
    items: [
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
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "0";
  } catch {
    return "0";
  }
}

export function markChangelogSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, CHANGELOG_VERSION);
  } catch {
    // ignore
  }
}

export function shouldShowChangelog(): boolean {
  return getLastSeenVersion() !== CHANGELOG_VERSION;
}
