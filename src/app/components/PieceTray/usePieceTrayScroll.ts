/**
 * usePieceTrayScroll – scroll container ref, progress, and scroll-by for the tray.
 */
import { useRef, useState, useCallback, useEffect } from "react";

export function usePieceTrayScroll(displayedLength: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollProgress = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const clamped = Math.max(0, Math.min(maxScroll, scrollLeft));
    if (clamped !== scrollLeft) {
      el.scrollLeft = clamped;
    }
    const hasOverflow = maxScroll > 8;
    setCanScroll(hasOverflow);
    setCanScrollLeft(hasOverflow && clamped > 4);
    setCanScrollRight(hasOverflow && clamped < maxScroll - 4);
    const pct = maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, clamped / maxScroll));
    setScrollProgress(pct);
  }, []);

  const scrollBy = useCallback((delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + delta));
    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const run = () => {
      updateScrollProgress();
      if (displayedLength > 20) {
        requestAnimationFrame(() => requestAnimationFrame(updateScrollProgress));
        setTimeout(updateScrollProgress, 150);
        setTimeout(updateScrollProgress, 400);
      }
    };
    run();
    el.addEventListener("scroll", updateScrollProgress);
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollProgress);
      ro.disconnect();
    };
  }, [updateScrollProgress, displayedLength]);

  return {
    scrollerRef,
    scrollProgress,
    canScroll,
    canScrollLeft,
    canScrollRight,
    scrollBy,
  };
}
