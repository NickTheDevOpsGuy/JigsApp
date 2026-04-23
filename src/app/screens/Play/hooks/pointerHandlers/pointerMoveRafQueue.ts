export function createPointerMoveRafQueue(
  onFlush: (clientX: number, clientY: number, pointerType: string) => void,
) {
  let queuedClientX = 0;
  let queuedClientY = 0;
  let queuedPointerType = "mouse";
  let rafId: number | null = null;

  const flush = () => {
    rafId = null;
    onFlush(queuedClientX, queuedClientY, queuedPointerType);
  };

  return {
    queue(clientX: number, clientY: number, pointerType: string = "mouse") {
      queuedClientX = clientX;
      queuedClientY = clientY;
      queuedPointerType = pointerType;
      if (rafId != null) return;
      rafId = requestAnimationFrame(flush);
    },
    clear() {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
