/**
 * useSetupScreenGalleryScroll – gallery scroll ref and left/right overflow state.
 */
import { useRef, useState, useEffect } from "react";

export function useSetupScreenGalleryScroll(deps: unknown[]) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = scrollWidth - clientWidth;
      const hasOverflow = maxScroll > 8;
      setCanScrollLeft(hasOverflow && scrollLeft > 4);
      setCanScrollRight(hasOverflow && scrollLeft < maxScroll - 4);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const t = setTimeout(update, 100);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      clearTimeout(t);
    };
  }, deps);

  return { galleryRef, canScrollLeft, canScrollRight };
}
