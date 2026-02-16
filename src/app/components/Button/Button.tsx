/**
 * Button – primary, secondary, ghost, outline; sizes sm/md/lg.
 */
import React from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  "aria-pressed"?: boolean | "mixed";
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  disabled = false,
  fullWidth = false,
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classNames} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

export default Button;
