/**
 * useSetupScreenGalleryScroll – gallery scroll ref, left/right overflow, and progress for blue bar.
 */
import { useRef, useState, useEffect } from "react";

export function useSetupScreenGalleryScroll(deps: unknown[]) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      const threshold = 2;
      const hasOverflow = maxScroll > threshold;
      setCanScrollLeft(hasOverflow && scrollLeft > threshold);
      setCanScrollRight(hasOverflow && scrollLeft < maxScroll - threshold);
      setScrollProgress(maxScroll <= 0 ? 0 : scrollLeft / maxScroll);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const t1 = setTimeout(update, 0);
    const t2 = setTimeout(update, 150);
    const t3 = setTimeout(update, 400);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, deps);

  return { galleryRef, canScrollLeft, canScrollRight, scrollProgress };
}
