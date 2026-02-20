/**
 * PuzzleGradientBackground – subtle animated gradient derived from puzzle image colors.
 * Respects prefers-reduced-motion; uses static gradient when reduced.
 */
import React, { useEffect, useState } from "react";
import { extractDominantColors } from "@/puzzle/dominantColors";
import styles from "./PuzzleGradientBackground.module.css";

type Props = {
  img: HTMLImageElement | null;
  puzzleKey: string | number;
};

export function PuzzleGradientBackground({ img, puzzleKey }: Props) {
  const [colors, setColors] = useState<[string, string, string] | null>(null);

  useEffect(() => {
    if (!img) {
      setColors(null);
      return;
    }
    if (img.complete && img.naturalWidth > 0) {
      const result = extractDominantColors(img);
      setColors(result?.colors ?? null);
    } else {
      const onLoad = () => {
        const result = extractDominantColors(img);
        setColors(result?.colors ?? null);
      };
      img.addEventListener("load", onLoad);
      return () => img.removeEventListener("load", onLoad);
    }
  }, [img, puzzleKey]);

  if (!colors) return null;

  return (
    <div
      className={styles.gradient}
      style={
        {
          "--gradient-c1": colors[0],
          "--gradient-c2": colors[1],
          "--gradient-c3": colors[2],
        } as React.CSSProperties
      }
      aria-hidden
    />
  );
}
