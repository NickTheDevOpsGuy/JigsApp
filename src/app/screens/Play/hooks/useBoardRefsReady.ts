import { useLayoutEffect, useRef, useState } from "react";
import type React from "react";

export function useBoardRefsReady(
  mainRef: React.RefObject<HTMLDivElement | null>,
  boardRef: React.RefObject<HTMLDivElement | null>,
) {
  const [refsReady, setRefsReady] = useState(0);
  const refsReadyFiredRef = useRef(false);

  useLayoutEffect(() => {
    if (refsReadyFiredRef.current) return;
    if (mainRef.current && boardRef.current) {
      refsReadyFiredRef.current = true;
      setRefsReady((r) => r + 1);
      return;
    }
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (refsReadyFiredRef.current) return;
        if (mainRef.current && boardRef.current) {
          refsReadyFiredRef.current = true;
          setRefsReady((r) => r + 1);
        }
      });
    });
    return () => cancelAnimationFrame(rafId);
  });

  return refsReady;
}
