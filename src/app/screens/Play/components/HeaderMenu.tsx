import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import styles from "../PlayScreen.module.css";

type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

export type HeaderMenuProps = {
  title?: string;

  showPreview: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  isFullscreen: boolean;

  canShowHaptics: boolean;
  canShowFullscreen: boolean;
  canShowShortcuts: boolean;
  canShowDebug: boolean;

  debug: DebugFlags;

  onNewPuzzle: () => void;
  onTogglePreview: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onToggleFullscreen: () => void;
  onShowShortcuts: () => void;
  onToggleDebug: () => void;
};

/**
 * Single source of truth for the "hamburger" menu.
 *
 * We keep the UI consistent by putting actions here for both desktop + mobile.
 */
export function HeaderMenu(props: HeaderMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target && el.contains(e.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.headerMenuWrap} ref={rootRef}>
      <Button
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        <Menu size={16} />
        <span className={styles.btnText}>Menu</span>
      </Button>

      {open && (
        <div className={styles.headerMenuPanel} role="menu">
          <button
            className={styles.headerMenuItem}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/");
            }}
          >
            Home
          </button>

          <button
            className={styles.headerMenuItem}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              props.onNewPuzzle();
            }}
          >
            New puzzle
          </button>

          <div className={styles.headerMenuDivider} />

          <button
            className={styles.headerMenuItem}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              props.onTogglePreview();
            }}
          >
            {props.showPreview ? "Hide preview" : "Show preview"}
          </button>

          <button
            className={styles.headerMenuItem}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              props.onToggleSound();
            }}
          >
            {props.soundEnabled ? "Sound: on" : "Sound: off"}
          </button>

          <div
            className={styles.headerMenuToggle}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <ThemeToggle variant="menuItem" />
          </div>

          {props.canShowHaptics && (
            <button
              className={styles.headerMenuItem}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                props.onToggleHaptics();
              }}
            >
              {props.hapticsEnabled ? "Haptics: on" : "Haptics: off"}
            </button>
          )}

          {props.canShowShortcuts && (
            <button
              className={styles.headerMenuItem}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                props.onShowShortcuts();
              }}
            >
              Keyboard shortcuts
            </button>
          )}

          {props.canShowFullscreen && (
            <button
              className={styles.headerMenuItem}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                props.onToggleFullscreen();
              }}
            >
              {props.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          )}

          {props.canShowDebug && (
            <button
              className={styles.headerMenuItem}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                props.onToggleDebug();
              }}
            >
              Debug overlay
            </button>
          )}
        </div>
      )}
    </div>
  );
}
