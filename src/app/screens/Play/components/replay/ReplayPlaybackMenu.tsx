import React, { useEffect, useRef, useState } from "react";
import { Check, Download, Settings2, Share2 } from "lucide-react";
import type { ReplaySnapshot } from "@/screens/Play/hooks/gameplay/useReplay";
import {
  buildReplayExportPayload,
  downloadReplayJson,
  shareReplayJson,
  type ReplayExportPayload,
} from "@/screens/Play/components/replay/replayExport";
import type { ReplaySpeedCb } from "@/screens/Play/components/replay/replayInvoke";
import { invokeMaybeAsyncSpeed } from "@/screens/Play/components/replay/replayInvoke";
import controlStyles from "@/screens/Play/components/replay/ReplaySolveModal.controls.module.css";
import baseStyles from "@/screens/Play/components/replay/ReplaySolveModal.module.css";

const styles = { ...baseStyles, ...controlStyles };

const SPEEDS = [1, 2, 3] as const;

function stopProp(e: React.PointerEvent) {
  e.stopPropagation();
}

export interface ReplayPlaybackMenuProps {
  speed: number;
  speedExplicitlyChosen: boolean;
  onSpeedChange: ReplaySpeedCb;
  replayExport: {
    snapshots: ReplaySnapshot[];
    puzzleKey: number | null;
    puzzleName?: string;
    totalSeconds: number;
  } | null;
  onExportFeedback?: (message: string) => void;
}

export function ReplayPlaybackMenu({
  speed,
  speedExplicitlyChosen,
  onSpeedChange,
  replayExport,
  onExportFeedback,
}: ReplayPlaybackMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const effectiveSpeed = speedExplicitlyChosen ? speed : 1;

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const buildPayload = (): ReplayExportPayload | null => {
    if (!replayExport || replayExport.snapshots.length < 2) return null;
    return buildReplayExportPayload({
      snapshots: replayExport.snapshots,
      puzzleKey: replayExport.puzzleKey,
      puzzleName: replayExport.puzzleName,
      totalSeconds: replayExport.totalSeconds,
    });
  };

  const handleSave = () => {
    const payload = buildPayload();
    if (!payload) {
      onExportFeedback?.("Nothing to save yet.");
      setOpen(false);
      return;
    }
    downloadReplayJson(payload);
    onExportFeedback?.("Replay saved to your device.");
    setOpen(false);
  };

  const handleShare = async () => {
    const payload = buildPayload();
    if (!payload) {
      onExportFeedback?.("Nothing to share yet.");
      setOpen(false);
      return;
    }
    const outcome = await shareReplayJson(payload);
    if (outcome === "cancelled") {
      setOpen(false);
      return;
    }
    if (outcome === "shared") {
      onExportFeedback?.("Replay shared.");
    } else if (outcome === "downloaded") {
      onExportFeedback?.("Replay file ready — attach it to a message to share.");
    }
    setOpen(false);
  };

  const canExport = Boolean(replayExport && replayExport.snapshots.length > 1);

  return (
    <div className={styles.playbackMenuRoot} ref={rootRef} onPointerDown={stopProp}>
      <button
        type="button"
        className={styles.playbackMenuTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Replay and playback options. Speed ${effectiveSpeed}x.`}
        title="Playback options"
        onClick={() => setOpen((v) => !v)}
      >
        <Settings2 size={18} strokeWidth={2} aria-hidden />
      </button>

      {open && (
        <div
          className={styles.playbackMenuPopover}
          role="menu"
          aria-label="Playback options"
        >
          <div className={styles.playbackMenuSectionLabel}>Playback speed</div>
          {SPEEDS.map((s) => {
            const active = effectiveSpeed === s;
            return (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`${styles.playbackMenuItem} ${active ? styles.playbackMenuItemActive : ""}`}
                onClick={() => {
                  invokeMaybeAsyncSpeed(onSpeedChange, s);
                  setOpen(false);
                }}
              >
                <span>{s}x</span>
                {active && <Check size={14} aria-hidden />}
              </button>
            );
          })}

          <div className={styles.playbackMenuDivider} role="separator" />

          <div className={styles.playbackMenuSectionLabel}>Replay file</div>
          <button
            type="button"
            role="menuitem"
            className={styles.playbackMenuRowBtn}
            disabled={!canExport}
            title={
              canExport
                ? "Save a JSON file you can keep or send later"
                : "Replay needs more than one frame"
            }
            onClick={handleSave}
          >
            <Download size={16} aria-hidden />
            <span>Save to device</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.playbackMenuRowBtn}
            disabled={!canExport}
            title={
              canExport
                ? "Share via your system share sheet, or save the file"
                : "Replay needs more than one frame"
            }
            onClick={() => void handleShare()}
          >
            <Share2 size={16} aria-hidden />
            <span>Share replay…</span>
          </button>

          <p className={styles.playbackMenuHint}>
            Tip: Space plays or pauses. Arrow keys scrub when the timeline is focused.
          </p>
        </div>
      )}
    </div>
  );
}
