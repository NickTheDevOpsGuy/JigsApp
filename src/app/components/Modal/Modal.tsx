//
// src/app/components/Modal/Modal.tsx
import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import { Button } from "@/components/Button/Button";

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
  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div
        className={styles.modal}
        data-variant={variant}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
      >
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {showCloseButton && (
              <button className={styles.closeBtn} onClick={onClose}>
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
  variant?: "danger" | "default";
  /** When true, only show the primary (confirm) button; no cancel. */
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
  variant = "default",
  primaryOnlyConfirm = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
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
            onClose();
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
