/**
 * Replay callbacks may be sync or async; always void the promise to avoid unhandled rejections.
 */
export type ReplayVoidCb = () => void | Promise<void>;
export type ReplaySeekCb = (index: number) => void | Promise<void>;
export type ReplaySpeedCb = (speed: number) => void | Promise<void>;
export function invokeMaybeAsync(fn: () => void | Promise<void>): void {
  void Promise.resolve(fn()).catch(() => {});
}

export function invokeMaybeAsyncIndex(
  fn: ((index: number) => void | Promise<void>) | undefined,
  index: number,
): void {
  if (!fn) return;
  void Promise.resolve(fn(index)).catch(() => {});
}

export function invokeMaybeAsyncSpeed(
  fn: (speed: number) => void | Promise<void>,
  speed: number,
): void {
  void Promise.resolve(fn(speed)).catch(() => {});
}
