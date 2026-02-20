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
    timeToSnapValues.length > 0 ? totalActiveMs / timeToSnapValues.length : 0;

  // Idle = session - active. Idle percent.
  const idleMs = Math.max(0, sessionDurationMs - totalActiveMs);
  const idlePercent = sessionDurationMs > 0 ? (idleMs / sessionDurationMs) * 100 : 0;

  return {
    snapCount,
    avgTimeBetweenSnapsMs,
    avgSnapVelocityPerMin,
    idlePercent,
    avgTimeToSnapMs,
  };
}

export type SavedSessionData = {
  metrics: SessionPlacementMetrics;
  grid: string;
  savedAt: number;
  /** Raw placement events for advanced export (timestamps, pieceIds, timeToSnapMs). */
  placementEvents?: PlacementEvent[];
  elapsedSeconds?: number;
};

export function saveLastSessionMetrics(
  metrics: SessionPlacementMetrics,
  grid: { rows: number; cols: number },
  placementEvents?: PlacementEvent[],
  elapsedSeconds?: number,
): void {
  try {
    const data: SavedSessionData = {
      metrics,
      grid: `${grid.rows}×${grid.cols}`,
      savedAt: Date.now(),
    };
    if (placementEvents?.length) data.placementEvents = placementEvents;
    if (elapsedSeconds != null) data.elapsedSeconds = elapsedSeconds;
    localStorage.setItem(PLACEMENT_METRICS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadLastSessionMetrics(): SavedSessionData | null {
  try {
    const raw = localStorage.getItem(PLACEMENT_METRICS_KEY);
    return raw ? (JSON.parse(raw) as SavedSessionData) : null;
  } catch {
    return null;
  }
}

/** Get metrics from saved data (handles legacy top-level format). */
export function getMetricsFromSaved(
  data: SavedSessionData | null,
): SessionPlacementMetrics | null {
  if (!data) return null;
  if ("metrics" in data && data.metrics) return data.metrics;
  const d = data as unknown as Partial<SessionPlacementMetrics & { grid?: string }>;
  if (d.snapCount == null) return null;
  return {
    snapCount: d.snapCount ?? 0,
    avgTimeBetweenSnapsMs: d.avgTimeBetweenSnapsMs ?? 0,
    avgSnapVelocityPerMin: d.avgSnapVelocityPerMin ?? 0,
    idlePercent: d.idlePercent ?? 0,
    avgTimeToSnapMs: d.avgTimeToSnapMs ?? 0,
  };
}

/** Compute idle durations (ms between consecutive placements) from placement events. */
export function computeIdleDurations(events: PlacementEvent[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];
    if (prev.timestampMs != null && curr.timestampMs != null) {
      gaps.push(curr.timestampMs - prev.timestampMs);
    }
  }
  return gaps;
}

export type SessionStatsExport = {
  exportedAt: string;
  grid: string;
  elapsedSeconds: number;
  snapCount: number;
  placementTimestamps: Array<{
    index: number;
    elapsedMs: number;
    timestampMs?: number;
    pieceIds: string[];
    timeToSnapMs?: number;
  }>;
  idleDurationsMs: number[];
  metrics: SessionPlacementMetrics;
};

/** Build exportable session stats JSON (for download). */
export function buildSessionStatsExport(
  data: SavedSessionData | null,
): SessionStatsExport | null {
  const metrics = getMetricsFromSaved(data ?? null);
  if (!metrics || !data || metrics.snapCount === 0) return null;
  const events = data.placementEvents ?? [];
  return {
    exportedAt: new Date().toISOString(),
    grid: data.grid ?? "unknown",
    elapsedSeconds: data.elapsedSeconds ?? 0,
    snapCount: metrics.snapCount,
    placementTimestamps: events.map((e, i) => ({
      index: i + 1,
      elapsedMs: e.elapsedMs,
      timestampMs: e.timestampMs,
      pieceIds: e.pieceIds,
      timeToSnapMs: e.timeToSnapMs,
    })),
    idleDurationsMs: computeIdleDurations(events),
    metrics,
  };
}

/** Trigger download of session stats as JSON file. */
export function downloadSessionStatsJson(): boolean {
  const data = loadLastSessionMetrics();
  const exportData = data ? buildSessionStatsExport(data) : null;
  if (!exportData) return false;
  try {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phuzzle-session-${exportData.grid}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
