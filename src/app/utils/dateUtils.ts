/**
 * Local calendar date helpers (YYYY-MM-DD in the user's timezone).
 * Avoid `new Date("2026-03-16")` — that parses as UTC and breaks streaks / keys off UTC–local boundaries.
 */

/** Format a Date as local calendar YYYY-MM-DD. */
export function formatLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date in the user's local timezone. */
export function getTodayLocalYmd(): string {
  return formatLocalYmd(new Date());
}

/**
 * Parse YYYY-MM-DD as a local calendar date at local midnight.
 * Safe for streak iteration; unlike `new Date(ymd)` which is UTC in engines.
 */
export function parseLocalYmd(ymd: string): Date {
  const [ys, ms, ds] = ymd.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date();
  }
  return new Date(y, m - 1, d);
}

/** Monday (local) of the week containing this local calendar day, as YYYY-MM-DD. */
export function getLocalWeekMondayYmd(ymd: string): string {
  const ref = parseLocalYmd(ymd);
  const day = ref.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  ref.setDate(ref.getDate() - diffToMonday);
  return formatLocalYmd(ref);
}
