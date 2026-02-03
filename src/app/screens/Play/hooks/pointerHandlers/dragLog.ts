import { SHOW_DEBUG } from "../../playScreenUtils";

let lastMoveMs = 0;

/** Throttled drag logging to help debug missing pointer events. */
export function dragLog(
  event: "down" | "move" | "up" | "cancel" | "lostcapture",
  data: Record<string, unknown>,
) {
  if (!SHOW_DEBUG) return;

  const now = performance.now();
  if (event === "move" && now - lastMoveMs < 80) return;
  if (event === "move") lastMoveMs = now;

  console.debug(`[drag:${event}]`, data);
}
