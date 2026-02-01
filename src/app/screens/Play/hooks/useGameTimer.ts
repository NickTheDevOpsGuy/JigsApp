import { useEffect, useState } from "react";

/**
 * Hook to manage the game timer.
 * Stops when game is complete or paused.
 */
export function useGameTimer(isComplete: boolean, isPaused: boolean, initialSeconds = 0) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);

  // Reset when initial changes (e.g., loading saved game)
  useEffect(() => {
    setElapsedSeconds(initialSeconds);
  }, [initialSeconds]);

  // Timer tick
  useEffect(() => {
    if (isComplete || isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isComplete, isPaused]);

  return { elapsedSeconds, setElapsedSeconds };
}
