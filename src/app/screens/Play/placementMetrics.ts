/**
 * placementMetrics – compute session placement speed stats.
 */

export type PlacementEvent = {
  elapsedMs: number;
  pieceIds: string[];
  timestampMs?: number;
  timeToSnapMs?: number;
};

export type SessionPlacementMetrics = {
  snapCount: number;
  avgTimeBetweenSnapsMs: number;
  avgSnapVelocityPerMin: number;
  idlePercent: number;
  avgTimeToSnapMs: number;
};

export const PLACEMENT_METRICS_KEY = "phuzzle:lastSessionPlacementMetrics";

export function computeSessionMetrics(
  events: PlacementEvent[],
  sessionDurationMs: number,
): SessionPlacementMetrics | null {
  if (events.length === 0 || sessionDurationMs <= 0) return null;

  const snapCount = events.length;

  // Time between snaps (gaps between consecutive timestamps)
  let totalGapMs = 0;
  let gapCount = 0;
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1] as PlacementEvent & { timestampMs?: number };
    const curr = events[i] as PlacementEvent & { timestampMs?: number };
    if (prev.timestampMs != null && curr.timestampMs != null) {
      totalGapMs += curr.timestampMs - prev.timestampMs;
      gapCount += 1;
    }
  }
  const avgTimeBetweenSnapsMs = gapCount > 0 ? totalGapMs / gapCount : 0;

  // Snap velocity: snaps per minute (when gaps available)
  const avgSnapVelocityPerMin =
    avgTimeBetweenSnapsMs > 0 ? (60 * 1000) / avgTimeBetweenSnapsMs : 0;

  // Active time = sum of time-to-snap per placement
  const timeToSnapValues = events
    .map((e) => e.timeToSnapMs)
    .filter((v): v is number => typeof v === "number" && v >= 0);
  const totalActiveMs = timeToSnapValues.reduce((a, b) => a + b, 0);
  const avgTimeToSnapMs =
    timeToSnapValues.length > 0
      ? totalActiveMs / timeToSnapValues.length
      : 0;

  // Idle = session - active. Idle percent.
  const idleMs = Math.max(0, sessionDurationMs - totalActiveMs);
  const idlePercent =
    sessionDurationMs > 0 ? (idleMs / sessionDurationMs) * 100 : 0;

  return {
    snapCount,
    avgTimeBetweenSnapsMs,
    avgSnapVelocityPerMin,
    idlePercent,
    avgTimeToSnapMs,
  };
}

export function saveLastSessionMetrics(
  metrics: SessionPlacementMetrics,
  grid: { rows: number; cols: number },
): void {
  try {
    localStorage.setItem(
      PLACEMENT_METRICS_KEY,
      JSON.stringify({
        ...metrics,
        grid: `${grid.rows}×${grid.cols}`,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // ignore
  }
}

export function loadLastSessionMetrics(): (SessionPlacementMetrics & {
  grid?: string;
  savedAt?: number;
}) | null {
  try {
    const raw = localStorage.getItem(PLACEMENT_METRICS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
