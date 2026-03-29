import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "@/screens/Play/components/replay/ReplayBar.module.css";

const SPEEDS = [1, 2, 3] as const;

interface ReplayBarSpeedControlsProps {
  speed: number;
  speedExplicitlyChosen: boolean;
  onSpeedChange: (speed: number) => void;
  stopProp: (e: React.PointerEvent) => void;
}

export function ReplayBarSpeedControls({
  speed,
  speedExplicitlyChosen,
  onSpeedChange,
  stopProp,
}: ReplayBarSpeedControlsProps) {
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
    document.addEventListener("pointerdown", onDocDown);
    return () => document.removeEventListener("pointerdown", onDocDown);
  }, [open]);

  return (
    <div
      className={styles.replayBarSpeedModule}
      role="group"
      aria-label="Playback speed"
      ref={rootRef}
      onPointerDown={stopProp}
    >
      <button
        type="button"
        className={styles.replayBarSpeedTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Playback speed ${effectiveSpeed}x`}
        title={`Playback speed: ${effectiveSpeed}x`}
      >
        <span className={styles.replayBarSpeedLabel}>Speed</span>
        <span className={styles.replayBarSpeedValue}>{effectiveSpeed}x</span>
        <ChevronDown
          size={16}
          className={open ? styles.replayBarSpeedChevronOpen : ""}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className={styles.replayBarSpeedMenu}
          role="menu"
          aria-label="Playback speed"
        >
          <div className={styles.replayBarSpeedMenuTitle}>Playback speed</div>
          {SPEEDS.map((s) => {
            const active = effectiveSpeed === s;
            return (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`${styles.replayBarSpeedMenuItem} ${active ? styles.replayBarSpeedMenuItemActive : ""}`}
                onClick={() => {
                  onSpeedChange(s);
                  setOpen(false);
                }}
                aria-label={`${s}x playback speed`}
                title={`${s}x speed`}
              >
                <span>{s}x</span>
                {active && <Check size={14} aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
