/**
 * Body scroll lock shared with Modal.tsx (data-modal-lock-count).
 * Nested opens increment the counter; only the last close restores scroll.
 */
import { useEffect } from "react";

export const MODAL_BODY_LOCK_ATTR = "data-modal-lock-count";
export const MODAL_BODY_SCROLL_Y_ATTR = "data-modal-scroll-y";

export function useModalBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const root = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const prevBodyHeight = body.style.height;
    const prevBodyInset = body.style.inset;
    const prevRootOverflow = root.style.overflow;
    const prevRootHeight = root.style.height;
    const existingLockCount = Number(body.getAttribute(MODAL_BODY_LOCK_ATTR) ?? "0");
    const nextLockCount = existingLockCount + 1;

    body.setAttribute(MODAL_BODY_LOCK_ATTR, String(nextLockCount));
    if (existingLockCount === 0) {
      const scrollY = window.scrollY;
      body.setAttribute(MODAL_BODY_SCROLL_Y_ATTR, String(scrollY));
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.inset = "0";
      body.style.width = "100%";
      body.style.height = "100dvh";
      root.style.overflow = "hidden";
      root.style.height = "100dvh";
    }

    return () => {
      const currentLockCount = Number(body.getAttribute(MODAL_BODY_LOCK_ATTR) ?? "1");
      const remainingLockCount = Math.max(0, currentLockCount - 1);
      if (remainingLockCount === 0) {
        body.style.overflow = prevBodyOverflow;
        body.style.position = prevBodyPosition;
        body.style.top = prevBodyTop;
        body.style.width = prevBodyWidth;
        body.style.height = prevBodyHeight;
        body.style.inset = prevBodyInset;
        root.style.overflow = prevRootOverflow;
        root.style.height = prevRootHeight;
        body.removeAttribute(MODAL_BODY_LOCK_ATTR);
        const scrollY = Number(body.getAttribute(MODAL_BODY_SCROLL_Y_ATTR) ?? "0");
        body.removeAttribute(MODAL_BODY_SCROLL_Y_ATTR);
        window.scrollTo(0, scrollY);
      } else {
        body.setAttribute(MODAL_BODY_LOCK_ATTR, String(remainingLockCount));
      }
    };
  }, [isOpen]);
}
