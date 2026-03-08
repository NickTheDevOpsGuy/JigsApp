export function createPointerMoveRafQueue(
  onFlush: (clientX: number, clientY: number) => void,
) {
  let queuedClientX = 0;
  let queuedClientY = 0;
  let rafId: number | null = null;

  const flush = () => {
    rafId = null;
    onFlush(queuedClientX, queuedClientY);
  };

  return {
    queue(clientX: number, clientY: number) {
      queuedClientX = clientX;
      queuedClientY = clientY;
      if (rafId != null) return;
      rafId = requestAnimationFrame(flush);
    },
    clear() {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
