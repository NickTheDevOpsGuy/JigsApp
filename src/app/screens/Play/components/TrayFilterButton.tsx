/**
 * TrayFilterButton – compact "Filter" dropdown; pops up above trigger on desktop and mobile.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Filter } from "lucide-react";
import styles from "./TrayFilterButton.module.css";

// Keep filter values stable so users don't "lose" options between sessions/updates.
export type TrayFilter = "all" | "corners" | "edges" | "colors";

const LABELS: Record<TrayFilter, string> = {
  all: "All",
  corners: "Corners",
  edges: "Sides",
  colors: "Color",
};

interface TrayFilterButtonProps {
  value: TrayFilter;
  onChange: (v: TrayFilter) => void;
  hasImage: boolean;
}

export function TrayFilterButton({ value, onChange, hasImage }: TrayFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{
    bottom: number;
    left: number;
    minWidth: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) {
      setMenuRect(null);
      return;
    }
    const rect = wrapRef.current.getBoundingClientRect();
    const gap = 4;
    setMenuRect({
      bottom: window.innerHeight - (rect.top - gap),
      left: rect.left,
      minWidth: rect.width,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      const menuEl = document.querySelector(`.${styles.menuPop}`);
      if (menuEl?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Filter pieces: ${LABELS[value]}`}
        title={`Filter pieces: ${LABELS[value]}`}
      >
        <Filter size={16} />
        <span className={styles.label}>Filter</span>
      </button>
      {open &&
        menuRect &&
        createPortal(
          <div
            className={`${styles.menuPop} ${styles.menuUp}`}
            role="listbox"
            style={{
              position: "fixed",
              bottom: menuRect.bottom,
              left: menuRect.left,
              minWidth: menuRect.minWidth,
            }}
          >
            {(["all", "corners", "edges", "colors"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={value === opt}
                className={value === opt ? styles.menuItemActive : styles.menuItem}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                disabled={opt === "colors" && !hasImage}
              >
                <span className={styles.checkSlot}>
                  {value === opt && (
                    <Check size={14} className={styles.checkIcon} aria-hidden />
                  )}
                </span>
                {LABELS[opt]}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
