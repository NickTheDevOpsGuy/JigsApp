/**
 * AppModal – richer modal used for win screen and share menus.
 * Supports surface, size, tone, subtitle, bodyClassName props.
 */
import React, { useEffect, useCallback, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./AppModal.module.css";

const BODY_SCROLL_LOCK_ATTR = "data-app-modal-lock-count";
const BODY_SCROLL_Y_ATTR = "data-app-modal-scroll-y";

/** Only the topmost open AppModal handles Escape + Tab trap (nested modals e.g. share on win screen). */
const modalStack: Array<React.RefObject<HTMLDivElement | null>> = [];

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type AppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  /** "bare" = no header padding, content fills top */
  surface?: "default" | "bare";
  /** "xl" = wide centered card; "wide" = slightly wider for share menus */
  size?: "default" | "xl" | "wide";
  /** "celebration" = gradient border + festive backdrop */
  tone?: "default" | "celebration";
  /** "top" = align dialog near top of viewport instead of centered */
  align?: "center" | "top";
  /** Top padding used when align="top" */
  topOffsetPx?: number;
  bodyClassName?: string;
  /** Extra classes on the backdrop (e.g. overflow: hidden for fit-to-viewport overlays). */
  backdropClassName?: string;
  /** Extra classes on the dialog shell (e.g. overflow: hidden). */
  dialogClassName?: string;
  /** Accessible name for the close button (default "Close"). */
  closeLabel?: string;
  /**
   * When false, tapping the dimmed backdrop does not call onClose (win screen, etc.).
   * Default true for standard dismissible modals.
   */
  closeOnBackdropClick?: boolean;
};

export function AppModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showCloseButton = true,
  surface = "default",
  size = "default",
  tone = "default",
  align = "center",
  topOffsetPx = 16,
  bodyClassName,
  backdropClassName,
  dialogClassName,
  closeLabel = "Close",
  closeOnBackdropClick = true,
}: AppModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const accessibleName = useMemo(() => title ?? "Dialog", [title]);

  const isTopModal = useCallback(
    () => modalStack.length > 0 && modalStack[modalStack.length - 1] === dialogRef,
    [],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!isTopModal()) return;
      e.preventDefault();
      onClose();
    },
    [onClose, isTopModal],
  );

  const trapFocus = useCallback(
    (e: KeyboardEvent) => {
      if (!isTopModal()) return;
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first || !dialogRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !dialogRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    },
    [isTopModal],
  );

  useEffect(() => {
    if (!isOpen) return;
    modalStack.push(dialogRef);
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", trapFocus);

    const body = document.body;
    const root = document.documentElement;
    const prev = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const prevBodyHeight = body.style.height;
    const prevBodyInset = body.style.inset;
    const prevRootOverflow = root.style.overflow;
    const prevRootHeight = root.style.height;
    const existingLockCount = Number(body.getAttribute(BODY_SCROLL_LOCK_ATTR) ?? "0");
    const nextLockCount = existingLockCount + 1;
    body.setAttribute(BODY_SCROLL_LOCK_ATTR, String(nextLockCount));
    if (existingLockCount === 0) {
      const scrollY = window.scrollY;
      body.setAttribute(BODY_SCROLL_Y_ATTR, String(scrollY));
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.inset = "0";
      body.style.width = "100%";
      body.style.height = "100dvh";
      root.style.overflow = "hidden";
      root.style.height = "100dvh";
    }

    const focusTarget = window.requestAnimationFrame(() => {
      if (!isTopModal()) return;
      const dialogEl = dialogRef.current;
      if (!dialogEl) return;
      const firstFocusable = dialogEl.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? dialogEl).focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusTarget);
      const idx = modalStack.lastIndexOf(dialogRef);
      if (idx >= 0) modalStack.splice(idx, 1);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", trapFocus);

      const currentLockCount = Number(body.getAttribute(BODY_SCROLL_LOCK_ATTR) ?? "1");
      const remainingLockCount = Math.max(0, currentLockCount - 1);
      if (remainingLockCount === 0) {
        body.style.overflow = prev;
        body.style.position = prevBodyPosition;
        body.style.top = prevBodyTop;
        body.style.inset = prevBodyInset;
        body.style.width = prevBodyWidth;
        body.style.height = prevBodyHeight;
        root.style.overflow = prevRootOverflow;
        root.style.height = prevRootHeight;
        body.removeAttribute(BODY_SCROLL_LOCK_ATTR);
        const scrollY = Number(body.getAttribute(BODY_SCROLL_Y_ATTR) ?? "0");
        body.removeAttribute(BODY_SCROLL_Y_ATTR);
        window.scrollTo(0, scrollY);
      } else {
        body.setAttribute(BODY_SCROLL_LOCK_ATTR, String(remainingLockCount));
      }

      const restoreTarget = restoreFocusRef.current;
      if (restoreTarget && document.contains(restoreTarget)) {
        window.requestAnimationFrame(() => {
          restoreTarget.focus({ preventScroll: true });
        });
      }
    };
  }, [isOpen, handleKeyDown, trapFocus, isTopModal]);

  if (!isOpen) return null;

  const dialogClass = [
    styles.dialog,
    size === "xl" ? styles.sizeXl : size === "wide" ? styles.sizeWide : "",
    surface === "bare" ? styles.surfaceBare : "",
    tone === "celebration" ? styles.toneCelebration : "",
    dialogClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const backdropClass = [
    styles.backdrop,
    align === "top" ? styles.backdropTop : "",
    tone === "celebration" ? styles.backdropSolid : "",
    backdropClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className={backdropClass}
      style={
        align === "top"
          ? { paddingTop: `max(${topOffsetPx}px, env(safe-area-inset-top, 0px))` }
          : undefined
      }
      onClick={
        closeOnBackdropClick
          ? (e: React.MouseEvent<HTMLDivElement>) => {
              if (e.target === e.currentTarget) onClose();
            }
          : undefined
      }
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={dialogClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : accessibleName}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <X size={20} aria-hidden />
          </button>
        )}
        {(title || subtitle) && surface !== "bare" && (
          <div className={styles.header}>
            {title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}
        <div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
