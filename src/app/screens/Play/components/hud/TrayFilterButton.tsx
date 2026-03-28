/**
 * TrayFilterButton – compact "Filter" dropdown; pops up above trigger on desktop and mobile.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Filter } from "lucide-react";
import {
  getLayoutViewportSize,
  subscribeViewportResizeOnly,
} from "@/utils/layoutViewport";
import styles from "./TrayFilterButton.module.css";

// Keep filter values stable so users don't "lose" options between sessions/updates.
export type TrayFilter = "all" | "clusters" | "corners" | "edges" | "colors" | "arranged";

const LABELS: Record<TrayFilter, string> = {
  all: "All",
  clusters: "Clusters",
  corners: "Corners",
  edges: "Sides",
  colors: "Color",
  arranged: "Arrange",
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
    const wrap = wrapRef.current;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const gap = 4;
        const { height: vh } = getLayoutViewportSize();
        setMenuRect({
          bottom: vh - (rect.top - gap),
          left: rect.left,
          minWidth: rect.width,
        });
      });
    };

    measure();
    const unsubResize = subscribeViewportResizeOnly(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      unsubResize();
      ro.disconnect();
    };
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
        <Filter size={18} aria-hidden />
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
            {(["all", "clusters", "arranged", "corners", "edges", "colors"] as const).map(
              (opt) => (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={value === opt}
                  aria-label={`Show ${LABELS[opt]} pieces`}
                  title={`Show ${LABELS[opt]} pieces`}
                  className={value === opt ? styles.menuItemActive : styles.menuItem}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  disabled={(opt === "colors" || opt === "clusters") && !hasImage}
                >
                  <span className={styles.checkSlot}>
                    {value === opt && (
                      <Check size={14} className={styles.checkIcon} aria-hidden />
                    )}
                  </span>
                  {LABELS[opt]}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
