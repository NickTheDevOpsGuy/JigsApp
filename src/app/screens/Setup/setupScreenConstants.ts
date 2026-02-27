/**
 * Setup screen constants and labels.
 */
import type { TimeMode } from "../Play/timeMode";

export const TIME_MODE_LABELS: Record<TimeMode, string> = {
  elapsed: "Elapsed",
  countdown: "Countdown",
  active: "Active only",
  relaxed: "Relaxed (no timer)",
  best: "Best time",
  speedrun: "Speedrun (quadrants)",
  timeattack: "Time attack (3 lives)",
};

export const STORAGE_KEY = "phuzzle:imageDataUrl";

export type ImageSource = "gallery" | "upload" | "camera";
