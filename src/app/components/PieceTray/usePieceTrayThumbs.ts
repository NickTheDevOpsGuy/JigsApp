/**
 * usePieceTrayThumbs – batched thumbnail generation for tray pieces.
 * Effect key is stable when only board pieces change (e.g. rotate on canvas)
 * so tray thumbs don't flicker or "spin" during canvas rotation.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import type { Piece } from "@/puzzle/core/types";
import { renderTrayPiece } from "@/puzzle/canvas/render/renderTrayPiece";
import { canvasToObjectUrl, revokeObjectUrls, yieldToMainThread } from "@/utils/async";

const BATCH_SIZE = 12;

/** Stable key: only changes when tray piece set or their rotations change. */
function trayVisualKey(displayed: Piece[]): string {
  return displayed
    .map((p) => `${p.id}:${p.rotation}`)
    .sort()
    .join(",");
}

export function usePieceTrayThumbs(
  displayed: Piece[],
  image: HTMLImageElement | null,
  grid: { rows: number; cols: number },
  thumbSize: number,
  compact: boolean,
) {
  const [thumbsById, setThumbsById] = useState<Map<string, string>>(new Map());
  const [imageLoadCount, setImageLoadCount] = useState(0);
  const displayedRef = useRef(displayed);
  const urlsRef = useRef<Map<string, string>>(new Map());
  displayedRef.current = displayed;

  const key = useMemo(() => trayVisualKey(displayed), [displayed]);

  useEffect(() => {
    if (!image || displayed.length === 0) {
      revokeObjectUrls(urlsRef.current.values());
      urlsRef.current = new Map();
      setThumbsById(new Map());
      return;
    }
    if (!image.complete || image.naturalWidth === 0) {
      const onLoad = () => setImageLoadCount((c) => c + 1);
      image.addEventListener("load", onLoad);
      return () => image.removeEventListener("load", onLoad);
    }

    // Keep only a small inset so the rendered piece remains visually large in tray slots.
    const inset = compact ? 4 : 3;
    const maxW = Math.max(24, thumbSize - inset * 2);
    const maxH = Math.max(24, thumbSize - inset * 2);
    const assembledW = grid.cols * (displayed[0]?.tileW ?? 1);
    const assembledH = grid.rows * (displayed[0]?.tileH ?? 1);

    const renderOne = async (p: Piece): Promise<string | null> => {
      try {
        if (!p.w || !p.h || p.w <= 0 || p.h <= 0) return null;
        // Use the larger dimension to ensure square canvas fits rotated piece
        const maxPieceDim = Math.max(p.w, p.h);
        const baseScale = Math.min(maxW / maxPieceDim, maxH / maxPieceDim);
        // Slightly over-scale so tray pieces are easier to see/tap on mobile.
        const boostedScale = baseScale * (compact ? 1.16 : 1.12);
        const scale = Math.min(
          boostedScale,
          (maxW + 10) / maxPieceDim,
          (maxH + 10) / maxPieceDim,
        );
        if (!Number.isFinite(scale) || scale <= 0) return null;
        const c = renderTrayPiece(p, image, assembledW, assembledH, scale);
        return await canvasToObjectUrl(c, "image/png");
      } catch {
        return null;
      }
    };

    if (displayed.length < 60) {
      let cancelled = false;
      void (async () => {
        await yieldToMainThread();
        const entries = await Promise.all(
          displayed.map(async (p) => [p.id, await renderOne(p)] as const),
        );
        const next = new Map<string, string>();
        for (const [id, url] of entries) {
          if (url) next.set(id, url);
        }
        if (cancelled) {
          revokeObjectUrls(next.values());
          return;
        }
        revokeObjectUrls(urlsRef.current.values());
        urlsRef.current = next;
        setThumbsById(next);
      })();
      return () => {
        cancelled = true;
      };
      return;
    }

    revokeObjectUrls(urlsRef.current.values());
    urlsRef.current = new Map();
    setThumbsById(new Map());
    let cancelled = false;
    let index = 0;

    const processBatch = async () => {
      if (cancelled) return;
      const current = displayedRef.current;
      const next = new Map<string, string>();
      const end = Math.min(index + BATCH_SIZE, current.length);
      await yieldToMainThread();
      for (let i = index; i < end; i++) {
        const p = current[i];
        const data = await renderOne(p);
        if (data) next.set(p.id, data);
      }
      if (cancelled) {
        revokeObjectUrls(next.values());
        return;
      }
      setThumbsById((prev) => {
        const merged = new Map(prev);
        next.forEach((v, k) => merged.set(k, v));
        urlsRef.current = merged;
        return merged;
      });
      index += BATCH_SIZE;
      if (index < displayedRef.current.length) {
        requestAnimationFrame(() => {
          void processBatch();
        });
      }
    };

    void processBatch();
    return () => {
      cancelled = true;
    };
  }, [key, image, grid, thumbSize, compact, imageLoadCount]);

  useEffect(() => {
    return () => {
      revokeObjectUrls(urlsRef.current.values());
      urlsRef.current = new Map();
    };
  }, []);

  return thumbsById;
}
