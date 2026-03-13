import React, { useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./AppModal.module.css";

type AppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: "md" | "wide" | "xl";
  surface?: "default" | "bare";
  tone?: "default" | "celebration";
  bodyClassName?: string;
  panelClassName?: string;
  closeLabel?: string;
};

export function AppModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showCloseButton = true,
  size = "md",
  surface = "default",
  tone = "default",
  bodyClassName,
  panelClassName,
  closeLabel = "Close",
}: AppModalProps) {
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown, isOpen]);

  if (!isOpen) return null;

  const panelSizeClass =
    size === "xl" ? styles.panelXl : size === "wide" ? styles.panelWide : "";

  return createPortal(
    <div
      className={`${styles.overlay} ${tone === "celebration" ? styles.overlayCelebration : ""}`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        className={`${styles.panel} ${panelSizeClass} ${surface === "bare" ? styles.panelBare : ""} ${panelClassName ?? ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {(title || subtitle || showCloseButton) && (
          <header className={styles.header}>
            <div className={styles.headerText}>
              {title ? (
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
              ) : null}
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label={closeLabel}
              >
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}
          </header>
        )}
        <div
          className={`${styles.body} ${surface === "bare" ? styles.bodyBare : ""} ${bodyClassName ?? ""}`}
        >
          {children}
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default AppModal;
