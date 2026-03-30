const COMPLETION_PHRASES_FAST = [
  "So fast! ⚡",
  "Speed run! 🏃",
  "Quick! 🔥",
  "Boom! ⚡",
  "Lightning! ⚡",
  "On fire! 🔥",
  "Warp speed! 🚀",
  "Unstoppable! 🏆",
];
const COMPLETION_PHRASES_MEDIUM = [
  "Nice solve! ⭐",
  "Well done! 🧩",
  "Smooth! ✨",
  "Crushed it! 💪",
  "You did it! 🎉",
  "Awesome! 🌟",
  "Clean work! 🎯",
  "Yes! 🎊",
];
const COMPLETION_PHRASES_STEADY = [
  "Nice solve! ⭐",
  "Well done! 🧩",
  "Nailed it! 🎯",
  "Puzzle solved! 🧩",
  "Got it! ✨",
  "Steady win. 🧩",
];

/** Zero undos = flawless / clean solve — extra delight */
const COMPLETION_PHRASES_FLAWLESS = [
  "Flawless! ✨",
  "Clean solve! 🎯",
  "No undos! 💪",
  "Perfect run! ⭐",
  "Zero mistakes! 👑",
];

export function pickCompletionPhrase(
  elapsedSeconds: number,
  moveCount: number,
  undoCount = 0,
): string {
  const total = elapsedSeconds + Math.max(0, moveCount);
  const fast = total < 45 ? COMPLETION_PHRASES_FAST : [];
  const medium = total < 120 ? COMPLETION_PHRASES_MEDIUM : COMPLETION_PHRASES_STEADY;
  let pool = fast.length > 0 ? fast : medium;

  if (undoCount === 0 && pool.length > 0) {
    const flawless = COMPLETION_PHRASES_FLAWLESS;
    pool = [...pool, ...flawless];
  }

  return pool[Math.floor(Math.random() * pool.length)] ?? "Nice solve! ⭐";
}
