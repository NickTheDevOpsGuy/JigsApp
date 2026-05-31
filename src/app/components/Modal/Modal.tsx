//
// src/app/components/Modal/Modal.tsx
import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./Modal.module.css";
import { Button } from "@/components/Button/Button";
import { useModalBodyScrollLock } from "@/hooks/useModalBodyScrollLock";
import { useDialogKeyboard, DIALOG_FOCUSABLE_SELECTOR } from "@/hooks/useDialogKeyboard";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  variant?: string;
  contentClassName?: string;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  variant,
  contentClassName,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useModalBodyScrollLock(isOpen);
  useDialogKeyboard(isOpen, dialogRef, onClose);

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const focusRaf = window.requestAnimationFrame(() => {
      const dialogEl = dialogRef.current;
      if (!dialogEl) return;
      const firstFocusable = dialogEl.querySelector<HTMLElement>(
        DIALOG_FOCUSABLE_SELECTOR,
      );
      (firstFocusable ?? dialogEl).focus({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(focusRaf);

      const prevFocus = restoreFocusRef.current;
      if (
        prevFocus &&
        typeof prevFocus.focus === "function" &&
        document.contains(prevFocus)
      ) {
        window.requestAnimationFrame(() => {
          prevFocus.focus({ preventScroll: true });
        });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className={styles.overlay}
        data-variant={variant}
        onClick={onClose}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        role="presentation"
        tabIndex={-1}
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
          onKeyDown={(e) => e.stopPropagation()}
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
          <div className={`${styles.content} ${contentClassName ?? ""}`.trim()}>
            {children}
          </div>
        </div>
      </div>
    </>,
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
  const messageId = useId();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton>
      <p id={messageId} className={styles.message}>
        {message}
      </p>
      <div className={styles.actions}>
        {!primaryOnlyConfirm && (
          <Button variant="secondary" onClick={onClose} aria-describedby={messageId}>
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
          aria-describedby={messageId}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export default Modal;
