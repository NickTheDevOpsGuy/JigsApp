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
    const maxScroll = scrollWidth - clientWidth;
    const hasOverflow = maxScroll > 8;
    setCanScroll(hasOverflow);
    setCanScrollLeft(hasOverflow && scrollLeft > 4);
    setCanScrollRight(hasOverflow && scrollLeft < maxScroll - 4);
    const pct = maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(pct);
  }, []);

  const scrollBy = useCallback((delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
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
