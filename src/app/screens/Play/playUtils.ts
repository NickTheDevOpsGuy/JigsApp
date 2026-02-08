export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export { formatTime } from "@/utils/timeUtils";

export function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;

  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}
