export const MENU_REFRESH_EVENT = "phuzzle:menu-refresh";

export function dispatchMenuRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MENU_REFRESH_EVENT));
}
