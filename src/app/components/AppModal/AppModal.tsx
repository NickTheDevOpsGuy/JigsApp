/**
 * AppModal – richer modal used for win screen and share menus.
 * Supports surface, size, tone, subtitle, bodyClassName props.
 */
import React, { useEffect, useCallback, useId } from "react";
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
  /** "bare" = no header padding, content fills top */
  surface?: "default" | "bare";
  /** "xl" = wide centered card; "wide" = slightly wider for share menus */
  size?: "default" | "xl" | "wide";
  /** "celebration" = gradient border + festive backdrop */
  tone?: "default" | "celebration";
  bodyClassName?: string;
  /** Accessible name for the close button (default "Close"). */
  closeLabel?: string;
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
  bodyClassName,
  closeLabel = "Close",
}: AppModalProps) {
  const titleId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const dialogClass = [
    styles.dialog,
    size === "xl" ? styles.sizeXl : size === "wide" ? styles.sizeWide : "",
    surface === "bare" ? styles.surfaceBare : "",
    tone === "celebration" ? styles.toneCelebration : "",
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={dialogClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
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
