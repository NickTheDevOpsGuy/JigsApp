import { useEffect, useState } from "react";

/**
 * True when the primary pointer is coarse (touch-first).
 *
 * Safari has multiple APIs across versions. We support both:
 * - matchMedia(...).addEventListener('change', ...)
 * - matchMedia(...).addListener(...)
 */
export function useCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(pointer: coarse)");
    if (!mq) return;

    const update = () => setIsCoarse(!!mq.matches);
    update();

    const anyMq = mq as unknown as {
      addEventListener?: (type: string, cb: () => void) => void;
      removeEventListener?: (type: string, cb: () => void) => void;
      addListener?: (cb: () => void) => void;
      removeListener?: (cb: () => void) => void;
    };

    if (anyMq.addEventListener) anyMq.addEventListener("change", update);
    else anyMq.addListener?.(update);

    return () => {
      if (anyMq.removeEventListener) anyMq.removeEventListener("change", update);
      else anyMq.removeListener?.(update);
    };
  }, []);

  return isCoarse;
}
