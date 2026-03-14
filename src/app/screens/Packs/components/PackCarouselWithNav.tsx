/**
 * PackCarouselWithNav – horizontal pack carousel with left/right arrows and scroll progress.
 * Scrolls by one card width; arrows disable at start/end; progress bar reflects scroll position.
 */
import React, { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./PuzzlePackModule.module.css";

type PackCarouselWithNavProps = {
  children: React.ReactNode;
};

export function PackCarouselWithNav({ children }: PackCarouselWithNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setScrollProgress(scrollLeft / maxScroll);
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollByOneCard = useCallback((direction: 1 | -1) => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const firstCard = track.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth : 280;
    const gap = 22;
    const step = (cardWidth + gap) * direction;
    el.scrollBy({ left: step, behavior: "smooth" });
  }, []);

  return (
    <div className={styles.carouselWithNavWrap}>
      <div className={styles.carouselNavRow}>
        <button
          type="button"
          className={styles.carouselNavBtn}
          onClick={() => scrollByOneCard(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll packs left"
          title="Previous"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
        <div
          ref={scrollRef}
          className={styles.packScrollViewport}
          role="region"
          aria-label="Puzzle packs"
        >
          <div ref={trackRef} className={styles.carousel}>
            {children}
          </div>
        </div>
        <button
          type="button"
          className={styles.carouselNavBtn}
          onClick={() => scrollByOneCard(1)}
          disabled={!canScrollRight}
          aria-label="Scroll packs right"
          title="Next"
        >
          <ChevronRight size={22} aria-hidden />
        </button>
      </div>
      <div className={styles.scrollProgressWrap} aria-hidden="true">
        <div className={styles.scrollProgressTrack}>
          <div
            className={styles.scrollProgressFill}
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
