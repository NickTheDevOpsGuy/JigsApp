/**
 * Serialize replay snapshots for local save / share (JSON file).
 */
import type { ReplaySnapshot } from "@/screens/Play/hooks/gameplay/useReplay";

export const REPLAY_EXPORT_VERSION = 1 as const;

export type ReplayExportPayload = {
  version: typeof REPLAY_EXPORT_VERSION;
  exportedAt: string;
  app: "phuzzle";
  puzzleKey: string | null;
  puzzleName?: string;
  totalSeconds: number;
  snapshotCount: number;
  snapshots: ReplaySnapshot[];
};

export function buildReplayExportPayload(args: {
  snapshots: ReplaySnapshot[];
  puzzleKey: number | null;
  puzzleName?: string;
  totalSeconds: number;
}): ReplayExportPayload | null {
  if (args.snapshots.length === 0) return null;
  return {
    version: REPLAY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app: "phuzzle",
    puzzleKey: args.puzzleKey != null ? String(args.puzzleKey) : null,
    puzzleName: args.puzzleName,
    totalSeconds: args.totalSeconds,
    snapshotCount: args.snapshots.length,
    snapshots: args.snapshots,
  };
}

function slugForFilename(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function replayExportFilename(payload: ReplayExportPayload): string {
  const base =
    payload.puzzleName != null && payload.puzzleName.length > 0
      ? slugForFilename(payload.puzzleName)
      : payload.puzzleKey != null && payload.puzzleKey.length > 0
        ? `puzzle-${payload.puzzleKey}`
        : "puzzle";
  const safeBase = base.length > 0 ? base : "replay";
  const d = new Date(payload.exportedAt);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `phuzzle-replay-${safeBase}-${stamp}.json`;
}

export function downloadReplayJson(payload: ReplayExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = replayExportFilename(payload);
  a.click();
  URL.revokeObjectURL(url);
}

export type ReplayShareOutcome = "shared" | "downloaded" | "cancelled";

export async function shareReplayJson(
  payload: ReplayExportPayload,
): Promise<ReplayShareOutcome> {
  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: "application/json" });
  const name = replayExportFilename(payload);
  const file = new File([blob], name, { type: "application/json" });

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      const shareData: ShareData = {
        files: [file],
        title: "Phuzzle replay",
        text: `Solve replay${payload.puzzleName ? ` — ${payload.puzzleName}` : ""}`,
      };
      if (navigator.canShare && !navigator.canShare(shareData)) {
        downloadReplayJson(payload);
        return "downloaded";
      }
      await navigator.share(shareData);
      return "shared";
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      if (name === "AbortError") return "cancelled";
      downloadReplayJson(payload);
      return "downloaded";
    }
  }

  downloadReplayJson(payload);
  return "downloaded";
}
