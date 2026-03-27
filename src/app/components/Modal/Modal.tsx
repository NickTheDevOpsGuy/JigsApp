//
// src/app/components/Modal/Modal.tsx
import React, { useEffect, useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./Modal.module.css";
import { Button } from "@/components/Button/Button";

const FOCUSABLE = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const BODY_SCROLL_LOCK_ATTR = "data-modal-lock-count";
const BODY_SCROLL_Y_ATTR = "data-modal-scroll-y";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  variant?: string;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  variant,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape key + trap focus inside modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) {
        e.preventDefault();
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
      } else {
        if (!active || active === last || !dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDown);

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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      const currentLockCount = Number(body.getAttribute(BODY_SCROLL_LOCK_ATTR) ?? "1");
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
        body.removeAttribute(BODY_SCROLL_LOCK_ATTR);
        const scrollY = Number(body.getAttribute(BODY_SCROLL_Y_ATTR) ?? "0");
        body.removeAttribute(BODY_SCROLL_Y_ATTR);
        window.scrollTo(0, scrollY);
      } else {
        body.setAttribute(BODY_SCROLL_LOCK_ATTR, String(remainingLockCount));
      }
    };
  }, [isOpen, handleKeyDown]);

  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      data-variant={variant}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        data-variant={variant}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
      >
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
                title="Close"
              >
                <X size={20} aria-hidden />
              </button>
            )}
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// Convenience component for confirm dialogs
type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  /** When true, only show the primary (confirm) button; no cancel. */
  primaryOnlyConfirm?: boolean;
  /** When false, do not auto-call onClose after confirm. */
  closeOnConfirm?: boolean;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  primaryOnlyConfirm = false,
  closeOnConfirm = true,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {!primaryOnlyConfirm && (
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
        )}
        <Button
          variant={variant === "danger" ? "primary" : "primary"}
          onClick={() => {
            onConfirm();
            if (closeOnConfirm) onClose();
          }}
          className={variant === "danger" ? styles.dangerBtn : ""}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export default Modal;
