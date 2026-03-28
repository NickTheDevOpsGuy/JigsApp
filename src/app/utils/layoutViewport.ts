/**
 * Layout / visual viewport helpers for fixed overlays (modals, popovers).
 * Mobile Safari: use visualViewport when present so size tracks the visible chrome.
 */

export function getLayoutViewportSize(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  const vv = window.visualViewport;
  if (vv) {
    return { width: vv.width, height: vv.height };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Read left/right safe-area insets (notches, home indicator). Uses a one-off probe
 * so `env()` resolves like it does for real fixed UI.
 */
export function getSafeAreaInsetsHorizontal(): { left: number; right: number } {
  if (typeof document === "undefined") return { left: 0, right: 0 };
  const probe = document.createElement("div");
  probe.setAttribute("data-safe-area-probe", "");
  probe.style.cssText =
    "position:fixed;visibility:hidden;left:0;top:0;width:0;height:0;" +
    "padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px);";
  document.documentElement.appendChild(probe);
  const s = getComputedStyle(probe);
  const left = parseFloat(s.paddingLeft) || 0;
  const right = parseFloat(s.paddingRight) || 0;
  document.documentElement.removeChild(probe);
  return { left, right };
}

/**
 * Resize + scroll (capture) on window and visualViewport when available.
 * Coalesce work with requestAnimationFrame in your callback if needed.
 */
export function subscribeViewportLayoutChanges(onEvent: () => void): () => void {
  window.addEventListener("resize", onEvent, { passive: true });
  window.addEventListener("scroll", onEvent, true);
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", onEvent);
    vv.addEventListener("scroll", onEvent);
  }
  return () => {
    window.removeEventListener("resize", onEvent);
    window.removeEventListener("scroll", onEvent, true);
    if (vv) {
      vv.removeEventListener("resize", onEvent);
      vv.removeEventListener("scroll", onEvent);
    }
  };
}

/** Window + visualViewport resize only (no scroll) — e.g. header menu position without closing on scroll. */
export function subscribeViewportResizeOnly(onEvent: () => void): () => void {
  window.addEventListener("resize", onEvent, { passive: true });
  const vv = window.visualViewport;
  vv?.addEventListener("resize", onEvent);
  return () => {
    window.removeEventListener("resize", onEvent);
    vv?.removeEventListener("resize", onEvent);
  };
}
