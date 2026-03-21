const COMPLETION_PHRASES_FAST = [
  "Pew pew! ⚡ So fast!",
  "Speed run! 🏃",
  "That was quick! 🔥",
  "Boom! Done. ⚡",
  "Blink and you missed it! 👀",
  "Lightning! ⚡",
  "You're on fire! 🔥",
  "Warp speed! 🚀",
  "Unstoppable! 🏆",
  "Sharp pace. Sharp solve. ⚡",
  "Fast finish, cleaner than ever. 🚀",
  "You read that puzzle instantly. 👀",
];
const COMPLETION_PHRASES_MEDIUM = [
  "Nice solve! ⭐",
  "Well done! 🧩",
  "Smooth! ✨",
  "Crushed it! 💪",
  "Piece of cake! 🍰",
  "Love it! 💜",
  "You did it! 🎉",
  "Awesome! 🌟",
  "Clean work! 🎯",
  "Yes!! 🎊",
  "Great eye for detail. 👏",
  "That was a polished solve. ✨",
  "Strong finish. Nicely played. 🧩",
];
const COMPLETION_PHRASES_STEADY = [
  "Nice solve! ⭐",
  "Well done! 🧩",
  "Take your time—you got it! 🌟",
  "Steady wins. 🧩",
  "So satisfying! ✨",
  "Nailed it! 🎯",
  "Puzzle solved! 🧩",
  "That felt good! ✨",
  "Steady hands, smart choices. 🌟",
  "Patient play pays off. 💪",
  "You kept it controlled all the way through. 🎯",
];

/** Zero undos = flawless / clean solve — extra delight */
const COMPLETION_PHRASES_FLAWLESS = [
  "Flawless! ✨",
  "Clean solve! 🎯",
  "No undos — pure skill! 💪",
  "Perfect run! ⭐",
  "First try, best try! 🌟",
  "Zero mistakes. Respect. 👑",
  "Clean all the way through. That’s skill. ✨",
  "Every move looked intentional. 🎯",
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
