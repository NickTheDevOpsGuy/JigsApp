/**
 * Season detection – maps the current date to a season (Northern Hemisphere).
 */

export type Season = "spring" | "summer" | "fall" | "winter";

/** Simple month-based seasons (Northern Hemisphere): winter Dec–Feb, spring Mar–May, summer Jun–Aug, fall Sep–Nov */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1–12
  if (month >= 12 || month <= 2) return "winter";
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  return "fall";
}
