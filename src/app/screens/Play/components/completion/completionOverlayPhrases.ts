const COMPLETION_PHRASES_FAST = [
  "Pew pew! ⚡ So fast!",
  "Speed run! 🏃",
  "That was quick! 🔥",
  "Boom! Done. ⚡",
  "Blink and you missed it! 👀",
];
const COMPLETION_PHRASES_MEDIUM = [
  "Nice solve! ⭐",
  "Well done! 🧩",
  "Smooth! ✨",
  "Crushed it! 💪",
  "Piece of cake! 🍰",
];
const COMPLETION_PHRASES_STEADY = [
  "Nice solve! ⭐",
  "Well done! 🧩",
  "Take your time—you got it! 🌟",
  "Steady wins. 🧩",
  "So satisfying! ✨",
  "Nailed it! 🎯",
];

export function pickCompletionPhrase(elapsedSeconds: number, moveCount: number): string {
  const total = elapsedSeconds + Math.max(0, moveCount);
  const fast = total < 45 ? COMPLETION_PHRASES_FAST : [];
  const medium = total < 120 ? COMPLETION_PHRASES_MEDIUM : COMPLETION_PHRASES_STEADY;
  const pool = fast.length > 0 ? fast : medium;
  return pool[Math.floor(Math.random() * pool.length)] ?? "Nice solve! ⭐";
}
