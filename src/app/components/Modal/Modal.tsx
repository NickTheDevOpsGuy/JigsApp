//
// src/app/components/Modal/Modal.tsx
import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import { Button } from "@/components/Button/Button";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const el = modalRef.current;
      if (!el) return;
      const focusable = getFocusableElements(el);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const { activeElement } = document;
      if (e.shiftKey) {
        if (activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        const el = modalRef.current;
        if (!el) return;
        const focusable = getFocusableElements(el);
        if (focusable.length > 0) focusable[0].focus();
      });
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previousActiveRef.current?.focus) {
        previousActiveRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
              >
                ×
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
  tertiaryText?: string;
  onTertiary?: () => void;
  variant?: "danger" | "default";
  /** When true, primary button only calls onConfirm (for async close flows) */
  primaryOnlyConfirm?: boolean;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tertiaryText,
  onTertiary,
  variant = "default",
  primaryOnlyConfirm = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={() => {
            onConfirm();
            if (!primaryOnlyConfirm) onClose();
          }}
          className={`${styles.confirmModalBtn} ${variant === "danger" ? styles.dangerBtn : ""}`.trim()}
        >
          {confirmText}
        </Button>
        <Button variant="secondary" onClick={onClose} className={styles.confirmModalBtn}>
          {cancelText}
        </Button>
        {tertiaryText && onTertiary && (
          <Button
            variant="secondary"
            onClick={onTertiary}
            className={styles.confirmModalBtn}
          >
            {tertiaryText}
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default Modal;
