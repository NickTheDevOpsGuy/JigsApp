/**
 * usePieceTrayScroll – scroll container ref, progress, and scroll-by for the tray.
 */
import { useRef, useState, useCallback, useEffect } from "react";

function getHorizontalScrollMetrics(el: HTMLDivElement) {
  const paddingStart = 12;
  const paddingEnd = 12;
  const row = el.firstElementChild as HTMLElement | null;
  const contentWidth =
    row && row.offsetWidth > 0
      ? paddingStart + row.offsetWidth + paddingEnd
      : el.scrollWidth;
  const maxScroll = Math.max(0, contentWidth - el.clientWidth);
  const clamped = Math.max(0, Math.min(maxScroll, el.scrollLeft));
  return { maxScroll, clamped };
}

function getTraySnapPitchPx(el: HTMLDivElement): number {
  const row = el.firstElementChild as HTMLElement | null;
  const first = row?.querySelector<HTMLElement>("button");
  if (!first) return 64;
  const second = first.nextElementSibling as HTMLElement | null;
  if (second) {
    const delta = second.offsetLeft - first.offsetLeft;
    if (delta > 0) return delta;
  }
  return first.offsetWidth || 64;
}

function getProgrammaticScrollBehavior(el: HTMLDivElement): ScrollBehavior {
  if (typeof window !== "undefined") {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReducedMotion.matches) {
      return "auto";
    }
  }

  return getComputedStyle(el).scrollBehavior === "smooth" ? "smooth" : "auto";
}

export function usePieceTrayScroll(displayedLength: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollProgress = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { maxScroll, clamped } = getHorizontalScrollMetrics(el);
    const scrollLeft = el.scrollLeft;
    if (clamped !== scrollLeft) {
      el.scrollLeft = clamped;
    }
    const threshold = 2;
    const hasOverflow = maxScroll > threshold;
    setCanScroll(hasOverflow);
    setCanScrollLeft(hasOverflow && clamped > threshold);
    setCanScrollRight(hasOverflow && clamped < maxScroll - threshold);
    const pct = maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, clamped / maxScroll));
    setScrollProgress(pct);
  }, []);

  const scrollBy = useCallback((delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const { maxScroll } = getHorizontalScrollMetrics(el);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + delta));
    el.scrollTo({ left: target, behavior: getProgrammaticScrollBehavior(el) });
  }, []);

  /** Scroll by one piece (snap pitch) so scroll stops align with full pieces. */
  const scrollByOnePiece = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const pitch = getTraySnapPitchPx(el);
    const stepPx = Math.max(80, pitch);
    const step = stepPx * direction;
    const { maxScroll } = getHorizontalScrollMetrics(el);
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + step));
    el.scrollTo({ left: target, behavior: getProgrammaticScrollBehavior(el) });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const isIOS =
      typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

    let touchLastX: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        touchLastX = event.touches[0].clientX;
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || touchLastX == null) return;
      const x = event.touches[0].clientX;
      const dx = x - touchLastX;
      touchLastX = x;

      const { maxScroll, clamped } = getHorizontalScrollMetrics(el);
      const atLeft = clamped <= 1;
      const atRight = clamped >= maxScroll - 1;
      if ((atLeft && dx > 0) || (atRight && dx < 0)) {
        // Prevent iOS rubber-band from revealing blank space outside the tray content.
        event.preventDefault();
        el.scrollLeft = atLeft ? 0 : maxScroll;
      }
    };
    const onTouchDone = () => {
      touchLastX = null;
      if (isIOS && displayedLength > 0) {
        // Nudge to nearest slot pitch so pieces rest fully visible.
        const stepPx = getTraySnapPitchPx(el);
        const { maxScroll } = getHorizontalScrollMetrics(el);
        const aligned = Math.max(
          0,
          Math.min(maxScroll, Math.round(el.scrollLeft / stepPx) * stepPx),
        );
        requestAnimationFrame(() => {
          el.scrollTo({ left: aligned, behavior: getProgrammaticScrollBehavior(el) });
        });
      }
      run();
    };

    const run = () => {
      updateScrollProgress();
      requestAnimationFrame(() => requestAnimationFrame(updateScrollProgress));
      setTimeout(updateScrollProgress, 0);
      setTimeout(updateScrollProgress, 150);
      setTimeout(updateScrollProgress, 400);
    };
    run();
    el.addEventListener("scroll", updateScrollProgress);
    el.addEventListener("scrollend", run);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchDone, { passive: true });
    el.addEventListener("touchcancel", onTouchDone, { passive: true });
    const ro = new ResizeObserver(run);
    ro.observe(el);
    const t1 = setTimeout(updateScrollProgress, 0);
    const t2 = setTimeout(updateScrollProgress, 150);
    const t3 = setTimeout(updateScrollProgress, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      el.removeEventListener("scroll", updateScrollProgress);
      el.removeEventListener("scrollend", run);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchDone);
      el.removeEventListener("touchcancel", onTouchDone);
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
    scrollByOnePiece,
  };
}
